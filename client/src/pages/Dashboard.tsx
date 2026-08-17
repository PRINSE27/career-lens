import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";



const displayValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => displayValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `${key}: ${displayValue(val)}`)
      .join(" • ");
  }

  return "";
};

interface Analysis {
  id: number;
  resumeId: number;
  userId: number;
  score: number | null;
  summary: string | null;
  skills: string[] | null;
  skillGaps: string[] | null;
  education: unknown;
  experience: unknown;
  projects: unknown;
  createdAt: string;
  updatedAt: string;

  resume?: {
    id: number;
    fileName: string;
    uploadedAt: string;
  };
}

interface UploadedResume {
  id: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface User {
  id?: number;
  name?: string;
  email?: string;
}

function Dashboard() {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [uploading, setUploading] = useState(false);

  // =========================================================
  // GET USER FROM LOCAL STORAGE
  // =========================================================

  const getStoredUser = (): User | null => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Invalid user data in localStorage:", error);

      localStorage.removeItem("user");

      return null;
    }
  };

  const user = getStoredUser();

  // =========================================================
  // FETCH LATEST ANALYSIS
  // =========================================================

  const fetchAnalysis = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/resume/latest-analysis",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis(null);
      }
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
      setAnalysis(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [navigate]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // =========================================================
  // OPEN FILE SELECTOR
  // =========================================================

  const handleUploadClick = () => {
    setUploadError("");
    fileInputRef.current?.click();
  };

  // =========================================================
  // UPLOAD + GENAI ANALYSIS
  // =========================================================

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");
    setSelectedFile(null);
    setUploading(true);

    try {
      // =======================================================
      // PDF VALIDATION
      // =======================================================

      if (file.type !== "application/pdf") {
        throw new Error("Please upload a PDF file.");
      }

      // =======================================================
      // FILE SIZE VALIDATION
      // =======================================================

      const maxSize = 5 * 1024 * 1024;

      if (file.size > maxSize) {
        throw new Error("File size must be less than 5 MB.");
      }

      setSelectedFile(file);

      // =======================================================
      // GET AUTH TOKEN
      // =======================================================

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // =======================================================
      // STEP 1: UPLOAD RESUME
      // =======================================================

      const formData = new FormData();

      formData.append("resume", file);

      const uploadResponse = await fetch(
        "http://localhost:5000/api/resume/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(
          uploadData.message || "Failed to upload resume"
        );
      }

      const uploadedResume: UploadedResume = uploadData.resume;

      console.log("Resume uploaded:", uploadedResume);

      // =======================================================
      // STEP 2: GENAI ANALYSIS
      // =======================================================

      const analyzeResponse = await fetch(
        `http://localhost:5000/api/resume/${uploadedResume.id}/analyze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const analyzeData = await analyzeResponse.json();

      if (!analyzeResponse.ok || !analyzeData.success) {
        throw new Error(
          analyzeData.message || "Failed to analyze resume"
        );
      }

      console.log(
        "GenAI Resume Analysis:",
        analyzeData.analysis
      );

      // =======================================================
      // STEP 3: UPDATE DASHBOARD
      // =======================================================

      setAnalysis(analyzeData.analysis);

    } catch (error) {
      console.error(
        "Resume upload/analysis error:",
        error
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Something went wrong while processing your resume."
      );

      setSelectedFile(null);
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      e.target.value = "";
    }
  };

  // =========================================================
  // SAFE DATA
  // =========================================================

  const skills = Array.isArray(analysis?.skills)
    ? analysis.skills
    : [];

  const skillGaps = Array.isArray(analysis?.skillGaps)
    ? analysis.skillGaps
    : [];

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          Career<span>Lens</span>
        </div>

        <nav className="dashboard-nav">

          <button
            className="dashboard-nav-item active"
            type="button"
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>▣</span>
            My Resumes
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>↗</span>
            Job Matches
          </button>

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>◇</span>
            Skill Gaps
          </button>

        </nav>

        <div className="dashboard-sidebar-bottom">

          <button
            className="dashboard-nav-item"
            type="button"
          >
            <span>⚙</span>
            Settings
          </button>

          <button
            className="dashboard-logout"
            type="button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="dashboard-header">

          <div>

            <div className="dashboard-eyebrow">
              CAREER INTELLIGENCE
            </div>

            <h1>
              Welcome back, {user?.name || "there"}.
            </h1>

            <p className="dashboard-subtitle">
              Let's make your next career move smarter.
            </p>

          </div>

          <div className="dashboard-user">

            <div className="dashboard-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="dashboard-user-info">

              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.email || ""}
              </span>

            </div>

          </div>

        </header>

        {/* ===================================================
            STATS
        =================================================== */}

        <section className="dashboard-stats">

          {/* RESUME SCORE */}

          <div className="dashboard-stat-card">

            <span className="stat-label">
              RESUME SCORE
            </span>

            <strong className="stat-value">

              {loadingAnalysis
                ? "..."
                : analysis?.score ?? "—"}

            </strong>

            <p className="stat-description">

              {analysis
                ? "Based on your latest AI resume analysis"
                : "Upload a resume to analyze"}

            </p>

          </div>

          {/* JOB MATCHES */}

          <div className="dashboard-stat-card">

            <span className="stat-label">
              JOB MATCHES
            </span>

            <strong className="stat-value">
              0
            </strong>

            <p className="stat-description">
              AI job matching coming next
            </p>

          </div>

          {/* SKILL GAPS */}

          <div className="dashboard-stat-card">

            <span className="stat-label">
              SKILL GAPS
            </span>

            <strong className="stat-value">

              {loadingAnalysis
                ? "..."
                : analysis
                  ? skillGaps.length
                  : "—"}

            </strong>

            <p className="stat-description">

              {analysis
                ? "AI-recommended skills for improvement"
                : "Complete your resume analysis"}

            </p>

          </div>

        </section>

        {/* ===================================================
            RESUME UPLOAD
        =================================================== */}

        <section className="resume-section">

          <div className="section-title-row">

            <div>

              <div className="dashboard-section-label">
                YOUR RESUME
              </div>

              <h2>
                Start your career analysis
              </h2>

            </div>

          </div>

          <div className="resume-upload-card">

            <div className="upload-icon">
              ↑
            </div>

            <div className="upload-content">

              <h3>
                Upload your resume
              </h3>

              <p>
                Upload your latest PDF resume and let
                CareerLens use AI to analyze your skills,
                education, experience, projects and career
                potential.
              </p>

              <button
                type="button"
                className="dashboard-primary-btn"
                onClick={handleUploadClick}
                disabled={uploading}
              >

                {uploading
                  ? "AI is analyzing..."
                  : "Upload Resume"}

                <span>
                  {uploading ? "..." : "→"}
                </span>

              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                hidden
              />

              <small>
                PDF files only · Maximum 5MB
              </small>

              {selectedFile && !uploadError && (

                <div
                  style={{
                    marginTop: "10px",
                    color: "#4ade80",
                    fontSize: "12px",
                  }}
                >
                  ✓ {selectedFile.name}
                </div>

              )}

              {uploadError && (

                <div
                  style={{
                    marginTop: "10px",
                    color: "#f87171",
                    fontSize: "12px",
                  }}
                >
                  {uploadError}
                </div>

              )}

            </div>

          </div>

        </section>

        {/* ===================================================
            ACTIVITY
        =================================================== */}

        <section className="activity-section">

          <div className="dashboard-section-label">
            ACTIVITY
          </div>

          <div className="section-title-row">

            <h2>
              Recent analyses
            </h2>

          </div>

          {analysis ? (

            <div className="empty-activity">

              <div className="empty-icon">
                ✓
              </div>

              <h3>
                Resume analyzed
              </h3>

              <p>
                {analysis.summary ||
                  "AI analysis completed successfully."}
              </p>

              {analysis.resume && (

                <small>
                  {analysis.resume.fileName}
                </small>

              )}

            </div>

          ) : (

            <div className="empty-activity">

              <div className="empty-icon">
                ✦
              </div>

              <h3>
                No analyses yet
              </h3>

              <p>
                Upload your resume to generate your
                first AI-powered career intelligence report.
              </p>

            </div>

          )}

        </section>

        {/* ===================================================
            DETECTED SKILLS
        =================================================== */}

        {analysis && (

          <section className="activity-section">

            <div className="dashboard-section-label">
              DETECTED SKILLS
            </div>

            <div className="section-title-row">

              <h2>
                Your technical skills
              </h2>

            </div>

            {skills.length > 0 ? (

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "20px",
                }}
              >

                {skills.map((skill, index) => (

                  <span
                    key={`${skill}-${index}`}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background:
                        "rgba(255,255,255,0.06)",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      fontSize: "13px",
                    }}
                  >
                    {skill}
                  </span>

                ))}

              </div>

            ) : (

              <p style={{ marginTop: "20px" }}>
                No technical skills were detected by the AI yet.
              </p>

            )}

          </section>

        )}

        {/* ===================================================
            AI SKILL GAPS
        =================================================== */}

        {analysis && (

          <section className="activity-section">

            <div className="dashboard-section-label">
              AI RECOMMENDATIONS
            </div>

            <div className="section-title-row">

              <h2>
                Skills to improve
              </h2>

            </div>

            {skillGaps.length > 0 ? (

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "20px",
                }}
              >
{skillGaps.map((item, index) => (
  <div key={index} className="skill-gap-item">
    <div>
      <strong>{item}</strong>
      <p>AI identified this as a potential skill gap based on your resume.</p>
    </div>
  </div>
))}

              </div>

            ) : (

              <p style={{ marginTop: "20px" }}>
                No skill gaps identified yet.
              </p>

            )}

          </section>

        )}

      </main>

    </div>
  );
}

export default Dashboard;