import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const handleUploadClick = () => {
    setUploadError("");
    setUploadSuccess("");
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError("");
    setUploadSuccess("");
    setSelectedFile(null);

    // PDF validation
    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file.");
      return;
    }

    // 5 MB validation
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setUploadError("File size must be less than 5 MB.");
      return;
    }

    setSelectedFile(file);
    setUploading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUploadError("Authentication required. Please login again.");
        navigate("/login");
        return;
      }

      const formData = new FormData();

      formData.append("resume", file);

      const response = await fetch(
        "http://localhost:5000/api/resume/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setUploadError(
          data.message || "Resume upload failed."
        );
        setSelectedFile(null);
        return;
      }

      console.log("Resume uploaded successfully:", data);

      setUploadSuccess(
        "Resume uploaded successfully!"
      );
    } catch (error) {
      console.error("Resume upload error:", error);

      setUploadError(
        "Unable to connect to server."
      );

      setSelectedFile(null);
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      e.target.value = "";
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
              —
            </strong>

            <p className="stat-description">
              Upload a resume to analyze
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
              SKILL GAPS
            </span>

            <strong className="stat-value">
              —
            </strong>

            <p className="stat-description">
              Complete your resume analysis
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
                Upload your resume
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
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : "Upload Resume"}

                {!uploading && <span>→</span>}
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

              {uploadSuccess && (
                <div
                  style={{
                    marginTop: "10px",
                    color: "#4ade80",
                    fontSize: "12px",
                  }}
                >
                  ✓ {uploadSuccess}
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

        {/* ACTIVITY */}

        <section className="activity-section">

          <div className="dashboard-section-label">
            ACTIVITY
          </div>

          <div className="section-title-row">

            <h2>
              Recent analyses
            </h2>

          </div>

          <div className="empty-activity">

            <div className="empty-icon">
              ✦
            </div>

            <h3>
              No analyses yet
            </h3>

            <p>
              Upload your resume to see your first
              career intelligence report here.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;