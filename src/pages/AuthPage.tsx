import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import BrandFooter from "../components/BrandFooter";
import FormField from "../components/FormField";
import RoofSign from "../components/RoofSign";
import { getActiveUser, registerAccount, signIn } from "../lib/auth-storage";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getActiveUser()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      navigate("/dashboard", { replace: true });
      return;
    }

    const result = registerAccount({
      email,
      password,
      companyName,
      vehicleNumber,
      driverName,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Registrierung fehlgeschlagen.");
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-10 sm:py-14">
      <header className="mb-8 flex flex-col items-center">
        <RoofSign litSegments={mode === "register" ? 3 : 2} />
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-full border border-line bg-panel p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 rounded-full px-3 py-2 font-mono text-xs uppercase tracking-signage transition-colors ${
              mode === "login" ? "bg-amber text-asphalt" : "text-muted"
            }`}
          >
            Einloggen
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`flex-1 rounded-full px-3 py-2 font-mono text-xs uppercase tracking-signage transition-colors ${
              mode === "register" ? "bg-amber text-asphalt" : "text-muted"
            }`}
          >
            Konto anlegen
          </button>
        </div>

        <div className="rounded-lg border border-line bg-panel p-5">
          <h1 className="font-display text-2xl font-700 uppercase tracking-wide text-cream">
            {mode === "login" ? "TaxiSchild Login" : "Unternehmen anlegen"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "login"
              ? "Melden Sie sich an, um nur Ihre eigenen Fahrten, Berichte und Einstellungen zu sehen."
              : "Erstellen Sie Ihr eigenes Konto. Jede Firma und jeder Fahrer erhält einen geschützten Bereich."}
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <FormField
              id="email"
              label="E-Mail"
              placeholder="name@firma.de"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <FormField
              id="password"
              label="Passwort"
              placeholder="Mindestens 4 Zeichen"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {mode === "register" && (
              <>
                <FormField
                  id="companyName"
                  label="Unternehmen"
                  placeholder="z. B. Stadttaxi München"
                  value={companyName}
                  onChange={setCompanyName}
                  autoComplete="organization"
                />
                <FormField
                  id="vehicleNumber"
                  label="Fahrzeug-Nr."
                  placeholder="z. B. M-TX 1234"
                  value={vehicleNumber}
                  onChange={setVehicleNumber}
                  mono
                />
                <FormField
                  id="driverName"
                  label="Fahrername"
                  placeholder="Vor- und Nachname"
                  value={driverName}
                  onChange={setDriverName}
                  autoComplete="name"
                />
              </>
            )}

            {error && <p className="rounded-md border border-alert/50 bg-asphalt px-3 py-2 text-sm text-alert">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="h-14 w-full rounded-md bg-amber font-display text-lg font-700 uppercase tracking-signage text-asphalt transition-opacity disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
            >
              {mode === "login" ? "Anmelden" : "Konto erstellen"}
            </button>
          </form>
        </div>
      </section>

      <BrandFooter />
    </main>
  );
}
