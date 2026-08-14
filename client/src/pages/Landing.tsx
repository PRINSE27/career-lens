import { Link } from "react-router-dom";


function Landing() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          Career<span>Lens</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
  <Link to="/login" className="login-btn">
    Log in
  </Link>

  <Link to="/login" className="signup-btn">
    Get Started
  </Link>
</div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="badge">
              ✦ AI-powered career intelligence
            </div>

            <h1>
              Your resume.
              <br />
              Your career.
              <br />
              <span>Better aligned.</span>
            </h1>

            <p>
              CareerLens analyzes your resume against real job
              requirements, identifies your skill gaps, and helps you
              build a stronger path toward your next opportunity.
            </p>

            <div className="hero-actions">
              <button className="primary-btn">
                Analyze My Resume →
              </button>

              <button className="secondary-btn">
                See how it works
              </button>
            </div>

            <div className="trust">
              <span>✓ Resume analysis</span>
              <span>✓ Job matching</span>
              <span>✓ Skill gap insights</span>
            </div>
          </div>

          <div className="hero-card">
            <div className="card-header">
              <div>
                <small>JOB MATCH</small>
                <h3>Software Engineer</h3>
              </div>

              <div className="match-score">87%</div>
            </div>

            <div className="progress">
              <div className="progress-fill"></div>
            </div>

            <div className="skills">
              <div className="skill good">
                <span>✓</span>
                Python
              </div>

              <div className="skill good">
                <span>✓</span>
                React
              </div>

              <div className="skill good">
                <span>✓</span>
                REST APIs
              </div>

              <div className="skill warning">
                <span>!</span>
                System Design
              </div>

              <div className="skill missing">
                <span>×</span>
                AWS
              </div>
            </div>

            <div className="insight">
              <div className="insight-icon">✦</div>

              <div>
                <strong>CareerLens insight</strong>
                <p>
                  Adding AWS and System Design experience could
                  significantly improve your match for this role.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features">
          <div className="section-heading">
            <span>WHAT CAREERLENS DOES</span>

            <h2>
              More than a resume
              <br />
              checker.
            </h2>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <h3>Resume Intelligence</h3>
              <p>
                Understand what's strong, what's weak, and what
                recruiters may be missing in your resume.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">02</div>
              <h3>Job Matching</h3>
              <p>
                Compare your resume with real job descriptions and
                understand exactly where you stand.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">03</div>
              <h3>Skill Gap Analysis</h3>
              <p>
                Discover the skills you're missing and prioritize
                what is actually valuable for your target roles.
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="workflow">
          <div className="section-heading">
            <span>HOW IT WORKS</span>

            <h2>
              From resume
              <br />
              to career clarity.
            </h2>
          </div>

          <div className="steps">
            <div className="step">
              <span>01</span>
              <h3>Upload</h3>
              <p>Upload your current resume.</p>
            </div>

            <div className="step">
              <span>02</span>
              <h3>Analyze</h3>
              <p>
                CareerLens extracts and analyzes your experience,
                skills and projects.
              </p>
            </div>

            <div className="step">
              <span>03</span>
              <h3>Match</h3>
              <p>
                Compare your profile against the roles you want.
              </p>
            </div>

            <div className="step">
              <span>04</span>
              <h3>Improve</h3>
              <p>
                Get actionable recommendations and track your
                progress.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer id="about">
        <div className="logo">
          Career<span>Lens</span>
        </div>

        <p>
          AI-powered career intelligence for the modern job search.
        </p>

        <span>© 2026 CareerLens</span>
      </footer>
    </div>
  );
}
export default Landing;