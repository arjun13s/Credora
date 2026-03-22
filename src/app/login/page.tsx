"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams?.get("role") as "applicant" | "reviewer" | null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (loginRole: "applicant" | "reviewer") => {
    setIsLoading(true);
    setError("");

    const email = loginRole === "applicant" ? "applicant@credora.com" : "reviewer@credora.com";
    const redirectTo = loginRole === "applicant" ? "/applicant" : "/review";

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password: "password",
      });

      if (result?.error) {
        setError("Sign in failed. Please try again.");
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <Logo size={40} />
          </div>
          <h2 style={{ marginBottom: "0.4rem" }}>Sign in to Credora</h2>
          <p className="body-muted">
            {role === "reviewer" ? "Signing in as a reviewer" : role === "applicant" ? "Signing in as an applicant" : "Choose your role to continue"}
          </p>
        </div>

        {error && (
          <div style={{ background: "var(--caution-soft)", color: "var(--caution)", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {(!role || role === "applicant") && (
            <button
              onClick={() => handleLogin("applicant")}
              disabled={isLoading}
              className="button button--primary"
              style={{ width: "100%", height: "52px", fontSize: "0.95rem" }}
            >
              {isLoading ? "Signing in…" : "Continue as Applicant"}
            </button>
          )}
          {(!role || role === "reviewer") && (
            <button
              onClick={() => handleLogin("reviewer")}
              disabled={isLoading}
              className="button button--secondary"
              style={{ width: "100%", height: "52px", fontSize: "0.95rem" }}
            >
              {isLoading ? "Signing in…" : "Continue as Reviewer"}
            </button>
          )}
        </div>

        <p className="body-muted" style={{ textAlign: "center", fontSize: "0.78rem", marginTop: "1.5rem" }}>
          Demo only — no real credentials required
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <LoginForm />
    </Suspense>
  );
}
