import { expect, test } from "bun:test";
import { premRuntimeEnv } from "./runtime-env";

test("migrates old and new containers while preserving rollback secrets, voice and routing", () => {
  const old = ["GEMINI_API_KEY=old", "GEMINI_MODEL=old-model", "ZAI_API_KEY=unused", "GROQ_API_KEY=voice", "RACHEL_CLOUD=true", "TELEGRAM_BOT_TOKEN=bot", "WEBHOOK_PORT=8443", "CUSTOM=a=b"];
  const before = [...old];
  const config = { premApiKey: "prem-test", premModel: "deepseek-v4.1-flash", groqApiKey: "" };
  const next = premRuntimeEnv(old, config);
  expect(old).toEqual(before);
  expect(next.some((item) => /^(GEMINI|ZAI)/.test(item))).toBe(false);
  for (const item of ["GROQ_API_KEY=voice", "RACHEL_CLOUD=true", "TELEGRAM_BOT_TOKEN=bot", "WEBHOOK_PORT=8443", "CUSTOM=a=b", "PREM_API_KEY=prem-test", "PREM_MODEL=deepseek-v4.1-flash", "STT_PROVIDER=groq"]) expect(next).toContain(item);
  expect(premRuntimeEnv(next, config)).toEqual(next);
  expect(premRuntimeEnv([], config)).toContain("PREM_API_KEY=prem-test");
});

test("requires Prem credentials before changing a running container", () => {
  expect(() => premRuntimeEnv([], { premApiKey: "", premModel: "deepseek-v4.1-flash", groqApiKey: "" })).toThrow("PREM_API_KEY");
});

test("refreshes configured credentials without duplicates", () => {
  expect(premRuntimeEnv(["PREM_API_KEY=old", "PREM_MODEL=old", "GROQ_API_KEY=old"], { premApiKey: "new", premModel: "default", groqApiKey: "new-voice" }, "override")).toEqual(["PREM_API_KEY=new", "PREM_MODEL=override", "GROQ_API_KEY=new-voice", "STT_PROVIDER=groq"]);
});
