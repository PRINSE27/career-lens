import { Router } from "express";
import multer from "multer";

import { uploadResume } from "../controllers/resumeController.js";

import {
  analyzeResume,
  getLatestAnalysis,
} from "../controllers/analysisController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// ============================================================
// MULTER CONFIGURATION
// ============================================================
//
// Store the uploaded PDF in memory instead of server/uploads/.
// This is important because the production deployment will use
// Vercel Blob for persistent file storage.
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype !==
      "application/pdf"
    ) {
      return cb(
        new Error(
          "Only PDF files are allowed"
        )
      );
    }

    cb(null, true);
  },
});

// ============================================================
// UPLOAD RESUME
// ============================================================

router.post(
  "/upload",
  authenticateToken,
  upload.single("resume"),
  uploadResume
);

// ============================================================
// GET LATEST ANALYSIS
// ============================================================

router.get(
  "/latest-analysis",
  authenticateToken,
  getLatestAnalysis
);

// ============================================================
// ANALYZE RESUME
// ============================================================

router.post(
  "/:resumeId/analyze",
  authenticateToken,
  analyzeResume
);

export default router;