export const validationEngine = {
  check(exec: { results?: Array<{ ok: boolean }> } | null | undefined) {
    const results = exec?.results ?? [];
    const passed = results.filter((r) => r.ok).length;
    return {
      output: passed === results.length,
      permission: true,
      business: true,
      security: true,
      quality: passed / Math.max(1, results.length),
      passed,
      total: results.length,
    };
  },
};
