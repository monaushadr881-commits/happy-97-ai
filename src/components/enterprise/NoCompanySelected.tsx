/**
 * Empty-state block used when no company is selected or the caller has none.
 */
import { EmptyState } from "@/design-system/primitives";
import { Building2 } from "lucide-react";

export function NoCompanySelected({ hasAny }: { hasAny: boolean }) {
  return (
    <EmptyState
      icon={<Building2 className="h-5 w-5" />}
      title={hasAny ? "Select a company" : "No companies available"}
      description={
        hasAny
          ? "Choose a company from the selector to open its Control Center."
          : "Ask the Founder to grant you access to a company workspace."
      }
    />
  );
}
