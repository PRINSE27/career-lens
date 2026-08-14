import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "CareerLens API is running",
  });
});

app.listen(PORT, () => {
  console.log(`CareerLens API running on http://localhost:${PORT}`);
});