/** Migrate runtime credentials without modifying the original rollback environment. */
export function premRuntimeEnv(existing: string[], config: { premApiKey: string; premModel: string; groqApiKey: string }, model = config.premModel): string[] {
  if (!config.premApiKey) throw new Error("PREM_API_KEY is required before provisioning or updating Rachel Cloud");
  const env = new Map(existing.map((item) => [item.slice(0, item.indexOf("=")), item.slice(item.indexOf("=") + 1)]));
  for (const key of ["GEMINI_API_KEY", "GEMINI_MODEL", "ZAI_API_KEY"]) env.delete(key);
  env.set("PREM_API_KEY", config.premApiKey);
  env.set("PREM_MODEL", model);
  env.set("STT_PROVIDER", "groq");
  if (config.groqApiKey) env.set("GROQ_API_KEY", config.groqApiKey);
  return [...env].map(([key, value]) => `${key}=${value}`);
}
