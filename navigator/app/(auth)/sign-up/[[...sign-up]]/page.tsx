import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--color-navy)" }}>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-serif text-white mb-1">The Navigator</h1>
        <p className="text-white/50 text-sm">by Nomad Consulting</p>
      </div>
      <SignUp />
    </div>
  );
}
