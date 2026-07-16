import { createServerFn } from "@tanstack/react-start";
import { composeCompanion, type CompanionInput } from "./living-companion";

export const composeCompanionState = createServerFn({ method: "POST" })
  .inputValidator((data: CompanionInput) => data)
  .handler(async ({ data }) => composeCompanion(data));
