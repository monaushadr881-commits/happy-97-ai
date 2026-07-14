import { Panel } from "@/design-system/primitives";

export function NoCompany({ hasAny }: { hasAny: boolean }) {
  return (
    <Panel className="p-6 text-sm text-soft-gray">
      {hasAny
        ? "Select a company from the switcher above to load the Business OS."
        : "No companies are provisioned for your account yet. Create one in the Enterprise Control Center first."}
    </Panel>
  );
}
