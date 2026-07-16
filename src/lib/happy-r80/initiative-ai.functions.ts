import { createServerFn } from "@tanstack/react-start";
import { pickInitiative, type InitiativeInput } from "./initiative-ai";

export const pickInitiativeSuggestion = createServerFn({ method: "POST" })
  .inputValidator((data: InitiativeInput) => data)
  .handler(async ({ data }) => pickInitiative(data));
