import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// RESUME PROFILE
// ============================================================

const ResumeProfileSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    linkedin: z.string(),
    github: z.string(),
    portfolio: z.string(),
  }),

  professionalSummary: z.string(),

  education: z.array(
    z.object({
      degree: z.string(),
      field: z.string(),
      institution: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      grade: z.string(),
    })
  ),

  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
    })
  ),

  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      url: z.string(),
      achievements: z.array(z.string()),
    })
  ),

  skills: z.object({
    programmingLanguages: z.array(z.string()),
    frameworks: z.array(z.string()),
    libraries: z.array(z.string()),
    databases: z.array(z.string()),
    cloud: z.array(z.string()),
    devops: z.array(z.string()),
    aiMl: z.array(z.string()),
    tools: z.array(z.string()),
    other: z.array(z.string()),
  }),

  certifications: z.array(
    z.object({
      name: z.string(),
      organization: z.string(),
      date: z.string(),
    })
  ),

  achievements: z.array(z.string()),

  softSkills: z.array(z.string()),

  keywords: z.array(z.string()),
});

// ============================================================
// AI RESUME ANALYSIS
// ============================================================

const ResumeAnalysisSchema = z.object({
  score: z.number().int().min(0).max(100),

  summary: z.string(),

  strengths: z.array(z.string()),

  weaknesses: z.array(z.string()),

  skillGaps: z.array(
    z.object({
      skill: z.string(),
      reason: z.string(),
      priority: z.enum([
        "high",
        "medium",
        "low",
      ]),
    })
  ),

  recommendations: z.array(z.string()),

  atsAnalysis: z.object({
    score: z.number().int().min(0).max(100),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
  }),

  careerSuggestions: z.array(
    z.object({
      role: z.string(),
      reason: z.string(),
    })
  ),
});

// ============================================================
// EXTRACT RESUME INFORMATION
// ============================================================

export async function extractResumeInformation(
  resumeText: string
) {
  if (!resumeText.trim()) {
    throw new Error("Resume text is empty");
  }

  const response = await openai.responses.parse({
    model: "gpt-5.4-mini",

    instructions: `
You are CareerLens, an expert AI resume understanding system.

Extract ALL meaningful information from the resume.

Rules:

1. Never invent information.
2. Only use information actually present in the resume.
3. Missing information must be represented by an empty string or empty array.
4. Understand context instead of simply searching for keywords.
5. Extract every education entry.
6. Extract every professional experience entry.
7. Extract every project.
8. Extract technical and non-technical skills.
9. Identify technologies from project and experience descriptions.
10. Extract certifications.
11. Extract achievements.
12. Extract contact information when available.
13. Preserve the meaning of the resume.
14. Do not guess dates, companies, degrees or technologies.
15. Return structured information only.
`,

    input: `
Analyze this resume:

---------------- RESUME START ----------------

${resumeText}

----------------- RESUME END -----------------
`,

    text: {
      format: zodTextFormat(
        ResumeProfileSchema,
        "resume_profile"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "AI failed to extract resume information"
    );
  }

  return response.output_parsed;
}

// ============================================================
// ANALYZE RESUME PROFILE
// ============================================================

export async function analyzeResumeProfile(
  profile: z.infer<typeof ResumeProfileSchema>
) {
  const response = await openai.responses.parse({
    model: "gpt-5.4-mini",

    instructions: `
You are CareerLens, an expert AI career advisor and resume evaluator.

Analyze the candidate's structured resume profile.

Your job is to:

1. Give a realistic resume score from 0 to 100.
2. Evaluate resume quality, clarity and completeness.
3. Evaluate technical skills.
4. Evaluate education and experience.
5. Identify important skill gaps.
6. Identify strengths.
7. Identify weaknesses.
8. Give actionable recommendations.
9. Evaluate ATS readiness.
10. Suggest realistic career roles based ONLY on the candidate's profile.

Important:

- Do not invent candidate experience.
- Do not claim the candidate knows a technology unless supported by the profile.
- Do not recommend completely unrelated careers.
- Skill gaps should represent useful skills the candidate could learn to improve their target career opportunities.
- Be specific and practical.
`,

    input: `
Analyze the following candidate profile:

${JSON.stringify(profile, null, 2)}
`,

    text: {
      format: zodTextFormat(
        ResumeAnalysisSchema,
        "resume_analysis"
      ),
    },
  });

  if (!response.output_parsed) {
    throw new Error(
      "AI failed to analyze resume"
    );
  }

  return response.output_parsed;
}