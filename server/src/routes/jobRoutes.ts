import { Router } from "express";

import { authenticateToken } from "../middleware/authMiddleware.js";

import {
  searchJobs,
  matchJob,
  matchAllJobs,
  getJobMatches,
} from "../controllers/jobController.js";

const router = Router();

// ============================================================
// SEARCH JOBS
// ============================================================

router.get(
  "/search",
  authenticateToken,
  searchJobs
);

// ============================================================
// MATCH ONE JOB
// ============================================================

router.post(
  "/match",
  authenticateToken,
  matchJob
);

// ============================================================
// MATCH ALL SEARCHED JOBS
// ============================================================

router.post(
  "/match-all",
  authenticateToken,
  matchAllJobs
);

// ============================================================
// GET SAVED MATCHES
// ============================================================

router.get(
  "/matches",
  authenticateToken,
  getJobMatches
);

export default router;