import { Router } from "express";
import multer from "multer";

import { uploadResume } from "../controllers/resumeController.js";
import { analyzeResume } from "../controllers/analysisController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});

// Upload resume
router.post(
  "/upload",
  authenticateToken,
  upload.single("resume"),
  uploadResume
);

// Analyze resume
router.post(
  "/:resumeId/analyze",
  authenticateToken,
  analyzeResume
);

export default router;