import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";

export default function ClaimPage() {
  const theme = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    try {
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div
        className={`min-h-screen ${theme.text.primary} flex items-center justify-center`}
        style={{ background: theme.background }}
      >
        <div
          className={`max-w-md w-full text-center rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} p-8 ring-1 ring-white/5`}
        >
          <h1 className="text-2xl font-bold mb-2">Request received</h1>
          <p className={theme.text.muted}>
            Thanks! We'll reach out via email within 2–3 days.
          </p>
          <a
            href="/"
            className={`inline-block mt-6 px-4 py-2 rounded-lg border ${theme.bg.border} ${theme.hover.bg}`}
          >
            Back Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.text.primary}`}
      style={{ background: theme.background }}
    >
      <main className="px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Claim your profile
          </h1>
          <p className={`${theme.text.muted} mt-2`}>
            Tell us about your restaurant and we'll verify ownership.
          </p>

          <form
            onSubmit={onSubmit}
            className={`mt-6 space-y-4 rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} p-6 ring-1 ring-white/5`}
          >
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <div>
              <label className="text-sm">Restaurant name</label>
              <input
                required
                className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.bg.overlay}`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Owner name</label>
                <input
                  required
                  className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.bg.overlay}`}
                />
              </div>
              <div>
                <label className="text-sm">Email</label>
                <input
                  type="email"
                  required
                  className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.bg.overlay}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Phone</label>
                <input
                  type="tel"
                  className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.bg.overlay}`}
                />
              </div>
              <div>
                <label className="text-sm">Website / Instagram</label>
                <input
                  type="url"
                  className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.bg.overlay}`}
                />
              </div>
            </div>
            <div>
              <label className="text-sm">Message</label>
              <textarea
                rows={4}
                className={`mt-1 w-full px-3 py-2 rounded-lg border ${theme.bg.border} ${theme.bg.overlay}`}
                placeholder="Anything else we should know"
              />
            </div>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg ${theme.bg.accent} ${theme.bg.accentText} font-medium`}
            >
              Submit
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
