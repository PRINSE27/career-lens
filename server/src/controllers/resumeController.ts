import type { Request, Response } from "express";
import { put } from "@vercel/blob";
import pdf from "pdf-parse";

import prisma from "../services/prisma.js";

// ============================================================
// UPLOAD RESUME
// ============================================================

export const uploadResume = async (
  req: Request,
  res: Response
) => {
  try {
    // ----------------------------------------------------------
    // Authentication
    // ----------------------------------------------------------

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ----------------------------------------------------------
    // Validate uploaded file
    // ----------------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Resume PDF is required",
      });
    }

    if (
      req.file.mimetype !==
      "application/pdf"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only PDF files are allowed",
      });
    }

    // ----------------------------------------------------------
    // PDF buffer
    // ----------------------------------------------------------

    const pdfBuffer =
      req.file.buffer;

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Uploaded PDF is empty",
      });
    }

    // ----------------------------------------------------------
    // Upload PDF to Vercel Blob
    // ----------------------------------------------------------

    const safeFileName =
      req.file.originalname
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

    const blobPath =
      `resumes/${req.userId}/${Date.now()}-${safeFileName}`;

    const blob = await put(
      blobPath,
      pdfBuffer,
      {
        access: "private",
        contentType:
          "application/pdf",
      }
    );

    console.log(
      `Resume uploaded to Vercel Blob: ${blob.url}`
    );

    // ----------------------------------------------------------
    // Extract text from PDF buffer
    // ----------------------------------------------------------
const pdfData = await pdf(pdfBuffer);

const extractedText =
  typeof pdfData.text === "string"
    ? pdfData.text.trim()
    : "";

    // ----------------------------------------------------------
    // Make sure text was extracted
    // ----------------------------------------------------------

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message:
          "Could not extract text from this PDF",
      });
    }

    // ----------------------------------------------------------
    // Save resume in PostgreSQL
    // ----------------------------------------------------------
    //
    // filePath now stores the persistent Vercel Blob URL
    // instead of a local server/uploads path.
    // ----------------------------------------------------------

    const resume =
      await prisma.resume.create({
        data: {
          fileName:
            req.file.originalname,

          filePath:
            blob.url,

          fileSize:
            req.file.size,

          extractedText,

          userId:
            req.userId,
        },
      });

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Resume uploaded and processed successfully",

      resume: {
        id: resume.id,

        fileName:
          resume.fileName,

        fileSize:
          resume.fileSize,

        uploadedAt:
          resume.uploadedAt,
      },
    });
  } catch (error) {
    console.error(
      "Resume processing error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to process resume",
    });
  }
};