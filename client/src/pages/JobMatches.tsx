import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JobMatches.css";

type Job = {
  id: number;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string;
};

type JobMatch = {
  id: number;
  matchScore: number;
  matchingSkills: unknown;
  missingSkills: unknown;
  explanation: string | null;
  recommendations: unknown;
  job: Job;
};

const API_URL = "http://localhost:5000";

function JobMatches() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Authentication required.");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/jobs/matches`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load job matches"
          );
        }

        setMatches(
          Array.isArray(data.matches)
            ? data.matches
            : []
        );
      } catch (err) {
        console.error("Job matches error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load job matches"
        );
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const arrayFromValue = (
    value: unknown
  ): string[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => String(item));
  };

  if (loading) {
    return (
      <div className="job-matches-page">
        <div className="job-matches-container">
          <p>Loading your AI job matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-matches-page">
      <div className="job-matches-container">
        <div className="job-matches-header">
          <div>
            <p className="job-matches-eyebrow">
              AI CAREER MATCHING
            </p>

            <h1>Job Matches</h1>

            <p className="job-matches-subtitle">
              Jobs ranked by how well they match
              your CareerLens profile.
            </p>
          </div>

          <button
            type="button"
            className="back-dashboard-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        {error && (
          <div className="job-matches-error">
            {error}
          </div>
        )}

        {!error && matches.length === 0 && (
          <div className="job-matches-empty">
            <h2>No job matches yet</h2>

            <p>
              Run AI job matching from CareerLens
              to see personalized jobs here.
            </p>
          </div>
        )}

        {!error && matches.length > 0 && (
          <div className="job-match-list">
            {matches.map((match) => {
              const matchingSkills =
                arrayFromValue(
                  match.matchingSkills
                );

              const missingSkills =
                arrayFromValue(
                  match.missingSkills
                );

              const recommendations =
                arrayFromValue(
                  match.recommendations
                );

              return (
                <div
                  key={match.id}
                  className="job-match-card"
                >
                  <div className="job-card-top">
                    <div>
                      <p className="job-source">
                        {match.job.company}
                      </p>

                      <h2>
                        {match.job.title}
                      </h2>

                      <p className="job-location">
                        {match.job.location ||
                          "Location not specified"}

                        {match.job.remote &&
                          " • Remote"}
                      </p>
                    </div>

                    <div className="job-score">
                      {match.matchScore}%
                    </div>
                  </div>

                  {matchingSkills.length >
                    0 && (
                    <div className="job-detail-section">
                      <h3>
                        Matching Skills
                      </h3>

                      <div className="skill-list">
                        {matchingSkills.map(
                          (skill) => (
                            <span
                              key={skill}
                              className="skill-tag matching"
                            >
                              ✓ {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {missingSkills.length >
                    0 && (
                    <div className="job-detail-section">
                      <h3>
                        Skills to Improve
                      </h3>

                      <div className="skill-list">
                        {missingSkills.map(
                          (skill) => (
                            <span
                              key={skill}
                              className="skill-tag missing"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {match.explanation && (
                    <div className="job-detail-section">
                      <h3>
                        Why You Match
                      </h3>

                      <p className="job-explanation">
                        {match.explanation}
                      </p>
                    </div>
                  )}

                  {recommendations.length >
                    0 && (
                    <div className="job-detail-section">
                      <h3>
                        Recommendations
                      </h3>

                      <ul className="recommendation-list">
                        {recommendations.map(
                          (item) => (
                            <li key={item}>
                              {item}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="job-card-actions">
                    <a
                      href={match.job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="apply-job-btn"
                    >
                      Apply →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobMatches;