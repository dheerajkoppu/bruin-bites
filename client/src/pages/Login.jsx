import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../context/useAuth.js";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isLoading, signIn } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/profile" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting || isLoading) return;
    setError("");
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn({ email, password });
      navigate("/profile", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="login-heading">
      <h1 id="login-heading">Log in</h1>
      <p>Welcome back to Bruin Bites.</p>
      <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting || isLoading}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Logging in…" : isLoading ? "Checking session…" : "Log in"}
        </button>
      </form>
      <p>Need an account? <Link to="/signup">Sign up</Link></p>
    </section>
  );
}

export default Login;
