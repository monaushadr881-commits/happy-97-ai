// Shared JSON contract used across R45–R50 runtimes.
export type JsonValue =
  | string | number | boolean | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Fact {
  source_runtime: string;
  timestamp: string;
  evidence: JsonValue;
  confidence: number;
}

export interface Recommendation {
  reason: string;
  confidence: number;
  supporting_evidence: JsonValue[];
  source_runtime: string;
  timestamp: string;
}

export const jsonValueSchema = () => {
  // Deferred import so this stays a pure runtime helper.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { z } = require('zod') as typeof import('zod');
  const schema: import('zod').ZodType<JsonValue> = z.lazy(() =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(schema),
      z.record(z.string(), schema),
    ]),
  );
  return schema;
};
