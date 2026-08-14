import type { Request, Response } from "express";
import prisma from "../services/prisma.js";

export const analyzeResume = async (req: Request, res: Response) => {
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

    // Get resume belonging to logged-in user
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
        message: "Resume text has not been extracted",
      });
    }

    /*
      Temporary analysis logic.

      We will replace this with the real
      CareerLens analysis engine later.
    */

    const text = resume.extractedText.toLowerCase();

    const possibleSkills = [
      "python",
      "java",
      "c++",
      "javascript",
      "typescript",
      "react",
      "node.js",
      "express",
      "sql",
      "postgresql",
      "mongodb",
      "docker",
      "kubernetes",
      "tensorflow",
      "pytorch",
      "machine learning",
      "deep learning",
    ];

    const detectedSkills = possibleSkills.filter((skill) =>
      text.includes(skill.toLowerCase())
    );

    const score = Math.min(
      100,
      40 + detectedSkills.length * 4
    );

    const skillGaps = possibleSkills
      .filter((skill) => !detectedSkills.includes(skill))
      .slice(0, 5);

    const summary =
      detectedSkills.length > 0
        ? `Your resume contains ${detectedSkills.length} recognized technical skills.`
        : "Your resume needs more clearly defined technical skills.";

    // Create or update analysis
    const analysis = await prisma.resumeAnalysis.upsert({
      where: {
        resumeId: resume.id,
      },
      update: {
        score,
        summary,
        skills: detectedSkills,
        skillGaps,
      },
      create: {
        resumeId: resume.id,
        userId: req.userId,
        score,
        summary,
        skills: detectedSkills,
        skillGaps,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      analysis,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze resume",
    });
  }
};