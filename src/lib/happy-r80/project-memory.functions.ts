import { createServerFn } from "@tanstack/react-start";
import { recentProjects, resumeSuggestion, type MemoryRecallInput } from "./project-memory";

export const recallProjects = createServerFn({ method: "POST" })
  .inputValidator((data: MemoryRecallInput) => data)
  .handler(async ({ data }) => ({
    recent: recentProjects(data),
    resume: resumeSuggestion(data),
  }));
