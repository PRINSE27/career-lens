import type { Request, Response } from "express";
import prisma from "../services/prisma.js";

import {
  extractResumeInformation,
  analyzeResumeProfile,
} from "../services/aiService.js";

// ============================================================
// ANALYZE RESUME USING GENAI
// ============================================================

export const analyzeResume = async (
  req: Request,
  res: Response
) => {
  try {
    const resumeId = Number(req.params.resumeId);

    if (!resumeId) {
      return res.status(400).json({
        success: false,
        message: "Invalid resume ID",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // --------------------------------------------------------
    // Get resume belonging to logged-in user
    // --------------------------------------------------------

    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: req.userId,
      },
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (!resume.extractedText) {
      return res.status(400).json({
        success: false,
        message:
          "Resume text has not been extracted",
      });
    }

    console.log(
      `Starting GenAI analysis for resume ${resume.id}...`
    );

    // --------------------------------------------------------
    // STEP 1: AI extracts complete resume profile
    // --------------------------------------------------------

    const profile =
      await extractResumeInformation(
        resume.extractedText
      );

    console.log(
      "Resume information extracted successfully"
    );

    // --------------------------------------------------------
    // STEP 2: AI analyzes the extracted profile
    // --------------------------------------------------------

    const aiAnalysis =
      await analyzeResumeProfile(profile);

    console.log(
      "Resume AI analysis completed successfully"
    );

    // --------------------------------------------------------
    // STEP 3: Save everything in PostgreSQL
    // --------------------------------------------------------

 const analysis = await prisma.resumeAnalysis.upsert({
  where: {
    resumeId: resume.id,
  },

  update: {
    personalInfo: profile.personalInfo,

    professionalSummary:
      profile.professionalSummary,

    skills: profile.skills,

    education: profile.education,

    experience: profile.experience,

    projects: profile.projects,

    certifications:
      profile.certifications,

    achievements:
      profile.achievements,

    softSkills:
      profile.softSkills,

    keywords:
      profile.keywords,

    score:
      aiAnalysis.score,

    summary:
      aiAnalysis.summary,

    strengths:
      aiAnalysis.strengths,

    weaknesses:
      aiAnalysis.weaknesses,

    skillGaps:
      aiAnalysis.skillGaps,

    recommendations:
      aiAnalysis.recommendations,

    atsAnalysis:
      aiAnalysis.atsAnalysis,

    careerSuggestions:
      aiAnalysis.careerSuggestions,
  },

create: {
    resumeId: resume.id,

    userId: req.userId,

    personalInfo:
      profile.personalInfo,

    professionalSummary:
      profile.professionalSummary,

    skills:
      profile.skills,

    education:
      profile.education,

    experience:
      profile.experience,

    projects:
      profile.projects,

    certifications:
      profile.certifications,

    achievements:
      profile.achievements,

    softSkills:
      profile.softSkills,

    keywords:
      profile.keywords,

    score:
      aiAnalysis.score,

    summary:
      aiAnalysis.summary,

    strengths:
      aiAnalysis.strengths,

    weaknesses:
      aiAnalysis.weaknesses,

    skillGaps:
      aiAnalysis.skillGaps,

    recommendations:
      aiAnalysis.recommendations,

    atsAnalysis:
      aiAnalysis.atsAnalysis,

    careerSuggestions:
      aiAnalysis.careerSuggestions,
  },
});

    // --------------------------------------------------------
    // Return AI result
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Resume analyzed successfully using GenAI",

      analysis: {
        id: analysis.id,

        resumeId: analysis.resumeId,

        score: analysis.score,

        summary: analysis.summary,

        skills: profile.skills,

        education: profile.education,

        experience: profile.experience,

        projects: profile.projects,

        skillGaps: aiAnalysis.skillGaps,

        strengths: aiAnalysis.strengths,

        weaknesses: aiAnalysis.weaknesses,

        recommendations:
          aiAnalysis.recommendations,

        atsAnalysis:
          aiAnalysis.atsAnalysis,

        careerSuggestions:
          aiAnalysis.careerSuggestions,
      },
    });
  } catch (error) {
    console.error(
      "GenAI resume analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to analyze resume using GenAI",
    });
  }
};

// ============================================================
// GET LATEST ANALYSIS
// ============================================================

export const getLatestAnalysis = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const analysis =
      await prisma.resumeAnalysis.findFirst({
        where: {
          userId: req.userId,
        },

        orderBy: {
          updatedAt: "desc",
        },

        include: {
          resume: {
            select: {
              id: true,
              fileName: true,
              uploadedAt: true,
            },
          },
        },
      });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message:
          "No resume analysis found",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error(
      "Get latest analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch resume analysis",
    });
  }
};