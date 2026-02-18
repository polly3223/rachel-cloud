/**
 * Rachel Cloud Container Orchestrator API
 *
 * Internal HTTP API for managing Docker containers.
 * Called by the SvelteKit control plane on localhost.
 *
 * Usage: ORCHESTRATOR_API_KEY=xxx bun run src/orchestrator/server.ts
 * Port: 9998 (configurable via ORCHESTRATOR_PORT)
 * Binds: 127.0.0.1 only (not accessible from outside)
 */

import { config, log } from "./config";
import { docker } from "./docker-client";
import {
  provisionContainer,
  deprovisionContainer,
  restartContainer,
  getContainerStatus,
  listAllContainers,
  updateContainer,
  updateAllContainers,
} from "./container-manager";
import {
  startHealthMonitor,
  stopHealthMonitor,
  runHealthSweep,
} from "./health-monitor";
import type { UserContainerEnv } from "./types";

// ---------- Auth ----------

const API_KEY = process.env.ORCHESTRATOR_API_KEY;
if (!API_KEY) {
  console.error(
    "FATAL: ORCHESTRATOR_API_KEY environment variable is required",
  );
  process.exit(1);
}

function checkAuth(req: Request): boolean {
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, "");
  return token === API_KEY;
}

function unauthorizedResponse(): Response {
  return jsonResponse(
    { status: "error", message: "Unauthorized" },
    401,
  );
}

// ---------- Response helpers ----------

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ---------- Route helpers ----------

function extractUserId(url: URL): string | null {
  // Match /containers/:userId or /containers/:userId/action
  const match = url.pathname.match(
    /^\/containers\/([^/]+)(?:\/.*)?$/,
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// ---------- Route handlers ----------

async function handleProvision(req: Request): Promise<Response> {
  const body = (await req.json()) as {
    userId: string;
    telegramBotToken: string;
    ownerTelegramUserId: string;
    groqApiKey?: string;
  };

  if (!body.userId || !body.telegramBotToken || !body.ownerTelegramUserId) {
    return jsonResponse(
      {
        status: "error",
        message:
          "Missing required fields: userId, telegramBotToken, ownerTelegramUserId",
      },
      400,
    );
  }

  const env: UserContainerEnv = {
    telegramBotToken: body.telegramBotToken,
    ownerTelegramUserId: body.ownerTelegramUserId,
    groqApiKey: body.groqApiKey,
  };

  const container = await provisionContainer(body.userId, env);
  return jsonResponse({ status: "ok", container }, 201);
}

async function handleDeprovision(url: URL): Promise<Response> {
  const userId = extractUserId(url);
  if (!userId) return jsonResponse({ status: "error", message: "Missing userId" }, 400);

  const removeData =
    url.searchParams.get("removeData") === "true";
  await deprovisionContainer(userId, removeData);
  return jsonResponse({ status: "ok" });
}

async function handleRestart(url: URL): Promise<Response> {
  const userId = extractUserId(url);
  if (!userId) return jsonResponse({ status: "error", message: "Missing userId" }, 400);

  const container = await restartContainer(userId);
  return jsonResponse({ status: "ok", container });
}

async function handleGetStatus(url: URL): Promise<Response> {
  const userId = extractUserId(url);
  if (!userId) return jsonResponse({ status: "error", message: "Missing userId" }, 400);

  const container = await getContainerStatus(userId);
  if (!container)
    return jsonResponse(
      { status: "error", message: "Container not found" },
      404,
    );

  return jsonResponse({ status: "ok", container });
}

async function handleGetLogs(url: URL): Promise<Response> {
  const userId = extractUserId(url);
  if (!userId) return jsonResponse({ status: "error", message: "Missing userId" }, 400);

  const tail = parseInt(url.searchParams.get("tail") || "100", 10);
  const since = url.searchParams.get("since")
    ? parseInt(url.searchParams.get("since")!, 10)
    : undefined;

  const containerName = `rachel-user-${userId}`;
  const logs = await docker.getContainerLogs(containerName, { tail, since });
  return jsonResponse({ status: "ok", logs });
}

async function handleList(): Promise<Response> {
  const containers = await listAllContainers();
  return jsonResponse({ status: "ok", containers });
}

async function handleUpdateOne(
  req: Request,
  url: URL,
): Promise<Response> {
  const userId = extractUserId(url);
  if (!userId) return jsonResponse({ status: "error", message: "Missing userId" }, 400);

  let image: string | undefined;
  try {
    const body = await req.json();
    image = body?.image;
  } catch {
    // No body is fine — use default image
  }

  const result = await updateContainer(userId, image);
  return jsonResponse({ status: "ok", result });
}

async function handleUpdateAll(req: Request): Promise<Response> {
  let image: string | undefined;
  try {
    const body = await req.json();
    image = body?.image;
  } catch {
    // No body is fine
  }

  const result = await updateAllContainers(image);
  return jsonResponse({ status: "ok", result });
}

async function handleSweep(): Promise<Response> {
  const result = await runHealthSweep();
  return jsonResponse({ status: "ok", result });
}

async function handleHealth(): Promise<Response> {
  const dockerOk = await docker.ping();
  let containerCount = 0;
  try {
    const containers = await listAllContainers();
    containerCount = containers.length;
  } catch {
    // ignore
  }

  return jsonResponse({
    status: dockerOk ? "ok" : "degraded",
    uptime: process.uptime(),
    docker: dockerOk,
    containers: containerCount,
  });
}

// ---------- Server ----------

const server = Bun.serve({
  port: config.port,
  hostname: "0.0.0.0", // accessible from containers via host.docker.internal

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const startTime = Date.now();

    // Health — no auth required
    if (method === "GET" && path === "/health") {
      return handleHealth();
    }

    // All other routes require auth
    if (!checkAuth(req)) {
      return unauthorizedResponse();
    }

    try {
      // POST /containers — provision
      if (method === "POST" && path === "/containers") {
        return await handleProvision(req);
      }

      // GET /containers — list all
      if (method === "GET" && path === "/containers") {
        return await handleList();
      }

      // GET /containers/:userId/logs — container logs
      if (
        method === "GET" &&
        path.match(/^\/containers\/[^/]+\/logs$/)
      ) {
        return await handleGetLogs(url);
      }

      // GET /containers/:userId — single status
      if (
        method === "GET" &&
        path.match(/^\/containers\/[^/]+$/)
      ) {
        return await handleGetStatus(url);
      }

      // DELETE /containers/:userId — deprovision
      if (
        method === "DELETE" &&
        path.match(/^\/containers\/[^/]+$/)
      ) {
        return await handleDeprovision(url);
      }

      // POST /containers/:userId/restart
      if (
        method === "POST" &&
        path.match(/^\/containers\/[^/]+\/restart$/)
      ) {
        return await handleRestart(url);
      }

      // POST /containers/:userId/update
      if (
        method === "POST" &&
        path.match(/^\/containers\/[^/]+\/update$/)
      ) {
        return await handleUpdateOne(req, url);
      }

      // POST /update-all
      if (method === "POST" && path === "/update-all") {
        return await handleUpdateAll(req);
      }

      // POST /sweep — manual health sweep
      if (method === "POST" && path === "/sweep") {
        return await handleSweep();
      }

      return jsonResponse(
        { status: "error", message: "Not found" },
        404,
      );
    } catch (err) {
      log.error("Request error", {
        method,
        path,
        error: String(err),
        durationMs: Date.now() - startTime,
      });
      return jsonResponse(
        { status: "error", message: String(err) },
        500,
      );
    }
  },
});

// Start health monitor
startHealthMonitor((result) => {
  // Future: update database, send notifications
  if (result.restarted.length > 0 || result.errors.length > 0) {
    log.info("Health sweep event", {
      restarted: result.restarted,
      circuitOpen: result.circuitOpen,
      errors: result.errors.length,
    });
  }
});

log.info("Orchestrator started", {
  port: config.port,
  hostname: "0.0.0.0",
  image: config.imageName,
  network: config.networkName,
});

// ---------- Graceful shutdown ----------

function shutdown() {
  log.info("Shutting down orchestrator...");
  stopHealthMonitor();
  server.stop();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
