import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { login as apiLogin } from "../api/auth";
import { extractErrorMessage } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { fieldLabelStyle, FormError } from "../components/FormError";
import { Spinner } from "../components/Spinner";
import { useToast } from "../components/toast-context";
import { useAuth } from "../auth/AuthContext";

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const token = await apiLogin({ email, password });
      await login(token.access_token);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = extractErrorMessage(err, "Incorrect email or password.");
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
            Every client&apos;s growth, in one calm view.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.55,
              color: "rgba(255,248,239,.78)",
            }}
          >
            Monitor channels, spot momentum, and send polished reports — without
            the busywork.
          </p>
        </>
      }
      footer={
        <div
          style={{
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 22px",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--font-serif)",
              fontSize: 17,
              lineHeight: 1.5,
              color: "var(--cream-50)",
            }}
          >
            &ldquo;Crosswave replaced three spreadsheets and a weekly scramble.
            Client reports now take minutes.&rdquo;
          </p>
          <span style={{ fontSize: 13, color: "rgba(255,248,239,.7)" }}>
            Account director · boutique agency
          </span>
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
        Welcome back
      </h2>
      <p style={{ margin: "0 0 30px", fontSize: 15, color: "var(--text-muted)" }}>
        Sign in to your agency workspace.
      </p>

      <form onSubmit={handleSubmit}>
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
        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabelStyle}>Password</label>
          <input
            className="cw-input"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "var(--accent)" }}
            />
            Remember me
          </label>
          <button
            type="button"
            className="cw-link-btn"
            style={{ fontSize: 13 }}
            onClick={() =>
              toast.show("Password reset isn't available yet.", "info")
            }
          >
            Forgot password?
          </button>
        </div>

        {error && <FormError message={error} />}

        <button
          type="submit"
          className="cw-btn-accent"
          disabled={submitting}
          style={{ width: "100%", height: 46 }}
        >
          {submitting ? <Spinner size={18} color="var(--text-on-accent)" /> : "Sign in"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          margin: "22px 0",
        }}
      >
        <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        <span style={{ fontSize: 12, color: "var(--text-faint)" }}>or</span>
        <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
      </div>

      <button
        type="button"
        className="cw-btn-secondary"
        style={{ width: "100%", height: 46 }}
        onClick={() =>
          toast.show("Google sign-in isn't available yet.", "info")
        }
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
          />
        </svg>
        Continue with Google
      </button>

      <p
        style={{
          margin: "26px 0 0",
          textAlign: "center",
          fontSize: 14,
          color: "var(--text-muted)",
        }}
      >
        New to Crosswave?{" "}
        <Link to="/signup" className="cw-link-btn" style={{ fontSize: 14 }}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
