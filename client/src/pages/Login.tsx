import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      console.log("Login successful:", data);

      // Save logged-in user
localStorage.setItem(
  "token",
  data.token
);

localStorage.setItem(
  "user",
  JSON.stringify(data.user)
);

      // Go to dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to server");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <Link to="/" className="auth-logo">
        Career<span>Lens</span>
      </Link>

      <div className="auth-card">

        <div className="auth-header">
          <h1>Welcome back</h1>

          <p>
            Sign in to continue your career journey.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >

          <div className="form-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          <div className="form-group">

            <div className="password-label">

              <label htmlFor="password">
                Password
              </label>

              <a href="#">
                Forgot password?
              </a>

            </div>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="google-btn"
        >
          <span className="google-icon">
            G
          </span>

          Continue with Google
        </button>

        <p className="auth-footer">
          Don't have an account?{" "}

          <Link to="/signup">
            Create one
          </Link>
        </p>

      </div>

      <Link
        to="/"
        className="back-home"
      >
        ← Back to CareerLens
      </Link>

    </div>
  );
}

export default Login;