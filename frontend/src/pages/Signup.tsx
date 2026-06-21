import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../api/auth";
import { extractErrorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { fieldLabelStyle, FormError } from "../components/FormError";
import { IconCheck } from "../components/Icons";
import { Spinner } from "../components/Spinner";
import { useToast } from "../components/toast-context";

const FEATURES = [
  "One panel for all your client channels",
  "Auto-generated reports, branded for you",
  "Instagram & TikTok coming soon",
];

export function SignupPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError("Please accept the terms of service to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await apiRegister({
        email,
        password,
        agency_name: agencyName,
      });
      await login(token.access_token);
      toast.show("Workspace created. Welcome to Crosswave!", "success");
      navigate("/", { replace: true });
    } catch (err) {
      const message = extractErrorMessage(err, "Could not create your account.");
      setError(message);
      toast.show(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      headline={
        <>
          <h1
            style={{
              margin: "0 0 16px",
              fontFamily: "var(--font-serif)",
              fontSize: 46,
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-.01em",
            }}
          >
            Start tracking every client in minutes.
          </h1>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginTop: 8,
            }}
          >
            {FEATURES.map((f) => (
              <span
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 16,
                  color: "rgba(255,248,239,.85)",
                }}
              >
                <IconCheck size={20} color="var(--gold-200)" strokeWidth={2.2} />
                {f}
              </span>
            ))}
          </div>
        </>
      }
      footer={
        <div style={{ fontSize: 13, color: "rgba(255,248,239,.65)" }}>
          Trusted by independent agencies and freelancers.
        </div>
      }
    >
      <h2
        style={{
          margin: "0 0 8px",
          fontFamily: "var(--font-serif)",
          fontSize: 30,
          fontWeight: 600,
          color: "var(--ink-900)",
          letterSpacing: "-.01em",
        }}
      >
        Create your workspace
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 15, color: "var(--text-muted)" }}>
        Free for 14 days. No card required.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabelStyle}>Agency name</label>
          <input
            className="cw-input"
            type="text"
            required
            placeholder="Atlas Social"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            autoComplete="organization"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={fieldLabelStyle}>Work email</label>
          <input
            className="cw-input"
            type="email"
            required
            placeholder="you@agency.co"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={fieldLabelStyle}>Password</label>
          <input
            className="cw-input"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 9,
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 22,
            cursor: "pointer",
            lineHeight: 1.4,
          }}
        >
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{
              width: 15,
              height: 15,
              marginTop: 1,
              accentColor: "var(--accent)",
            }}
          />
          I agree to the terms of service and privacy policy.
        </label>

        {error && <FormError message={error} />}

        <button
          type="submit"
          className="cw-btn-accent"
          disabled={submitting}
          style={{ width: "100%", height: 46 }}
        >
          {submitting ? (
            <Spinner size={18} color="var(--text-on-accent)" />
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p
        style={{
          margin: "26px 0 0",
          textAlign: "center",
          fontSize: 14,
          color: "var(--text-muted)",
        }}
      >
        Already have an account?{" "}
        <Link to="/login" className="cw-link-btn" style={{ fontSize: 14 }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
