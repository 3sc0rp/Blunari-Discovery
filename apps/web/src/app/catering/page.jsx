import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";

export default function CateringPage() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  function capture(e) {
    e.preventDefault();
    try {
      if (typeof window !== "undefined") {
        const list = JSON.parse(
          localStorage.getItem("blunari:cateringSignup") || "[]",
        );
        list.push({ email, at: Date.now() });
        localStorage.setItem("blunari:cateringSignup", JSON.stringify(list));
      }
      setSaved(true);
    } catch (err) {
      console.error(err);
      setSaved(true);
    }
  }

  return (
    <div
      className={`min-h-screen ${theme.text.primary} flex items-center`}
      style={{ background: theme.background }}
    >
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 text-center relative">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 -translate-x-1/2 -top-20 w-96 h-96 rounded-full bg-[#22d3ee]/15 blur-3xl" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold">
          Catering — Coming Soon
        </h1>
        <p className={`${theme.text.muted} mt-4`}>
          We're building a curated catering program for Atlanta events. Leave
          your email and we'll notify you when it's ready.
        </p>

        {saved ? (
          <div
            className={`mt-6 rounded-2xl ${theme.bg.overlay} border ${theme.bg.border} p-6 ring-1 ring-white/5`}
          >
            Thanks! We'll be in touch.
          </div>
        ) : (
          <form
            onSubmit={capture}
            className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <input
              required
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`px-4 py-3 rounded-lg border ${theme.bg.border} ${theme.bg.overlay} w-full sm:w-80`}
            />
            <button
              type="submit"
              className={`px-5 py-3 rounded-lg ${theme.bg.accent} ${theme.bg.accentText} font-medium ring-1 ring-black/0 hover:ring-black/10`}
            >
              Notify me
            </button>
          </form>
        )}

        <a
          href="/"
          className={`inline-block mt-8 text-sm underline ${theme.hover.text}`}
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
