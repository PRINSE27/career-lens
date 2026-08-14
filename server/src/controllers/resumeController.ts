import type { Request, Response } from "express";
import prisma from "../services/prisma.js";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

export const uploadResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required",
      });
    }

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Read uploaded PDF
    const pdfBuffer = await fs.readFile(req.file.path);

    // Extract text
    const parser = new PDFParse({
      data: pdfBuffer,
    });

    const pdfData = await parser.getText();

    const extractedText = pdfData.text.trim();

    await parser.destroy();

    // Make sure text was actually extracted
    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from this PDF",
      });
    }

    // Save resume and extracted text
    const resume = await prisma.resume.create({
      data: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        extractedText,
        userId: req.userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded and processed successfully",
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileSize: resume.fileSize,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Resume processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process resume",
    });
  }
};