import type { Request, Response } from "express";

import prisma from "../services/prisma.js";

import {
  searchJobsForCandidate,
} from "../services/jobSearchService.js";

import {
  matchCandidateToJob,
  matchCandidateToJobsBatch,
} from "../services/jobMatchingService.js";

// ============================================================
// SEARCH JOBS
// ============================================================

export const searchJobs = async (
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

    const query =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    const jobs =
      await searchJobsForCandidate(
        req.userId,
        query
      );

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error(
      "Job search error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to search jobs",
    });
  }
};

// ============================================================
// MATCH ONE JOB
// ============================================================

export const matchJob = async (
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

    const jobId = Number(
      req.body.jobId
    );

    if (
      !jobId ||
      Number.isNaN(jobId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid jobId is required",
      });
    }

    const job =
      await prisma.job.findUnique({
        where: {
          id: jobId,
        },
      });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const result =
      await matchCandidateToJob(
        req.userId,
        job
      );

    return res.status(200).json({
      success: true,
      match: result,
    });
  } catch (error) {
    console.error(
      "Job matching error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to match job",
    });
  }
};

// ============================================================
// MATCH ALL JOBS
// ============================================================

export const matchAllJobs = async (
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
const userId = req.userId;
    console.log(
      `Starting controlled batched AI matching for user ${req.userId}...`
    );

    // ----------------------------------------------------------
    // Get jobs from candidate's AI resume profile
    // ----------------------------------------------------------

    const jobs =
      await searchJobsForCandidate(
        userId
      );

    console.log(
      `Found ${jobs.length} jobs`
    );

    if (jobs.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        matches: [],
        message: "No jobs found",
      });
    }

    // ----------------------------------------------------------
    // Create batches
    // ----------------------------------------------------------

    const BATCH_SIZE = 6;

    const batches: typeof jobs[] = [];

    for (
      let i = 0;
      i < jobs.length;
      i += BATCH_SIZE
    ) {
      batches.push(
        jobs.slice(
          i,
          i + BATCH_SIZE
        )
      );
    }

    console.log(
      `Created ${batches.length} AI batches`
    );

    // ----------------------------------------------------------
    // Sleep helper
    // ----------------------------------------------------------

    const sleep = (
      ms: number
    ) =>
      new Promise<void>(
        (resolve) =>
          setTimeout(resolve, ms)
      );

    // ----------------------------------------------------------
    // Process one batch with retry
    // ----------------------------------------------------------

    const processBatch = async (
      batch: typeof jobs,
      batchIndex: number
    ) => {
      const MAX_RETRIES = 3;

      for (
        let attempt = 1;
        attempt <= MAX_RETRIES;
        attempt++
      ) {
        try {
          console.log(
            `Starting batch ${
              batchIndex + 1
            }/${batches.length} with ${
              batch.length
            } jobs (attempt ${attempt})...`
          );

          // ----------------------------------------------------
          // Get complete jobs from database
          // ----------------------------------------------------

          const fullJobs = [];

          for (const job of batch) {
            const fullJob =
              await prisma.job.findUnique({
                where: {
                  id: job.id,
                },
              });

            if (fullJob) {
              fullJobs.push(
                fullJob
              );
            }
          }

          if (
            fullJobs.length === 0
          ) {
            console.log(
              `Batch ${
                batchIndex + 1
              } contains no valid jobs`
            );

            return [];
          }

          // ----------------------------------------------------
          // One OpenAI request for the entire batch
          // ----------------------------------------------------

          const results =
            await matchCandidateToJobsBatch(
              userId,
              fullJobs
            );

          console.log(
            `Batch ${
              batchIndex + 1
            } completed: ${
              results.length
            } matches`
          );

          return results;
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : String(error);

          const lowerMessage =
            errorMessage.toLowerCase();

          const isRateLimit =
            lowerMessage.includes(
              "rate limit"
            ) ||
            lowerMessage.includes(
              "rate_limit"
            ) ||
            lowerMessage.includes(
              "429"
            );

          console.error(
            `Batch ${
              batchIndex + 1
            } failed on attempt ${attempt}:`,
            errorMessage
          );

          if (
            !isRateLimit ||
            attempt === MAX_RETRIES
          ) {
            throw error;
          }

          const delay =
            attempt * 15000;

          console.log(
            `Rate limit detected. Retrying batch ${
              batchIndex + 1
            } in ${
              delay / 1000
            } seconds...`
          );

          await sleep(delay);
        }
      }

      return [];
    };

    // ----------------------------------------------------------
    // Process TWO batches at a time
    // ----------------------------------------------------------

    const allMatches: Awaited<
      ReturnType<
        typeof matchCandidateToJobsBatch
      >
    >[number][] = [];

    for (
      let i = 0;
      i < batches.length;
      i += 2
    ) {
      const currentBatches =
        batches.slice(
          i,
          i + 2
        );

      console.log(
        `Processing batch group ${
          Math.floor(i / 2) + 1
        }/${Math.ceil(
          batches.length / 2
        )}...`
      );

      const results =
        await Promise.allSettled(
          currentBatches.map(
            (batch, offset) =>
              processBatch(
                batch,
                i + offset
              )
          )
        );

      for (const result of results) {
        if (
          result.status ===
          "fulfilled"
        ) {
          allMatches.push(
            ...result.value
          );
        } else {
          console.error(
            "A matching batch failed:",
            result.reason
          );
        }
      }

      // Small pause before next group
      if (
        i + 2 <
        batches.length
      ) {
        await sleep(3000);
      }
    }

    // ----------------------------------------------------------
    // Sort highest match first
    // ----------------------------------------------------------

    allMatches.sort(
      (a, b) =>
        b.matchScore -
        a.matchScore
    );

    console.log(
      `Completed ${allMatches.length} AI job matches`
    );

    return res.status(200).json({
      success: true,
      count: allMatches.length,
      matches: allMatches,
    });
  } catch (error) {
    console.error(
      "Match all jobs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to match jobs",
    });
  }
};

// ============================================================
// GET SAVED JOB MATCHES
// ============================================================

export const getJobMatches = async (
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

    const matches =
      await prisma.jobMatch.findMany({
        where: {
          userId: req.userId,
        },

        orderBy: [
          {
            matchScore: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],

        include: {
          job: true,

          resume: {
            select: {
              id: true,
              fileName: true,
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error(
      "Get job matches error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch job matches",
    });
  }
};