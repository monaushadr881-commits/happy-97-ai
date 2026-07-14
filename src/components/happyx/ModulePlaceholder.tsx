import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  features,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}) {
  return (
    <div className="p-6 lg:p-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs text-soft-gray hover:text-paper transition-colors mb-8"
      >
        <ArrowLeft className="h-3 w-3" /> Back to dashboard
      </Link>

      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="font-display text-3xl lg:text-4xl tracking-tight">{title}</h1>
          </div>
        </div>
        <p className="text-sm text-soft-gray leading-relaxed max-w-2xl">{description}</p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <div
              key={f}
              className="rounded-xl border border-white/5 bg-charcoal p-4 text-sm text-paper/90"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold mb-2" />
              {f}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent p-8">
          <p className="eyebrow mb-2">In active development</p>
          <h3 className="font-display text-xl tracking-tight">
            This module is scheduled for the next production cycle.
          </h3>
          <p className="mt-2 text-sm text-soft-gray max-w-xl">
            The HAPPY Kernel, design system, authentication, and AI Assistant are live. Each module
            unfolds with the same enterprise depth.
          </p>
        </div>
      </div>
    </div>
  );
}
