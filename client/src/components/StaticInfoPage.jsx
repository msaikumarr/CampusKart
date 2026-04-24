import { Link } from "react-router-dom";

export default function StaticInfoPage({ title, subtitle, sections, primaryCta, secondaryCta }) {
  return (
    <div className="min-h-screen px-4 py-16" style={{ backgroundColor: "#faf8f4" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-sm font-semibold" style={{ color: "#1d4ed8" }}>
            ← Back to Home
          </Link>
        </div>

        <div className="rounded-3xl border p-8 sm:p-10" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: "#1d4ed8" }}>
            CampusKart
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight" style={{ color: "#1e293b" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: "#64748b" }}>
              {subtitle}
            </p>
          )}

          <div className="mt-10 grid gap-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-2xl border p-5 sm:p-6" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
                <h2 className="text-lg font-bold mb-2" style={{ color: "#1e293b" }}>
                  {section.title}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#475569" }}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              {primaryCta && (
                <Link
                  to={primaryCta.to}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  to={secondaryCta.to}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold border"
                  style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}