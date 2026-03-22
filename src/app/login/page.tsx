"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemoLogin = async (role: "applicant" | "reviewer") => {
    setIsLoading(true);
    setError("");

    try {
      const email =
        role === "applicant"
          ? "applicant@credora.com"
          : "reviewer@credora.com";

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password: "password",
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="marketing-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card stack-md" style={{ maxWidth: 420, width: "100%" }}>
        <div className="stack-sm" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}>
            <Logo size={40} />
          </div>
          <h2>Sign in to Credora</h2>
          <p className="body-muted">Choose a demo account to continue</p>
        </div>

        {error && (
          <div className="status-banner" style={{ background: "var(--caution-soft)", color: "var(--caution)" }}>
            {error}
          </div>
        )}

        <div className="stack-sm">
          <button
            onClick={() => handleDemoLogin("applicant")}
            disabled={isLoading}
            className="button button--primary"
            style={{ width: "100%" }}
          >
            {isLoading ? "Signing in\u2026" : "Sign in as Applicant"}
          </button>

          <button
            onClick={() => handleDemoLogin("reviewer")}
            disabled={isLoading}
            className="button button--secondary"
            style={{ width: "100%" }}
          >
            {isLoading ? "Signing in\u2026" : "Sign in as Reviewer"}
          </button>
        </div>

        <p className="body-muted" style={{ textAlign: "center", fontSize: "0.82rem" }}>
          Demo credentials &mdash; password: <code style={{ fontFamily: "var(--font-mono)" }}>password</code>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="marketing-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p className="body-muted">Loading&hellip;</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
