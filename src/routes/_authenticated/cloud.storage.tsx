/** /cloud/storage — v5.0 Cloud Storage. */
import { createFileRoute } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import { ModulePlaceholder } from "@/components/happyx/ModulePlaceholder";

export const Route = createFileRoute("/_authenticated/cloud/storage")({
  head: () => ({ meta: [{ title: "Cloud Storage — HAPPY v5.0" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Global Cloud Platform · v5.0"
      title="Cloud Storage"
      description="Multi-region object storage, buckets, lifecycle rules, replication, backup and restore across the HAPPY cloud footprint."
      icon={HardDrive}
      features={[
        "Buckets",
        "Objects",
        "Lifecycle Rules",
        "Replication",
        "Backup",
        "Restore",
        "Access Policies",
        "Usage Analytics",
      ]}
    />
  ),
});
