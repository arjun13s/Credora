import { Logo } from "@/components/logo";
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/auth/login");

  // This won't render, but keeps the page valid
  return (
    <div className="marketing-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="card stack-md" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}>
          <Logo size={40} />
        </div>
        <h2>Redirecting to login&hellip;</h2>
        <p className="body-muted">You are being redirected to the authentication provider.</p>
      </div>
    </div>
  );
}
