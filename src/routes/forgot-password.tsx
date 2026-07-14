import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — HAPPY X" },
      { name: "description", content: "Reset your HAPPY Enterprise Identity password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset link sent. Check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-gold/20 bg-obsidian/70 p-8 backdrop-blur-xl">
        <Link to="/auth" className="inline-flex items-center gap-1 text-xs text-soft-gray hover:text-gold">
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
          <ShieldCheck className="h-3 w-3" /> Recovery
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight">Forgot your password?</h1>
        <p className="mt-2 text-sm text-soft-gray">
          Enter your email and we'll send you a secure reset link.
        </p>
        {sent ? (
          <div className="mt-6 rounded-2xl border border-gold/20 bg-obsidian/40 p-4 text-sm text-paper">
            A password reset email has been sent to <span className="text-gold">{email}</span>.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-soft-gray">Email</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-gold/25 bg-obsidian/60 px-3">
                <Mail className="h-4 w-4 text-gold" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-paper outline-none placeholder:text-soft-gray/50"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-obsidian transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
