import { createServerFn } from "@tanstack/react-start";
import { contextFor, summarize } from "./workspace-intelligence";

export const readWorkspace = createServerFn({ method: "POST" })
  .inputValidator((data: { route: string; hasForm?: boolean; hasError?: boolean; hasBuilder?: boolean }) => data)
  .handler(async ({ data }) => {
    const ctx = contextFor(data.route, data);
    return { ctx, summary: summarize(ctx) };
  });
