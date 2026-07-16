import { createServerFn } from "@tanstack/react-start";
import { advise, type BusinessMetrics } from "./business-advisor";

export const adviseBusiness = createServerFn({ method: "POST" })
  .inputValidator((data: BusinessMetrics) => data)
  .handler(async ({ data }) => advise(data));
