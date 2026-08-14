import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [analysis, setAnalysis] = useState<any>(null);

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const handleUploadClick = () => {
    setUploadError("");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // PDF validation
    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file.");
      setSelectedFile(null);
      return;
    }

    // 5 MB validation
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setUploadError("File size must be less than 5 MB.");
      setSelectedFile(null);
      return;
    }

    if (!token) {
      setUploadError("Please login again.");
      navigate("/login");
      return;
    }

    setSelectedFile(file);
    setUploadError("");
    setLoading(true);
    setAnalysis(null);

    try {
      // -----------------------------
      // 1. Upload resume
      // -----------------------------

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
          uploadData.message || "Resume upload failed"
        );
      }

      const resumeId = uploadData.resume.id;

      console.log("Resume uploaded:", uploadData);

      // -----------------------------
      // 2. Analyze resume
      // -----------------------------

      const analysisResponse = await fetch(
        `http://localhost:5000/api/resume/${resumeId}/analyze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const analysisData = await analysisResponse.json();

      if (!analysisResponse.ok || !analysisData.success) {
        throw new Error(
          analysisData.message || "Resume analysis failed"
        );
      }

      console.log("Resume analysis:", analysisData);

      setAnalysis(analysisData.analysis);
    } catch (error: any) {
      console.error("Resume processing error:", error);

      setUploadError(
        error.message || "Something went wrong while analyzing resume."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">

      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          Career<span>Lens</span>
        </div>

        <nav className="dashboard-nav">

          <button className="dashboard-nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button className="dashboard-nav-item">
            <span>▣</span>
            My Resumes
          </button>

          <button className="dashboard-nav-item">
            <span>↗</span>
            Job Matches
          </button>

          <button className="dashboard-nav-item">
            <span>◇</span>
            Skill Gaps
          </button>

        </nav>

        <div className="dashboard-sidebar-bottom">

          <button className="dashboard-nav-item">
            <span>⚙</span>
            Settings
          </button>

          <button
            className="dashboard-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="dashboard-main">

        {/* HEADER */}

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
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
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

        {/* STATS */}

        <section className="dashboard-stats">

          <div className="dashboard-stat-card">

            <span className="stat-label">
              RESUME SCORE
            </span>

            <strong className="stat-value">
              {analysis?.score ?? "—"}
            </strong>

            <p className="stat-description">
              {analysis
                ? "Your current resume score"
                : "Upload a resume to analyze"}
            </p>

          </div>

          <div className="dashboard-stat-card">

            <span className="stat-label">
              JOB MATCHES
            </span>

            <strong className="stat-value">
              0
            </strong>

            <p className="stat-description">
              No jobs analyzed yet
            </p>

          </div>

          <div className="dashboard-stat-card">

            <span className="stat-label">
              SKILLS
            </span>

            <strong className="stat-value">
              {analysis?.skills?.length ?? "—"}
            </strong>

            <p className="stat-description">
              Recognized technical skills
            </p>

          </div>

        </section>

        {/* RESUME SECTION */}

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
                {loading
                  ? "Analyzing your resume..."
                  : "Upload your resume"}
              </h3>

              <p>
                Upload your latest PDF resume and let
                CareerLens analyze your skills,
                experience, projects and career potential.
              </p>

              <button
                type="button"
                className="dashboard-primary-btn"
                onClick={handleUploadClick}
                disabled={loading}
              >
                {loading
                  ? "Analyzing..."
                  : "Upload Resume"}

                <span>
                  →
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

              {selectedFile && (
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

        {/* ANALYSIS RESULT */}

        {analysis && (
          <section className="activity-section">

            <div className="dashboard-section-label">
              RESUME ANALYSIS
            </div>

            <div className="section-title-row">

              <h2>
                Your career intelligence
              </h2>

            </div>

            <div className="empty-activity">

              <div className="empty-icon">
                ✓
              </div>

              <h3>
                Resume Score: {analysis.score}
              </h3>

              <p>
                {analysis.summary}
              </p>

              {analysis.skills?.length > 0 && (
                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  {analysis.skills.map(
                    (skill: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "20px",
                          background: "#1f2937",
                          fontSize: "12px",
                        }}
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              )}

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default Dashboard;