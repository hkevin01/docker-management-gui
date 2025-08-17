// Docker API Types
export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: DockerPort[];
  Labels: Record<string, string>;
  State: string;
  Status: string;
  HostConfig: {
    NetworkMode: string;
  };
  NetworkSettings: {
    Networks: Record<string, DockerNetwork>;
  };
  Mounts: DockerMount[];
}

export interface DockerImage {
  Id: string;
  ParentId: string;
  RepoTags: string[] | null;
  RepoDigests: string[] | null;
  Created: number;
  Size: number;
  VirtualSize: number;
  SharedSize: number;
  Labels: Record<string, string> | null;
  Containers: number;
}

export interface DockerVolume {
  CreatedAt: string;
  Driver: string;
  Labels: Record<string, string> | null;
  Mountpoint: string;
  Name: string;
  Options: Record<string, string> | null;
  Scope: string;
  Status?: Record<string, any>;
  UsageData?: {
    Size: number;
    RefCount: number;
  };
}

export interface DockerNetwork {
  Id: string;
  Name: string;
  Created: string;
  Scope: string;
  Driver: string;
  EnableIPv6: boolean;
  IPAM: {
    Driver: string;
    Options: Record<string, string> | null;
    Config: Array<{
      Subnet?: string;
      Gateway?: string;
    }>;
  };
  Internal: boolean;
  Attachable: boolean;
  Ingress: boolean;
  ConfigFrom: {
    Network: string;
  };
  ConfigOnly: boolean;
  Containers: Record<string, {
    Name: string;
    EndpointID: string;
    MacAddress: string;
    IPv4Address: string;
    IPv6Address: string;
  }>;
  Options: Record<string, string>;
  Labels: Record<string, string>;
}

export interface DockerPort {
  IP?: string;
  PrivatePort: number;
  PublicPort?: number;
  Type: string;
}

export interface DockerMount {
  Type: string;
  Name?: string;
  Source: string;
  Destination: string;
  Driver?: string;
  Mode: string;
  RW: boolean;
  Propagation: string;
}

export interface DockerSystemInfo {
  ID: string;
  Containers: number;
  ContainersRunning: number;
  ContainersPaused: number;
  ContainersStopped: number;
  Images: number;
  Driver: string;
  DriverStatus: Array<[string, string]>;
  SystemStatus: Array<[string, string]> | null;
  Plugins: {
    Volume: string[];
    Network: string[];
    Authorization: string[] | null;
    Log: string[];
  };
  MemoryLimit: boolean;
  SwapLimit: boolean;
  KernelMemory: boolean;
  CpuCfsPeriod: boolean;
  CpuCfsQuota: boolean;
  CPUShares: boolean;
  CPUSet: boolean;
  PidsLimit: boolean;
  IPv4Forwarding: boolean;
  BridgeNfIptables: boolean;
  BridgeNfIp6tables: boolean;
  Debug: boolean;
  NFd: number;
  OomKillDisable: boolean;
  NGoroutines: number;
  SystemTime: string;
  LoggingDriver: string;
  CgroupDriver: string;
  NEventsListener: number;
  KernelVersion: string;
  OperatingSystem: string;
  OSType: string;
  Architecture: string;
  IndexServerAddress: string;
  RegistryConfig: {
    AllowNondistributableArtifactsCIDRs: string[];
    AllowNondistributableArtifactsHostnames: string[];
    InsecureRegistryCIDRs: string[];
    IndexConfigs: Record<string, any>;
    Mirrors: string[];
  };
  NCPU: number;
  MemTotal: number;
  GenericResources: Array<{
    NamedResourceSpec?: {
      Kind: string;
      Value: string;
    };
    DiscreteResourceSpec?: {
      Kind: string;
      Value: number;
    };
  }> | null;
  DockerRootDir: string;
  HttpProxy: string;
  HttpsProxy: string;
  NoProxy: string;
  Name: string;
  Labels: string[];
  ExperimentalBuild: boolean;
  ServerVersion: string;
  ClusterStore: string;
  ClusterAdvertise: string;
  Runtimes: Record<string, {
    path: string;
  }>;
  DefaultRuntime: string;
  Swarm: {
    NodeID: string;
    NodeAddr: string;
    LocalNodeState: string;
    ControlAvailable: boolean;
    Error: string;
    RemoteManagers: Array<{
      NodeID: string;
      Addr: string;
    }> | null;
  };
  LiveRestoreEnabled: boolean;
  Isolation: string;
  InitBinary: string;
  ContainerdCommit: {
    ID: string;
    Expected: string;
  };
  RuncCommit: {
    ID: string;
    Expected: string;
  };
  InitCommit: {
    ID: string;
    Expected: string;
  };
  SecurityOptions: string[];
}

export interface DockerSystemDf {
  LayersSize: number;
  Images: Array<{
    Id: string;
    ParentId: string;
    RepoTags: string[];
    RepoDigests: string[];
    Created: number;
    Size: number;
    SharedSize: number;
    VirtualSize: number;
    Labels: Record<string, string>;
    Containers: number;
  }>;
  Containers: Array<{
    Id: string;
    Names: string[];
    Image: string;
    ImageID: string;
    Command: string;
    Created: number;
    SizeRw: number;
    SizeRootFs: number;
    Labels: Record<string, string>;
    State: string;
    Status: string;
    HostConfig: {
      NetworkMode: string;
    };
    NetworkSettings: {
      Networks: Record<string, DockerNetwork>;
    };
    Mounts: DockerMount[];
  }>;
  Volumes: Array<{
    Name: string;
    Driver: string;
    Mountpoint: string;
    CreatedAt: string;
    Status: Record<string, any>;
    Labels: Record<string, string>;
    Scope: string;
    Options: Record<string, string>;
    UsageData: {
      Size: number;
      RefCount: number;
    };
  }>;
  BuildCache: Array<{
    ID: string;
    Parent: string;
    Type: string;
    Description: string;
    InUse: boolean;
    Shared: boolean;
    Size: number;
    CreatedAt: string;
    LastUsedAt: string;
    UsageCount: number;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Container Actions
export interface ContainerAction {
  type: 'start' | 'stop' | 'restart' | 'kill' | 'pause' | 'unpause' | 'remove';
  containerId: string;
  force?: boolean;
}

export interface ContainerExecOptions {
  containerId: string;
  cmd: string[];
  tty?: boolean;
  stdin?: boolean;
  stdout?: boolean;
  stderr?: boolean;
  privileged?: boolean;
  user?: string;
  workingDir?: string;
  env?: string[];
}

export interface ContainerLogsOptions {
  containerId: string;
  follow?: boolean;
  stdout?: boolean;
  stderr?: boolean;
  since?: number;
  until?: number;
  timestamps?: boolean;
  tail?: string | number;
}

// Image Actions
export interface ImagePullOptions {
  tag: string;
  authconfig?: {
    username?: string;
    password?: string;
    email?: string;
    serveraddress?: string;
  };
}

export interface ImageBuildOptions {
  dockerfile?: string;
  t?: string[];
  extrahosts?: string;
  remote?: string;
  q?: boolean;
  nocache?: boolean;
  cachefrom?: string[];
  pull?: boolean;
  rm?: boolean;
  forcerm?: boolean;
  memory?: number;
  memswap?: number;
  cpushares?: number;
  cpusetcpus?: string;
  cpuperiod?: number;
  cpuquota?: number;
  buildargs?: Record<string, string>;
  shmsize?: number;
  squash?: boolean;
  labels?: Record<string, string>;
  networkmode?: string;
  platform?: string;
  target?: string;
  outputs?: string;
}

// Prune Options
export interface PruneOptions {
  filters?: Record<string, string[]>;
}

export interface PruneResult {
  containersDeleted?: string[];
  imagesDeleted?: Array<{
    Deleted?: string;
    Untagged?: string;
  }>;
  volumesDeleted?: string[];
  networksDeleted?: string[];
  spaceReclaimed?: number;
}

// Settings
export interface AppSettings {
  dockerSocketPath: string;
  dockerHost?: string;
  dockerTlsVerify?: boolean;
  dockerCertPath?: string;
  refreshInterval: number;
  theme: 'light' | 'dark' | 'system';
  confirmDestructiveActions: boolean;
  autoRefresh: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Convenience aliases used by the web app
export type SystemInfo = DockerSystemInfo;
export type DiskUsage = DockerSystemDf;
export type ContainerSummary = DockerContainer;
export type ImageSummary = DockerImage;
export type VolumeSummary = DockerVolume;
export type NetworkSummary = DockerNetwork;

// Health endpoint response (unwrapped)
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error' | string;
  timestamp: string;
  uptime: number;
  docker: boolean;
}
