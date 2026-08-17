import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

// ============================================================
// TYPES
// ============================================================

type SkillGap = {
  skill: string;
  reason: string;
  priority: "high" | "medium" | "low" | string;
};

type ATSAnalysis = {
  score: number;
  strengths: string[];
  improvements: string[];
};

type CareerSuggestion = {
  role: string;
  reason: string;
};

type Education = {
  degree?: string;
  field?: string;
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
};

type Experience = {
  company?: string;
  role?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
};

type Project = {
  name?: string;
  description?: string;
  technologies?: string[];
  url?: string;
  achievements?: string[];
};

type Certification = {
  name?: string;
  organization?: string;
  date?: string;
};

type Skills = {
  programmingLanguages?: string[];
  frameworks?: string[];
  libraries?: string[];
  databases?: string[];
  cloud?: string[];
  devops?: string[];
  aiMl?: string[];
  tools?: string[];
  other?: string[];
};

type PersonalInfo = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

type ResumeAnalysis = {
  id?: number;
  resumeId?: number;

  score?: number;
  summary?: string;

  personalInfo?: PersonalInfo;

  professionalSummary?: string;

  skills?: Skills;

  education?: Education[];

  experience?: Experience[];

  projects?: Project[];

  certifications?: Certification[];

  achievements?: string[];

  softSkills?: string[];

  keywords?: string[];

  strengths?: string[];

  weaknesses?: string[];

  skillGaps?: SkillGap[];

  recommendations?: string[];

  atsAnalysis?: ATSAnalysis;

  careerSuggestions?: CareerSuggestion[];
};

type ResumeUploadResponse = {
  success: boolean;
  message?: string;
  resume?: {
    id: number;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
  };
};

type AnalysisResponse = {
  success: boolean;
  message?: string;
  analysis?: ResumeAnalysis;
};

// ============================================================
// HELPERS
// ============================================================

const API_BASE_URL = "http://localhost:5000/api";

const safeArray = <T,>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const formatPriority = (priority: string) => {
  const value = priority.toLowerCase();

  if (value === "high") {
    return {
      background: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.25)",
      color: "#fca5a5",
    };
  }

  if (value === "low") {
    return {
      background: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.25)",
      color: "#86efac",
    };
  }

  return {
    background: "rgba(234, 179, 8, 0.12)",
    border: "rgba(234, 179, 8, 0.25)",
    color: "#fde68a",
  };
};

// ============================================================
// COMPONENT
// ============================================================

function Dashboard() {
  const navigate = useNavigate();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [analysis, setAnalysis] =
    useState<ResumeAnalysis | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // ==========================================================
  // USER
  // ==========================================================

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  })();

  // ==========================================================
  // LOAD LATEST ANALYSIS
  // ==========================================================

  const loadLatestAnalysis = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setUploadError("");

      const response = await fetch(
        `${API_BASE_URL}/resume/latest-analysis`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      // No analysis yet is a valid dashboard state.
      if (response.status === 404) {
        setAnalysis(null);
        return;
      }

      const data: AnalysisResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load resume analysis"
        );
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error(
        "Load analysis error:",
        error
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestAnalysis();
  }, []);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ==========================================================
  // FILE SELECTION
  // ==========================================================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    setUploadError("");
    setMessage("");
    setSelectedFile(null);

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setUploadError(
        "Please upload a PDF file."
      );
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setUploadError(
        "File size must be less than 5 MB."
      );
      return;
    }

    setSelectedFile(file);
  };

  // ==========================================================
  // UPLOAD RESUME
  // ==========================================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError(
        "Please select a PDF resume first."
      );
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setUploading(true);
      setAnalyzing(false);
      setUploadError("");
      setMessage("");

      // ------------------------------------------------------
      // STEP 1: Upload resume
      // ------------------------------------------------------

      const formData = new FormData();

      formData.append(
        "resume",
        selectedFile
      );

      const uploadResponse =
        await fetch(
          `${API_BASE_URL}/resume/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

      const uploadData: ResumeUploadResponse =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message ||
            "Resume upload failed"
        );
      }

      if (
        !uploadData.success ||
        !uploadData.resume?.id
      ) {
        throw new Error(
          "Resume upload failed"
        );
      }

      const resumeId =
        uploadData.resume.id;

      setUploading(false);
      setAnalyzing(true);

      setMessage(
        "Resume uploaded. CareerLens AI is analyzing it..."
      );

      // ------------------------------------------------------
      // STEP 2: Run GenAI analysis
      // ------------------------------------------------------

      const analysisResponse =
        await fetch(
          `${API_BASE_URL}/resume/${resumeId}/analyze`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const analysisData: AnalysisResponse =
        await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData.message ||
            "AI analysis failed"
        );
      }

      if (
        !analysisData.success ||
        !analysisData.analysis
      ) {
        throw new Error(
          "AI analysis did not return any result"
        );
      }

      setAnalysis(
        analysisData.analysis
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage(
        "Resume analyzed successfully using GenAI."
      );
    } catch (error) {
      console.error(
        "Resume processing error:",
        error
      );

      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to process resume"
      );
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="dashboard-page">

        <main
          className="dashboard-main"
          style={{
            marginLeft: 0,
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#a1a1aa",
            }}
          >
            <div
              className="upload-icon"
              style={{
                margin: "0 auto",
              }}
            >
              AI
            </div>

            <h2
              style={{
                marginTop: "18px",
                color: "#f5f5f5",
              }}
            >
              Loading CareerLens...
            </h2>

            <p
              style={{
                marginTop: "8px",
              }}
            >
              Preparing your AI career dashboard.
            </p>
          </div>
        </main>

      </div>
    );
  }

  // ==========================================================
  // RESUME DATA
  // ==========================================================

  const score =
    analysis?.score ?? 0;

  const atsScore =
    analysis?.atsAnalysis?.score;

  const personalInfo =
    analysis?.personalInfo;

  const skills =
    analysis?.skills ?? {};

  const skillCategories = [
    {
      title: "Programming Languages",
      values: safeArray<string>(
        skills.programmingLanguages
      ),
    },
    {
      title: "Frameworks",
      values: safeArray<string>(
        skills.frameworks
      ),
    },
    {
      title: "Libraries",
      values: safeArray<string>(
        skills.libraries
      ),
    },
    {
      title: "Databases",
      values: safeArray<string>(
        skills.databases
      ),
    },
    {
      title: "Cloud",
      values: safeArray<string>(
        skills.cloud
      ),
    },
    {
      title: "DevOps",
      values: safeArray<string>(
        skills.devops
      ),
    },
    {
      title: "AI / ML",
      values: safeArray<string>(
        skills.aiMl
      ),
    },
    {
      title: "Tools",
      values: safeArray<string>(
        skills.tools
      ),
    },
    {
      title: "Other",
      values: safeArray<string>(
        skills.other
      ),
    },
  ].filter(
    (category) =>
      category.values.length > 0
  );

  const allSkills =
    skillCategories.flatMap(
      (category) => category.values
    );

  const strengths =
    safeArray<string>(
      analysis?.strengths
    );

  const weaknesses =
    safeArray<string>(
      analysis?.weaknesses
    );

  const recommendations =
    safeArray<string>(
      analysis?.recommendations
    );

  const skillGaps =
    safeArray<SkillGap>(
      analysis?.skillGaps
    );

  const education =
    safeArray<Education>(
      analysis?.education
    );

  const experience =
    safeArray<Experience>(
      analysis?.experience
    );

  const projects =
    safeArray<Project>(
      analysis?.projects
    );

  const certifications =
    safeArray<Certification>(
      analysis?.certifications
    );

  const achievements =
    safeArray<string>(
      analysis?.achievements
    );

  const softSkills =
    safeArray<string>(
      analysis?.softSkills
    );

  const careerSuggestions =
    safeArray<CareerSuggestion>(
      analysis?.careerSuggestions
    );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="dashboard-page">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          Career<span>Lens</span>
        </div>

        <nav className="dashboard-nav">

          <button
            className="dashboard-nav-item active"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="dashboard-nav-item"
            onClick={() =>
              document
                .getElementById(
                  "resume-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span>▣</span>
            My Resumes
          </button>

          <button
            className="dashboard-nav-item"
            onClick={() =>
              document
                .getElementById(
                  "career-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span>↗</span>
            Job Matches
          </button>

          <button
            className="dashboard-nav-item"
            onClick={() =>
              document
                .getElementById(
                  "skill-gap-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span>◇</span>
            Skill Gaps
          </button>

        </nav>

        <div className="dashboard-sidebar-bottom">

          <button
            className="dashboard-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="dashboard-main">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="dashboard-header">

          <div>

            <p className="dashboard-eyebrow">
              CAREER INTELLIGENCE
            </p>

            <h1>
              Welcome back,
              {" "}
              {personalInfo?.name ||
                user?.name ||
                "there"}
              .
            </h1>

            <p className="dashboard-subtitle">
              Let's make your next career move smarter.
            </p>

          </div>

          <div className="dashboard-user">

            <div className="dashboard-avatar">
              {(
                personalInfo?.name ||
                user?.name ||
                "U"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="dashboard-user-info">

              <strong>
                {personalInfo?.name ||
                  user?.name ||
                  "User"}
              </strong>

              <span>
                {personalInfo?.email ||
                  user?.email ||
                  ""}
              </span>

            </div>

          </div>

        </header>

        {/* ====================================================
            STATS
        ==================================================== */}

        <section className="dashboard-stats">

          <div className="dashboard-stat-card">

            <span className="stat-label">
              RESUME SCORE
            </span>

            <strong className="stat-value">
              {analysis ? score : "—"}
            </strong>

            <p className="stat-description">
              {analysis
                ? "Based on your latest AI resume analysis"
                : "Upload a resume to analyze"}
            </p>

          </div>

          <div className="dashboard-stat-card">

            <span className="stat-label">
              ATS SCORE
            </span>

            <strong className="stat-value">
              {atsScore ?? "—"}
            </strong>

            <p className="stat-description">
              {atsScore !== undefined
                ? "AI-generated ATS readiness score"
                : "Available after AI analysis"}
            </p>

          </div>

          <div className="dashboard-stat-card">

            <span className="stat-label">
              AI IDENTIFIED SKILLS
            </span>

            <strong className="stat-value">
              {allSkills.length || "—"}
            </strong>

            <p className="stat-description">
              {allSkills.length
                ? "Skills extracted from your resume"
                : "Upload a resume to analyze"}
            </p>

          </div>

        </section>

        {/* ====================================================
            RESUME UPLOAD
        ==================================================== */}

        <section
          className="resume-section"
          id="resume-section"
        >

          <div className="section-title-row">

            <div>

              <p className="dashboard-section-label">
                YOUR RESUME
              </p>

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
                Upload your latest PDF resume and
                let CareerLens automatically extract
                your skills, education, experience,
                projects and career potential using GenAI.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                hidden
              />

              <button
                type="button"
                className="dashboard-primary-btn"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  uploading || analyzing
                }
              >
                Select Resume
                <span>↑</span>
              </button>

              <small>
                PDF files only · Maximum 5MB
              </small>

              {selectedFile && (
                <div
                  style={{
                    marginTop: "12px",
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
                    marginTop: "12px",
                    color: "#f87171",
                    fontSize: "12px",
                  }}
                >
                  {uploadError}
                </div>
              )}

              {message && !uploadError && (
                <div
                  style={{
                    marginTop: "12px",
                    color: "#a78bfa",
                    fontSize: "12px",
                  }}
                >
                  {message}
                </div>
              )}

              {selectedFile && (
                <button
                  type="button"
                  className="dashboard-primary-btn"
                  onClick={handleUpload}
                  disabled={
                    uploading || analyzing
                  }
                  style={{
                    marginTop: "14px",
                  }}
                >
                  {uploading
                    ? "Uploading..."
                    : analyzing
                    ? "AI Analyzing..."
                    : "Upload & Analyze"}
                  <span>→</span>
                </button>
              )}

            </div>

          </div>

        </section>

        {/* ====================================================
            AI SUMMARY
        ==================================================== */}

        {analysis && (
          <section className="resume-section">

            <div className="section-title-row">

              <div>

                <p className="dashboard-section-label">
                  AI RESUME ANALYSIS
                </p>

                <h2>
                  Resume Summary
                </h2>

              </div>

            </div>

            <div className="dashboard-stat-card">

              <p
                style={{
                  marginTop: "15px",
                  color: "#a1a1aa",
                  fontSize: "14px",
                  lineHeight: 1.8,
                }}
              >
                {analysis.summary ||
                  "No AI summary available."}
              </p>

            </div>

          </section>
        )}

        {/* ====================================================
            STRENGTHS / WEAKNESSES
        ==================================================== */}

        {analysis && (
          <section className="resume-section">

            <div className="section-title-row">

              <div>

                <p className="dashboard-section-label">
                  AI EVALUATION
                </p>

                <h2>
                  Strengths & Weaknesses
                </h2>

              </div>

            </div>

            <div className="dashboard-stats">

              <div className="dashboard-stat-card">

                <span className="stat-label">
                  STRENGTHS
                </span>

                {strengths.length > 0 ? (
                  <ul
                    style={{
                      marginTop: "18px",
                      paddingLeft: "18px",
                      color: "#a1a1aa",
                      fontSize: "12px",
                      lineHeight: 1.7,
                    }}
                  >
                    {strengths.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p
                    style={{
                      marginTop: "18px",
                      color: "#71717a",
                      fontSize: "12px",
                    }}
                  >
                    No strengths identified yet.
                  </p>
                )}

              </div>

              <div className="dashboard-stat-card">

                <span className="stat-label">
                  WEAKNESSES
                </span>

                {weaknesses.length > 0 ? (
                  <ul
                    style={{
                      marginTop: "18px",
                      paddingLeft: "18px",
                      color: "#a1a1aa",
                      fontSize: "12px",
                      lineHeight: 1.7,
                    }}
                  >
                    {weaknesses.map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p
                    style={{
                      marginTop: "18px",
                      color: "#71717a",
                      fontSize: "12px",
                    }}
                  >
                    No major weaknesses identified yet.
                  </p>
                )}

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            TECHNICAL SKILLS
        ==================================================== */}

        {analysis && (
          <section className="resume-section">

            <div className="section-title-row">

              <div>

                <p className="dashboard-section-label">
                  AI EXTRACTED
                </p>

                <h2>
                  Technical Skills
                </h2>

              </div>

            </div>

            {skillCategories.length > 0 ? (

              <div
                className="dashboard-stats"
                style={{
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(240px, 1fr))",
                }}
              >
                {skillCategories.map(
                  (category) => (
                    <div
                      className="dashboard-stat-card"
                      key={category.title}
                    >

                      <span className="stat-label">
                        {category.title.toUpperCase()}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "7px",
                          marginTop: "16px",
                        }}
                      >
                        {category.values.map(
                          (skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              style={{
                                padding:
                                  "6px 9px",
                                border:
                                  "1px solid rgba(139,92,246,0.25)",
                                borderRadius:
                                  "7px",
                                background:
                                  "rgba(124,58,237,0.09)",
                                color:
                                  "#c4b5fd",
                                fontSize:
                                  "11px",
                              }}
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>

                    </div>
                  )
                )}
              </div>

            ) : (

              <div className="dashboard-stat-card">
                <p
                  style={{
                    color: "#71717a",
                    marginTop: "10px",
                  }}
                >
                  No technical skills identified.
                </p>
              </div>

            )}

          </section>
        )}

        {/* ====================================================
            SKILL GAPS
        ==================================================== */}

        {analysis && (
          <section
            className="resume-section"
            id="skill-gap-section"
          >

            <div className="section-title-row">

              <div>

                <p className="dashboard-section-label">
                  AI CAREER INSIGHTS
                </p>

                <h2>
                  Skill Gaps
                </h2>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#71717a",
                    fontSize: "13px",
                  }}
                >
                  AI-identified skills that could
                  strengthen your career profile.
                </p>

              </div>

            </div>

            {skillGaps.length > 0 ? (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >

                {skillGaps.map(
                  (gap, index) => {
                    const priority =
                      formatPriority(
                        gap.priority
                      );

                    return (
                      <div
                        className="dashboard-stat-card"
                        key={index}
                        style={{
                          minHeight: "auto",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "20px",
                        }}
                      >

                        <div>

                          <strong
                            style={{
                              color: "#f4f4f5",
                              fontSize: "14px",
                            }}
                          >
                            {gap.skill}
                          </strong>

                          <p
                            style={{
                              marginTop: "6px",
                              color: "#71717a",
                              fontSize: "12px",
                              lineHeight: 1.6,
                            }}
                          >
                            {gap.reason}
                          </p>

                        </div>

                        <span
                          style={{
                            flexShrink: 0,
                            padding:
                              "6px 10px",
                            borderRadius:
                              "999px",
                            border: `1px solid ${priority.border}`,
                            background:
                              priority.background,
                            color:
                              priority.color,
                            fontSize:
                              "9px",
                            fontWeight:
                              700,
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.6px",
                          }}
                        >
                          {gap.priority}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>

            ) : (

              <div className="dashboard-stat-card">
                <p
                  style={{
                    color: "#71717a",
                  }}
                >
                  No skill gaps identified.
                </p>
              </div>

            )}

          </section>
        )}

        {/* ====================================================
            RECOMMENDATIONS
        ==================================================== */}

        {analysis && (
          <section className="resume-section">

            <div className="section-title-row">

              <div>

                <p className="dashboard-section-label">
                  AI RECOMMENDATIONS
                </p>

                <h2>
                  What You Should Improve
                </h2>

              </div>

            </div>

            <div className="dashboard-stat-card">

              {recommendations.length > 0 ? (

                <ol
                  style={{
                    marginTop: "12px",
                    paddingLeft: "20px",
                    color: "#a1a1aa",
                    fontSize: "13px",
                    lineHeight: 1.8,
                  }}
                >
                  {recommendations.map(
                    (item, index) => (
                      <li
                        key={index}
                        style={{
                          marginBottom: "8px",
                        }}
                      >
                        {item}
                      </li>
                    )
                  )}
                </ol>

              ) : (

                <p
                  style={{
                    color: "#71717a",
                    marginTop: "10px",
                  }}
                >
                  No recommendations available.
                </p>

              )}

            </div>

          </section>
        )}

        {/* ====================================================
            ATS
        ==================================================== */}

        {analysis?.atsAnalysis && (
          <section className="resume-section">

            <div className="section-title-row">

              <div>

                <p className="dashboard-section-label">
                  ATS INTELLIGENCE
                </p>

                <h2>
                  Applicant Tracking System
                </h2>

              </div>

            </div>

            <div className="dashboard-stats">

              <div className="dashboard-stat-card">

                <span className="stat-label">
                  ATS SCORE
                </span>

                <strong className="stat-value">
                  {analysis.atsAnalysis.score}
                </strong>

                <p className="stat-description">
                  AI-generated ATS readiness.
                </p>

              </div>

              <div className="dashboard-stat-card">

                <span className="stat-label">
                  ATS STRENGTHS
                </span>

                {safeArray<string>(
                  analysis.atsAnalysis.strengths
                ).length > 0 ? (
                  <ul
                    style={{
                      marginTop: "16px",
                      paddingLeft: "18px",
                      color: "#a1a1aa",
                      fontSize: "12px",
                      lineHeight: 1.7,
                    }}
                  >
                    {safeArray<string>(
                      analysis.atsAnalysis
                        .strengths
                    ).map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p
                    style={{
                      color: "#71717a",
                      marginTop: "16px",
                    }}
                  >
                    No ATS strengths identified.
                  </p>
                )}

              </div>

              <div className="dashboard-stat-card">

                <span className="stat-label">
                  ATS IMPROVEMENTS
                </span>

                {safeArray<string>(
                  analysis.atsAnalysis
                    .improvements
                ).length > 0 ? (
                  <ul
                    style={{
                      marginTop: "16px",
                      paddingLeft: "18px",
                      color: "#a1a1aa",
                      fontSize: "12px",
                      lineHeight: 1.7,
                    }}
                  >
                    {safeArray<string>(
                      analysis.atsAnalysis
                        .improvements
                    ).map(
                      (item, index) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p
                    style={{
                      color: "#71717a",
                      marginTop: "16px",
                    }}
                  >
                    No ATS improvements identified.
                  </p>
                )}

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            CAREER SUGGESTIONS
        ==================================================== */}

        {analysis && (
          <section
            className="resume-section"
            id="career-section"
          >

            <div className="section-title-row">

              <div>

                <p className="dashboard-section-label">
                  AI CAREER GUIDANCE
                </p>

                <h2>
                  Suggested Career Paths
                </h2>

              </div>

            </div>

            {careerSuggestions.length > 0 ? (

              <div
                className="dashboard-stats"
                style={{
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(270px, 1fr))",
                }}
              >

                {careerSuggestions.map(
                  (career, index) => (
                    <div
                      className="dashboard-stat-card"
                      key={index}
                      style={{
                        minHeight:
                          "150px",
                      }}
                    >

                      <strong
                        style={{
                          color: "#f4f4f5",
                          fontSize: "16px",
                        }}
                      >
                        {career.role}
                      </strong>

                      <p
                        style={{
                          marginTop: "9px",
                          color: "#71717a",
                          fontSize: "12px",
                          lineHeight: 1.6,
                        }}
                      >
                        {career.reason}
                      </p>

                    </div>
                  )
                )}

              </div>

            ) : (

              <div className="dashboard-stat-card">
                <p
                  style={{
                    color: "#71717a",
                  }}
                >
                  No career suggestions available.
                </p>
              </div>

            )}

          </section>
        )}

        {/* ====================================================
            EDUCATION
        ==================================================== */}

        {education.length > 0 && (
          <section className="resume-section">

            <div className="section-title-row">
              <div>
                <p className="dashboard-section-label">
                  RESUME PROFILE
                </p>

                <h2>
                  Education
                </h2>
              </div>
            </div>

            <div
              className="dashboard-stats"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >

              {education.map(
                (item, index) => (
                  <div
                    className="dashboard-stat-card"
                    key={index}
                  >

                    <strong
                      style={{
                        color: "#f4f4f5",
                        fontSize: "16px",
                      }}
                    >
                      {item.degree ||
                        "Degree"}
                    </strong>

                    {item.field && (
                      <p
                        style={{
                          marginTop: "7px",
                          color: "#a1a1aa",
                          fontSize: "12px",
                        }}
                      >
                        {item.field}
                      </p>
                    )}

                    {item.institution && (
                      <p
                        style={{
                          marginTop: "8px",
                          color: "#c4b5fd",
                          fontSize: "12px",
                        }}
                      >
                        {item.institution}
                      </p>
                    )}

                    {item.location && (
                      <p
                        style={{
                          marginTop: "5px",
                          color: "#71717a",
                          fontSize: "11px",
                        }}
                      >
                        {item.location}
                      </p>
                    )}

                    {(item.startDate ||
                      item.endDate) && (
                      <p
                        style={{
                          marginTop: "5px",
                          color: "#71717a",
                          fontSize: "11px",
                        }}
                      >
                        {item.startDate ||
                          ""}
                        {" - "}
                        {item.endDate ||
                          ""}
                      </p>
                    )}

                    {item.grade && (
                      <p
                        style={{
                          marginTop: "5px",
                          color: "#71717a",
                          fontSize: "11px",
                        }}
                      >
                        Grade: {item.grade}
                      </p>
                    )}

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* ====================================================
            EXPERIENCE
        ==================================================== */}

        {experience.length > 0 && (
          <section className="resume-section">

            <div className="section-title-row">
              <div>
                <p className="dashboard-section-label">
                  PROFESSIONAL EXPERIENCE
                </p>

                <h2>
                  Experience
                </h2>
              </div>
            </div>

            <div
              className="dashboard-stats"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
              }}
            >

              {experience.map(
                (item, index) => (
                  <div
                    className="dashboard-stat-card"
                    key={index}
                    style={{
                      minHeight: "200px",
                    }}
                  >

                    <strong
                      style={{
                        color: "#f4f4f5",
                        fontSize: "16px",
                      }}
                    >
                      {item.role ||
                        "Role"}
                    </strong>

                    {item.company && (
                      <p
                        style={{
                          marginTop: "7px",
                          color: "#c4b5fd",
                          fontSize: "12px",
                        }}
                      >
                        {item.company}
                      </p>
                    )}

                    {(item.startDate ||
                      item.endDate) && (
                      <p
                        style={{
                          marginTop: "6px",
                          color: "#71717a",
                          fontSize: "11px",
                        }}
                      >
                        {item.startDate ||
                          ""}
                        {" - "}
                        {item.endDate ||
                          ""}
                      </p>
                    )}

                    {item.location && (
                      <p
                        style={{
                          marginTop: "5px",
                          color: "#71717a",
                          fontSize: "11px",
                        }}
                      >
                        {item.location}
                      </p>
                    )}

                    {item.description && (
                      <p
                        style={{
                          marginTop: "12px",
                          color: "#a1a1aa",
                          fontSize: "12px",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    {safeArray<string>(
                      item.technologies
                    ).length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginTop: "13px",
                        }}
                      >
                        {safeArray<string>(
                          item.technologies
                        ).map(
                          (technology, i) => (
                            <span
                              key={i}
                              style={{
                                padding:
                                  "5px 8px",
                                border:
                                  "1px solid #27272a",
                                borderRadius:
                                  "6px",
                                color:
                                  "#a78bfa",
                                fontSize:
                                  "10px",
                              }}
                            >
                              {technology}
                            </span>
                          )
                        )}
                      </div>
                    )}

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* ====================================================
            PROJECTS
        ==================================================== */}

        {projects.length > 0 && (
          <section className="resume-section">

            <div className="section-title-row">
              <div>
                <p className="dashboard-section-label">
                  PROJECT PORTFOLIO
                </p>

                <h2>
                  Projects
                </h2>
              </div>
            </div>

            <div
              className="dashboard-stats"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
              }}
            >

              {projects.map(
                (project, index) => (
                  <div
                    className="dashboard-stat-card"
                    key={index}
                    style={{
                      minHeight: "220px",
                    }}
                  >

                    <strong
                      style={{
                        color: "#f4f4f5",
                        fontSize: "16px",
                      }}
                    >
                      {project.name ||
                        "Project"}
                    </strong>

                    {project.description && (
                      <p
                        style={{
                          marginTop: "10px",
                          color: "#a1a1aa",
                          fontSize: "12px",
                          lineHeight: 1.6,
                        }}
                      >
                        {project.description}
                      </p>
                    )}

                    {safeArray<string>(
                      project.technologies
                    ).length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginTop: "12px",
                        }}
                      >
                        {safeArray<string>(
                          project.technologies
                        ).map(
                          (technology, i) => (
                            <span
                              key={i}
                              style={{
                                padding:
                                  "5px 8px",
                                border:
                                  "1px solid #27272a",
                                borderRadius:
                                  "6px",
                                color:
                                  "#a78bfa",
                                fontSize:
                                  "10px",
                              }}
                            >
                              {technology}
                            </span>
                          )
                        )}
                      </div>
                    )}

                    {safeArray<string>(
                      project.achievements
                    ).length > 0 && (
                      <ul
                        style={{
                          marginTop: "12px",
                          paddingLeft: "18px",
                          color: "#a1a1aa",
                          fontSize: "11px",
                          lineHeight: 1.7,
                        }}
                      >
                        {safeArray<string>(
                          project.achievements
                        ).map(
                          (achievement, i) => (
                            <li key={i}>
                              {achievement}
                            </li>
                          )
                        )}
                      </ul>
                    )}

                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display:
                            "inline-block",
                          marginTop:
                            "12px",
                          color:
                            "#a78bfa",
                          fontSize:
                            "11px",
                          textDecoration:
                            "none",
                        }}
                      >
                        View Project →
                      </a>
                    )}

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* ====================================================
            CERTIFICATIONS
        ==================================================== */}

        {certifications.length > 0 && (
          <section className="resume-section">

            <div className="section-title-row">
              <div>
                <p className="dashboard-section-label">
                  RESUME PROFILE
                </p>

                <h2>
                  Certifications
                </h2>
              </div>
            </div>

            <div
              className="dashboard-stats"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
              }}
            >

              {certifications.map(
                (cert, index) => (
                  <div
                    className="dashboard-stat-card"
                    key={index}
                  >

                    <strong>
                      {cert.name ||
                        "Certification"}
                    </strong>

                    {cert.organization && (
                      <p
                        style={{
                          marginTop: "8px",
                          color: "#c4b5fd",
                          fontSize: "12px",
                        }}
                      >
                        {cert.organization}
                      </p>
                    )}

                    {cert.date && (
                      <p
                        style={{
                          marginTop: "6px",
                          color: "#71717a",
                          fontSize: "11px",
                        }}
                      >
                        {cert.date}
                      </p>
                    )}

                  </div>
                )
              )}

            </div>

          </section>
        )}

        {/* ====================================================
            ACHIEVEMENTS
        ==================================================== */}

        {achievements.length > 0 && (
          <section className="resume-section">

            <div className="section-title-row">
              <div>
                <p className="dashboard-section-label">
                  RESUME PROFILE
                </p>

                <h2>
                  Achievements
                </h2>
              </div>
            </div>

            <div className="dashboard-stat-card">

              <ul
                style={{
                  marginTop: "8px",
                  paddingLeft: "20px",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  lineHeight: 1.8,
                }}
              >
                {achievements.map(
                  (achievement, index) => (
                    <li key={index}>
                      {achievement}
                    </li>
                  )
                )}
              </ul>

            </div>

          </section>
        )}

        {/* ====================================================
            SOFT SKILLS
        ==================================================== */}

        {softSkills.length > 0 && (
          <section className="resume-section">

            <div className="section-title-row">
              <div>
                <p className="dashboard-section-label">
                  AI EXTRACTED
                </p>

                <h2>
                  Soft Skills
                </h2>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "22px",
              }}
            >
              {softSkills.map(
                (skill, index) => (
                  <span
                    key={index}
                    style={{
                      padding:
                        "8px 12px",
                      border:
                        "1px solid #27272a",
                      borderRadius:
                        "8px",
                      background:
                        "#0f0f12",
                      color:
                        "#c4b5fd",
                      fontSize:
                        "11px",
                    }}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>

          </section>
        )}

        {/* ====================================================
            PROFESSIONAL SUMMARY
        ==================================================== */}

        {analysis?.professionalSummary && (
          <section className="resume-section">

            <div className="section-title-row">
              <div>
                <p className="dashboard-section-label">
                  AI EXTRACTED PROFILE
                </p>

                <h2>
                  Professional Summary
                </h2>
              </div>
            </div>

            <div className="dashboard-stat-card">

              <p
                style={{
                  marginTop: "10px",
                  color: "#a1a1aa",
                  fontSize: "14px",
                  lineHeight: 1.8,
                }}
              >
                {
                  analysis.professionalSummary
                }
              </p>

            </div>

          </section>
        )}

        {/* ====================================================
            NO ANALYSIS MESSAGE
        ==================================================== */}

        {!analysis && (
          <section className="activity-section">

            <div className="dashboard-section-label">
              ACTIVITY
            </div>

            <div className="empty-activity">

              <div className="empty-icon">
                ✦
              </div>

              <h3>
                No analyses yet
              </h3>

              <p>
                Upload your resume above and
                CareerLens will generate your
                first AI career intelligence report.
              </p>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default Dashboard;