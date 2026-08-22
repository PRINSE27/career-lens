import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

import prisma from "./prisma.js";

// ============================================================
// OPENAI
// ============================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// SINGLE JOB MATCH SCHEMA
// ============================================================

const JobMatchSchema = z.object({
  matchScore: z.number().int().min(0).max(100),

  matchingSkills: z.array(
    z.string()
  ),

  missingSkills: z.array(
    z.string()
  ),

  explanation: z.string(),

  recommendations: z.array(
    z.string()
  ),
});

// ============================================================
// BATCH JOB MATCH SCHEMA
// ============================================================

const BatchJobMatchSchema = z.object({
  matches: z.array(
    z.object({
      jobId: z.number().int(),

      matchScore: z
        .number()
        .int()
        .min(0)
        .max(100),

      matchingSkills: z.array(
        z.string()
      ),

      missingSkills: z.array(
        z.string()
      ),

      explanation: z.string(),

      recommendations: z.array(
        z.string()
      ),
    })
  ),
});

// ============================================================
// GET CANDIDATE PROFILE
// ============================================================

const getCandidateProfile = async (
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
      "Please analyze your resume before matching jobs"
    );
  }

  return {
    resumeId: analysis.resumeId,

    profile: {
      personalInfo:
        analysis.personalInfo,

      professionalSummary:
        analysis.professionalSummary,

      skills:
        analysis.skills,

      education:
        analysis.education,

      experience:
        analysis.experience,

      projects:
        analysis.projects,

      certifications:
        analysis.certifications,

      achievements:
        analysis.achievements,

      softSkills:
        analysis.softSkills,
    },
  };
};

// ============================================================
// MATCH ONE JOB
// ============================================================

export async function matchCandidateToJob(
  userId: number,
  job: {
    id: number;
    title: string;
    company: string;
    location: string | null;
    description: string;
    requirements: unknown;
    skills: unknown;
  }
) {
  const candidate =
    await getCandidateProfile(
      userId
    );

  const response =
    await openai.responses.parse({
      model: "gpt-5.4-mini",

      instructions: `
You are CareerLens, an expert AI job matching engine.

Compare the candidate profile against the job.

Evaluate:

1. Technical skill relevance.
2. Project relevance.
3. Professional experience relevance.
4. Education relevance.
5. Career alignment.
6. Missing or weak requirements.
7. Overall suitability.

Rules:

- Use ONLY information present in the candidate profile.
- Do not invent experience.
- Do not assume a skill merely because it is related to another skill.
- Only identify relevant missing skills.
- Consider semantic meaning, not only exact keywords.
- Give a realistic score from 0 to 100.
- Explain the match clearly.
- Give practical recommendations.
`,

      input: `
CANDIDATE PROFILE

${JSON.stringify(
  candidate.profile,
  null,
  2
)}

JOB

${JSON.stringify(
  job,
  null,
  2
)}
`,

      text: {
        format:
          zodTextFormat(
            JobMatchSchema,
            "job_match"
          ),
      },
    });

  if (!response.output_parsed) {
    throw new Error(
      "AI failed to generate job match"
    );
  }

  const match =
    response.output_parsed;

  const savedMatch =
    await prisma.jobMatch.upsert({
      where: {
        userId_resumeId_jobId: {
          userId,
          resumeId:
            candidate.resumeId,
          jobId: job.id,
        },
      },

      update: {
        matchScore:
          match.matchScore,

        matchingSkills:
          match.matchingSkills,

        missingSkills:
          match.missingSkills,

        explanation:
          match.explanation,

        recommendations:
          match.recommendations,
      },

      create: {
        userId,

        resumeId:
          candidate.resumeId,

        jobId:
          job.id,

        matchScore:
          match.matchScore,

        matchingSkills:
          match.matchingSkills,

        missingSkills:
          match.missingSkills,

        explanation:
          match.explanation,

        recommendations:
          match.recommendations,
      },
    });

  return {
    id: savedMatch.id,

    matchScore:
      savedMatch.matchScore,

    matchingSkills:
      savedMatch.matchingSkills,

    missingSkills:
      savedMatch.missingSkills,

    explanation:
      savedMatch.explanation,

    recommendations:
      savedMatch.recommendations,

    job,
  };
}

// ============================================================
// MATCH MULTIPLE JOBS IN ONE AI CALL
// ============================================================

export async function matchCandidateToJobsBatch(
  userId: number,
  jobs: Array<{
    id: number;
    title: string;
    company: string;
    location: string | null;
    description: string;
    requirements: unknown;
    skills: unknown;
  }>
) {
  if (jobs.length === 0) {
    return [];
  }

  const candidate =
    await getCandidateProfile(
      userId
    );

  const jobProfiles =
    jobs.map((job) => ({
      jobId: job.id,

      title: job.title,

      company: job.company,

      location:
        job.location,

      description:
        job.description,

      requirements:
        job.requirements,

      skills:
        job.skills,
    }));

  const response =
    await openai.responses.parse({
      model: "gpt-5.4-mini",

      instructions: `
You are CareerLens, an expert AI job matching engine.

You are given one candidate profile and multiple jobs.

Evaluate EVERY job against the candidate.

For each job return:

- jobId
- matchScore from 0 to 100
- matchingSkills
- missingSkills
- explanation
- recommendations

Rules:

- Use ONLY information contained in the candidate profile.
- Never invent candidate experience.
- Do not assume a skill without evidence.
- Evaluate semantic relevance, not just exact keyword overlap.
- Missing skills must be relevant to that specific job.
- Consider technical skills, projects, education, experience,
  and career direction.
- Produce one result for every supplied job.
`,

      input: `
CANDIDATE PROFILE

${JSON.stringify(
  candidate.profile,
  null,
  2
)}

JOBS

${JSON.stringify(
  jobProfiles,
  null,
  2
)}
`,

      text: {
        format:
          zodTextFormat(
            BatchJobMatchSchema,
            "batch_job_matches"
          ),
      },
    });

  if (!response.output_parsed) {
    throw new Error(
      "AI failed to generate batch job matches"
    );
  }

  const results =
    response.output_parsed.matches;

  const savedResults = [];

  for (const result of results) {
    const job =
      jobs.find(
        (item) =>
          item.id === result.jobId
      );

    if (!job) {
      continue;
    }

    const savedMatch =
      await prisma.jobMatch.upsert({
        where: {
          userId_resumeId_jobId: {
            userId,
            resumeId:
              candidate.resumeId,
            jobId: job.id,
          },
        },

        update: {
          matchScore:
            result.matchScore,

          matchingSkills:
            result.matchingSkills,

          missingSkills:
            result.missingSkills,

          explanation:
            result.explanation,

          recommendations:
            result.recommendations,
        },

        create: {
          userId,

          resumeId:
            candidate.resumeId,

          jobId:
            job.id,

          matchScore:
            result.matchScore,

          matchingSkills:
            result.matchingSkills,

          missingSkills:
            result.missingSkills,

          explanation:
            result.explanation,

          recommendations:
            result.recommendations,
        },
      });

    savedResults.push({
      id: savedMatch.id,

      matchScore:
        savedMatch.matchScore,

      matchingSkills:
        savedMatch.matchingSkills,

      missingSkills:
        savedMatch.missingSkills,

      explanation:
        savedMatch.explanation,

      recommendations:
        savedMatch.recommendations,

      job,
    });
  }

  return savedResults;
}