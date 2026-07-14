import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — HAPPY X" },
      { name: "description", content: "Set a new password for your HAPPY account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session automatically via the URL fragment.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-gold/20 bg-obsidian/70 p-8 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
          <ShieldCheck className="h-3 w-3" /> Secure Reset
        </div>
        <h1 className="mt-3 text-2xl font-black tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm text-soft-gray">
          Use at least 8 characters. We recommend a mix of upper, lower, digits, and symbols.
        </p>

        {!ready ? (
          <div className="mt-6 rounded-2xl border border-gold/20 bg-obsidian/40 p-4 text-sm text-soft-gray">
            Validating recovery link… If this stays here, request a new link from the Forgot Password page.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="New password" value={password} onChange={setPassword} />
            <Field label="Confirm password" value={confirm} onChange={setConfirm} />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-obsidian transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-soft-gray">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-gold/25 bg-obsidian/60 px-3">
        <KeyRound className="h-4 w-4 text-gold" />
        <input
          type="password"
          required
          minLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-2.5 text-sm text-paper outline-none placeholder:text-soft-gray/50"
          autoComplete="new-password"
        />
      </div>
    </label>
  );
}
