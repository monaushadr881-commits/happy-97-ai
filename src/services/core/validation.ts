/**
 * HAPPY X — Service Layer: Validation
 *
 * Centralized Zod-based validation for inputs, outputs, permissions, and
 * business rules. All services validate at their public boundary.
 */

import { z, type ZodTypeAny, type infer as ZodInfer } from "zod";
import { AppError } from "./errors";

export function validate<T extends ZodTypeAny>(schema: T, input: unknown): ZodInfer<T> {
  const r = schema.safeParse(input);
  if (!r.success) {
    throw new AppError("VALIDATION.FAILED", {
      message: r.error.issues[0]?.message ?? "Invalid input",
      meta: { issues: r.error.issues },
    });
  }
  return r.data;
}

/** Common reusable primitives. */
export const V = {
  uuid: z.string().uuid(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  shortText: z.string().min(1).max(200),
  longText: z.string().min(1).max(8000),
  email: z.string().email().max(255),
  cursor: z.string().min(1).max(200).optional(),
  page: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
  }),
};

export { z };
