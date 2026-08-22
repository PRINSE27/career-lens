import prisma from "./prisma.js";
import { searchAdzunaJobs } from "./adzunaService.js";

// ============================================================
// TYPES
// ============================================================

type AdzunaJob = {
  id?: string | number;
  title?: string;
  description?: string;
  redirect_url?: string;
  created?: string;

  company?: {
    display_name?: string;
  };

  location?: {
    display_name?: string;
  };

  contract_type?: string;

  salary_min?: number;
  salary_max?: number;

  category?: {
    label?: string;
  };
};

type StoredJob = {
  id: number;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string;
  description: string;
  source: string;
  externalId: string | null;
};

// ============================================================
// GET LATEST AI RESUME ANALYSIS
// ============================================================

const getLatestAnalysis = async (
  userId: number
) => {
  const analysis =
    await prisma.resumeAnalysis.findFirst({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

  if (!analysis) {
    throw new Error(
      "Please upload and analyze a resume before searching for jobs"
    );
  }

  return analysis;
};

// ============================================================
// EXTRACT CAREER SUGGESTIONS
// ============================================================

const extractCareerQueries = (
  careerSuggestions: unknown
): string[] => {
  if (!Array.isArray(careerSuggestions)) {
    return [];
  }

  return careerSuggestions
    .map((item) => {
      if (
        item &&
        typeof item === "object" &&
        "role" in item
      ) {
        const role = (
          item as {
            role?: unknown;
          }
        ).role;

        return String(role || "").trim();
      }

      return "";
    })
    .filter(Boolean)
    .slice(0, 3);
};

// ============================================================
// EXTRACT SKILL KEYWORDS
// ============================================================

const getSkillKeywords = (
  skills: unknown
): string[] => {
  if (
    !skills ||
    typeof skills !== "object" ||
    Array.isArray(skills)
  ) {
    return [];
  }

  const record =
    skills as Record<string, unknown>;

  const result: string[] = [];

  for (const value of Object.values(record)) {
    if (!Array.isArray(value)) {
      continue;
    }

    for (const item of value) {
      if (
        typeof item === "string" &&
        item.trim()
      ) {
        result.push(item.trim());
      }
    }
  }

  return result.slice(0, 8);
};

// ============================================================
// BUILD SEARCH QUERIES FROM AI PROFILE
// ============================================================

const getSearchQueries = (
  analysis: {
    careerSuggestions: unknown;
    skills: unknown;
  }
): string[] => {
  const careerQueries =
    extractCareerQueries(
      analysis.careerSuggestions
    );

  if (careerQueries.length > 0) {
    return careerQueries;
  }

  const skills =
    getSkillKeywords(
      analysis.skills
    );

  if (skills.length > 0) {
    return [
      `software developer ${skills
        .slice(0, 4)
        .join(" ")}`,
    ];
  }

  return ["software developer"];
};

// ============================================================
// NORMALIZE ADZUNA JOB
// ============================================================

const normalizeAdzunaJob = (
  job: AdzunaJob
) => {
  const title =
    job.title?.trim() ||
    "Untitled Job";

  const company =
    job.company?.display_name?.trim() ||
    "Unknown Company";

  const location =
    job.location?.display_name?.trim() ||
    null;

  const description =
    job.description?.trim() ||
    "";

  const url =
    job.redirect_url?.trim() ||
    "";

  // Adzuna can return id as a number.
  const externalId =
    job.id !== undefined &&
    job.id !== null
      ? String(job.id)
      : null;

  const remote =
    location
      ?.toLowerCase()
      .includes("remote") ||
    title
      .toLowerCase()
      .includes("remote") ||
    false;

  return {
    externalId,

    source: "adzuna",

    title,

    company,

    location,

    remote,

    url,

    description,

    employmentType:
      job.contract_type ||
      null,

    postedAt: job.created
      ? new Date(job.created)
      : null,

    requirements: {
      contractType:
        job.contract_type ||
        null,

      category:
        job.category?.label ||
        null,

      salaryMin:
        job.salary_min ??
        null,

      salaryMax:
        job.salary_max ??
        null,
    },

    skills: [],
  };
};

// ============================================================
// SEARCH JOBS FOR CANDIDATE
// ============================================================

export async function searchJobsForCandidate(
  userId: number,
  customQuery = ""
): Promise<StoredJob[]> {
  // ----------------------------------------------------------
  // Get latest AI resume analysis
  // ----------------------------------------------------------

  const analysis =
    await getLatestAnalysis(
      userId
    );

  // ----------------------------------------------------------
  // Build search queries
  // ----------------------------------------------------------

  const queries = customQuery
    ? [customQuery.trim()]
    : getSearchQueries(
        analysis
      );

  // ----------------------------------------------------------
  // Remove empty queries
  // ----------------------------------------------------------

  const validQueries =
    queries.filter(
      (query) =>
        query.trim().length > 0
    );

  if (validQueries.length === 0) {
    throw new Error(
      "Unable to generate a valid job search query"
    );
  }

  // ----------------------------------------------------------
  // Collect unique Adzuna jobs
  // ----------------------------------------------------------

  const results =
    new Map<
      string,
      AdzunaJob
    >();

  for (const query of validQueries) {
    const response =
      await searchAdzunaJobs(
        "in",
        query
      );

    const jobs =
      Array.isArray(
        response.results
      )
        ? response.results
        : [];

    for (const job of jobs) {
      const key =
        job.id !== undefined &&
        job.id !== null
          ? String(job.id)
          : job.redirect_url ||
            `${job.title || ""}-${
              job.company
                ?.display_name || ""
            }`;

      if (key) {
        results.set(key, job);
      }
    }
  }

  // ----------------------------------------------------------
  // Normalize maximum 30 unique jobs
  // ----------------------------------------------------------

  const normalizedJobs =
    Array.from(
      results.values()
    )
      .slice(0, 30)
      .map(
        normalizeAdzunaJob
      );

  const storedJobs: StoredJob[] =
    [];

  // ----------------------------------------------------------
  // Save/update jobs in PostgreSQL
  // ----------------------------------------------------------

  for (const job of normalizedJobs) {
    let savedJob =
      null;

    // --------------------------------------------------------
    // First check by Adzuna external ID
    // --------------------------------------------------------

    if (job.externalId) {
      savedJob =
        await prisma.job.findFirst({
          where: {
            source:
              job.source,

            externalId:
              job.externalId,
          },
        });
    }

    // --------------------------------------------------------
    // Fallback: check by URL
    // --------------------------------------------------------

    if (
      !savedJob &&
      job.url
    ) {
      savedJob =
        await prisma.job.findFirst({
          where: {
            source:
              job.source,

            url:
              job.url,
          },
        });
    }

    // --------------------------------------------------------
    // Update existing job
    // --------------------------------------------------------

    if (savedJob) {
      savedJob =
        await prisma.job.update({
          where: {
            id: savedJob.id,
          },

          data: {
            title:
              job.title,

            company:
              job.company,

            location:
              job.location,

            remote:
              job.remote,

            url:
              job.url,

            description:
              job.description,

            employmentType:
              job.employmentType,

            postedAt:
              job.postedAt,

            requirements:
              job.requirements,

            skills:
              job.skills,
          },
        });
    }

    // --------------------------------------------------------
    // Create new job
    // --------------------------------------------------------

    else {
      savedJob =
        await prisma.job.create({
          data: {
            externalId:
              job.externalId,

            source:
              job.source,

            title:
              job.title,

            company:
              job.company,

            location:
              job.location,

            remote:
              job.remote,

            url:
              job.url,

            description:
              job.description,

            employmentType:
              job.employmentType,

            postedAt:
              job.postedAt,

            requirements:
              job.requirements,

            skills:
              job.skills,
          },
        });
    }

    // --------------------------------------------------------
    // Return normalized database result
    // --------------------------------------------------------

    storedJobs.push({
      id: savedJob.id,

      title:
        savedJob.title,

      company:
        savedJob.company,

      location:
        savedJob.location,

      remote:
        savedJob.remote,

      url:
        savedJob.url,

      description:
        savedJob.description,

      source:
        savedJob.source,

      externalId:
        savedJob.externalId,
    });
  }

  return storedJobs;
}