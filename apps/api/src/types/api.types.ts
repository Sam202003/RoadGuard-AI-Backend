import type { ApiConfig } from '../config/index.js';
import type { Env } from '@roadguard/config';

export interface AppLocals {
  env: Env;
  apiConfig: ApiConfig;
  startedAt: number;
}

export interface InfrastructureStatus {
  mongodb: { connected: boolean; state: string };
  redis: { connected: boolean; state: string };
}

export interface HealthCheckData {
  uptime: number;
  environment: string;
  timestamp: string;
  infrastructure: InfrastructureStatus;
}
