import { createServerFn } from "@tanstack/react-start";
import { continue_ as continueConversation, type ContinuityInput } from "./conversation-continuity";

export const resumeConversation = createServerFn({ method: "POST" })
  .inputValidator((data: ContinuityInput) => data)
  .handler(async ({ data }) => continueConversation(data));
