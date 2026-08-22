import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";

dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5000;

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,
  })
);

// ============================================================
// BODY PARSING
// ============================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

// ============================================================
// ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/resume",
  resumeRoutes
);

app.use(
  "/api/jobs",
  jobRoutes
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  (_req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "CareerLens API is running",
    });
  }
);

// ============================================================
// LOCAL DEVELOPMENT
// ============================================================

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(
      `CareerLens API running on http://localhost:${PORT}`
    );
  });
}

// ============================================================
// EXPORT FOR VERCEL
// ============================================================

export default app;