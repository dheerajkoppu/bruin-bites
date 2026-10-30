import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { signup } from "../api/auth.js";
import { useAuth } from "../context/useAuth.js";

function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/profile" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");

    if (!email.trim() || !username.trim()) {
      setError("Enter an email address and username.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await signup({ email, username, password });
      setUser(newUser);
      navigate("/profile", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="signup-card" aria-labelledby="signup-heading">
      <h1 id="signup-heading">Sign up</h1>
      <p>Create your Bruin Bites account.</p>
      <form className="signup-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label htmlFor="signup-email">Email</label>
        <input id="signup-email" name="email" type="email" autoComplete="email"
          required value={email} onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting} />

        <label htmlFor="signup-username">Username</label>
        <input id="signup-username" name="username" autoComplete="username"
          required value={username} onChange={(event) => setUsername(event.target.value)}
          disabled={isSubmitting} />

        <label htmlFor="signup-password">Password</label>
        <input id="signup-password" name="password" type="password" autoComplete="new-password"
          required value={password} onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting} />

        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </section>
  );
}

export default Signup;
