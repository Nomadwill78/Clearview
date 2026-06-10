import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { BarChart3, FileText, MessageSquare, TrendingUp, Shield, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-navy)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--color-parchment)" }}>
            <span className="text-xs font-bold" style={{ color: "var(--color-navy)", fontFamily: "var(--font-serif)" }}>N</span>
          </div>
          <span className="text-white font-serif text-lg tracking-wide">The Navigator</span>
          <span className="text-white/40 text-xs ml-1">by Nomad Consulting</span>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link href="/sign-in" className="text-white/80 hover:text-white text-sm transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "var(--color-parchment)", color: "var(--color-navy)" }}
            >
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "var(--color-parchment)", color: "var(--color-navy)" }}
            >
              Go to dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6 border border-white/20 text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Purpose-built for nonprofit leaders
        </div>
        <h1 className="text-5xl md:text-6xl font-serif text-white mb-6 leading-tight">
          Navigate your organization<br />to greater impact
        </h1>
        <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          Upload your reports. Understand your KPIs. Get a personalized roadmap — backed by a virtual consultant that&apos;s always ready, and a Nomad advisor when you need one.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="px-8 py-3.5 rounded-xl text-base font-medium transition-all hover:opacity-90"
            style={{ background: "var(--color-parchment)", color: "var(--color-navy)" }}
          >
            Start your free trial
          </Link>
          <Link
            href="/sign-in"
            className="px-8 py-3.5 rounded-xl text-base font-medium border border-white/20 text-white hover:bg-white/5 transition-all"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: FileText, title: "Document Intelligence", body: "Upload 990s, audits, grant reports, and board minutes. AI extracts your KPI data automatically." },
            { icon: BarChart3, title: "KPI Dashboard", body: "See your performance across five domains: financial health, program impact, governance, fundraising, and operations." },
            { icon: TrendingUp, title: "Improvement Roadmap", body: "AI generates a prioritized action plan based on your gaps. Track progress and show your board results." },
            { icon: MessageSquare, title: "Virtual Consultant", body: "Ask any question about your data. Get answers grounded in your actual documents and KPI scores." },
            { icon: Shield, title: "Secure & Private", body: "Each organization's data is isolated. Role-based access ensures the right people see the right information." },
            { icon: Users, title: "Human When You Need It", body: "When complexity calls for it, connect instantly to a Nomad Consulting advisor — briefed and ready." },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-6 rounded-2xl border border-white/10"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "var(--color-parchment)" }}>
                <Icon size={20} style={{ color: "var(--color-navy)" }} />
              </div>
              <h3 className="text-white font-serif text-lg mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-8 text-center text-white/40 text-sm">
        © {new Date().getFullYear()} Nomad Consulting. The Navigator is a Nomad Consulting product.
      </footer>
    </div>
  );
}
