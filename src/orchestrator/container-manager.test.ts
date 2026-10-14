import { beforeEach, expect, mock, test } from "bun:test";
const oldEnv = ["GEMINI_API_KEY=old-secret", "GEMINI_MODEL=old", "GROQ_API_KEY=voice", "TELEGRAM_BOT_TOKEN=bot", "RACHEL_CLOUD=true"];
const created: Array<{ Image: string; Env: string[] }> = [];
let failNew = false;
mock.module("./config", () => ({
  config: { containerPrefix: "test-", volumePrefix: "test-", imageName: "new", networkName: "test", premApiKey: "prem-test", premModel: "deepseek-v4.1-flash", groqApiKey: "", defaults: { memoryBytes: 1, memorySwapBytes: 2, nanoCpus: 1, pidsLimit: 10 } },
  log: { debug() {}, info() {}, warn() {}, error() {} },
}));
mock.module("./docker-client", () => ({
  DockerApiError: class extends Error {},
  docker: {
    inspectContainer: async () => ({ Config: { Image: "old", Env: oldEnv }, State: { Running: true, Health: { Status: "healthy" } } }),
    stopContainer: async () => {}, removeContainer: async () => {},
    createContainer: async (_name: string, config: { Image: string; Env: string[] }) => { created.push(config); if (failNew && config.Image === "new") throw new Error("synthetic create failure"); },
    startContainer: async () => {},
  },
}));
const { updateContainer } = await import("./container-manager");
beforeEach(() => { created.length = 0; failNew = false; });
test("updates through the lifecycle with Prem and retains routing", async () => {
  const result = await updateContainer("fixture", "new");
  expect(result.success).toBe(true);
  expect(created[0]?.Env).toContain("PREM_API_KEY=prem-test");
  expect(created[0]?.Env).toContain("RACHEL_CLOUD=true");
  expect(created[0]?.Env.some((entry) => entry.startsWith("GEMINI"))).toBe(false);
});
test("a failed replacement rolls back with the original provider credentials", async () => {
  failNew = true;
  const result = await updateContainer("fixture", "new");
  expect(result.success).toBe(false);
  expect(result.rolledBack).toBe(true);
  expect(created[1]?.Image).toBe("old");
  expect(created[1]?.Env).toEqual(oldEnv);
  expect(created[1]?.Env).toContain("GEMINI_API_KEY=old-secret");
});
