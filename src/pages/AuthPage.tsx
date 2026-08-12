import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, registerAccount, getActiveUser } from "../lib/auth-storage";
import BrandFooter from "../components/BrandFooter";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    if (user) {
      navigate(user.role === "driver" ? "/driver" : "/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    if (mode === "login") {
      const result = signIn({ email, password });
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error ?? "Login fehlgeschlagen.");
        return;
      }
      navigate(result.user?.role === "driver" ? "/driver" : "/dashboard", { replace: true });
      return;
    }

    // Register: Owner only
    const result = registerAccount({
      email,
      password,
      companyName,
      role: "owner",
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Registrierung fehlgeschlagen.");
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-dvh bg-asphalt text-cream font-body flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber rounded-2xl shadow-lamp mb-4">
              <span className="text-3xl">🚕</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-signage uppercase text-cream">
              {mode === "login" ? "TaxiSchild Login" : "Unternehmen anlegen"}
            </h1>
            <p className="text-muted">
              {mode === "login"
                ? "Melden Sie sich an, um Ihre Fahrten und Einstellungen zu sehen."
                : "Erstellen Sie Ihr Unternehmen. Fahrer werden später im Dashboard hinzugefügt."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-muted uppercase tracking-signage">E-Mail *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
                placeholder="name@firma.de"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-muted uppercase tracking-signage">Passwort *</label>
              <input
                required
                type="password"
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
                placeholder="Mindestens 4 Zeichen"
              />
            </div>

            {mode === "register" && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-muted uppercase tracking-signage">Unternehmen *</label>
                <input
                  required
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-md border border-line bg-asphalt px-3 py-3 text-lg text-cream placeholder:text-muted/50 outline-none focus:border-amber"
                  placeholder="z. B. Stadttaxi München"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-alert/10 border border-alert/20 rounded-lg">
                <p className="text-sm text-alert font-medium">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-amber text-asphalt rounded-xl font-bold text-base hover:bg-amber/90 transition shadow-lamp active:scale-[0.98] uppercase tracking-signage disabled:opacity-50"
            >
              {submitting ? "Bitte warten..." : mode === "login" ? "Einloggen" : "Unternehmen anlegen"}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-sm text-muted hover:text-amber transition underline underline-offset-4"
            >
              {mode === "login" ? "Neues Unternehmen anlegen" : "Bereits registriert? Einloggen"}
            </button>
          </div>

          {/* Driver hint */}
          <div className="bg-panel/50 border border-line/50 rounded-xl p-4 text-center">
            <p className="text-sm text-muted">👤 <span className="text-cream font-medium">Fahrer?</span></p>
            <p className="text-xs text-muted mt-1">Ihr Unternehmer erstellt Ihr Konto im Dashboard. Sie erhalten dann Ihre Zugangsdaten.</p>
          </div>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
