import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — HAPPY X" },
      { name: "description", content: "Access the HAPPY X Executive Console." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your inbox to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-screen bg-obsidian text-paper flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.12),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gold to-gold-deep flex items-center justify-center text-obsidian font-black">
              H
            </div>
            <span className="font-semibold tracking-tight">HAPPY X</span>
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/70 mb-6">
              Executive AI Platform
            </p>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight max-w-md">
              The Human-Centered AI Operating Platform.
            </h1>
            <p className="mt-6 text-sm text-soft-gray max-w-sm leading-relaxed">
              One console for AI, education, business, enterprise, creator studio, and community —
              built to feel timeless.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-soft-gray/60">
            © HAPPY PERSON PRIVATE LIMITED
          </p>
        </div>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow mb-3">{mode === "signin" ? "Welcome back" : "Create account"}</p>
          <h2 className="font-display text-3xl tracking-tight mb-8">
            {mode === "signin" ? "Sign in to HAPPY X" : "Join HAPPY X"}
          </h2>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm font-medium"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-soft-gray">or email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/10 px-4 text-sm placeholder:text-soft-gray/60 focus:outline-none focus:border-gold/50 transition-colors"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/10 px-4 text-sm placeholder:text-soft-gray/60 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/10 px-4 text-sm placeholder:text-soft-gray/60 focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-gold text-obsidian font-semibold text-sm hover:bg-gold-bright transition-colors disabled:opacity-50"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-soft-gray text-center">
            {mode === "signin" ? "New to HAPPY X?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-gold hover:text-gold-bright font-medium"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5c1.6 0 3.1.6 4.2 1.6l3.2-3.1C17.5 1.6 14.9.5 12 .5 7.3.5 3.3 3.2 1.4 7.1l3.7 2.9C6.1 7 8.8 5 12 5z"/>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.6 2.8c2.1-2 3.8-4.9 3.8-8.5z"/>
      <path fill="#FBBC05" d="M5.1 14.3c-.3-.8-.4-1.6-.4-2.4s.2-1.6.4-2.4L1.4 6.6C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.4l3.7-2.9z"/>
      <path fill="#34A853" d="M12 23.5c3.2 0 5.9-1.1 7.9-2.9l-3.6-2.8c-1 .7-2.3 1.1-4.3 1.1-3.2 0-5.9-2.1-6.9-5l-3.7 2.9C3.3 20.8 7.3 23.5 12 23.5z"/>
    </svg>
  );
}
