/**
 * Container Orchestrator — Type Definitions
 *
 * Docker Engine API types (subset) and internal orchestrator types.
 */

// ========== Docker API Response Types ==========

export interface DockerContainerListItem {
  Id: string;
  Names: string[];
  Image: string;
  State: string; // "running", "exited", "created", "restarting", "paused", "dead"
  Status: string; // human-readable like "Up 3 hours (healthy)"
  Created: number; // unix timestamp
}

export interface DockerContainerInspect {
  Id: string;
  Name: string;
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    StartedAt: string;
    FinishedAt: string;
    Health?: {
      Status: "starting" | "healthy" | "unhealthy" | "none";
      FailingStreak: number;
      Log: Array<{
        Start: string;
        End: string;
        ExitCode: number;
        Output: string;
      }>;
    };
  };
  Config: {
    Image: string;
    Env: string[];
  };
  HostConfig?: {
    NetworkMode?: string;
  };
}

export interface DockerCreateResponse {
  Id: string;
  Warnings: string[];
}

export interface DockerNetworkInspect {
  Id: string;
  Name: string;
  Driver: string;
}

export interface DockerVolumeInspect {
  Name: string;
  Driver: string;
  Mountpoint: string;
  CreatedAt: string;
}

// ========== Docker API Request Types ==========

export interface DockerCreateContainerBody {
  Image: string;
  Env: string[];
  User: string;
  HostConfig: {
    Memory: number;
    MemorySwap: number;
    NanoCpus: number;
    PidsLimit: number;
    Binds: string[];
    Tmpfs: Record<string, string>;
    NetworkMode: string;
    ExtraHosts?: string[];
    RestartPolicy: { Name: string; MaximumRetryCount?: number };
    CapDrop: string[];
    SecurityOpt: string[];
    ReadonlyRootfs: boolean;
    LogConfig?: {
      Type: string;
      Config: Record<string, string>;
    };
  };
}

// ========== Internal Types ==========

export interface UserContainerEnv {
  telegramBotToken: string;
  ownerTelegramUserId: string;
  zaiApiKey?: string;
  groqApiKey?: string;
  sttProvider?: string;
  logLevel?: string;
}

export interface ContainerStatus {
  userId: string;
  containerId: string;
  containerName: string;
  image: string;
  state: string; // running, exited, created, etc.
  health: string; // healthy, unhealthy, starting, none
  startedAt: string;
  uptime: number; // seconds
}

export interface UpdateResult {
  userId: string;
  success: boolean;
  previousImage: string;
  newImage: string;
  durationMs: number;
  error?: string;
  rolledBack?: boolean;
}

export type UpdateProgressCallback = (progress: {
  total: number;
  completed: number;
  current: string;
  results: UpdateResult[];
}) => void;

export interface UpdateAllResult {
  total: number;
  succeeded: number;
  failed: number;
  rolledBack: number;
  skipped: number;
  results: UpdateResult[];
  durationMs: number;
}

export type ContainerAction =
  | "provision"
  | "deprovision"
  | "restart"
  | "update"
  | "stop"
  | "start";
