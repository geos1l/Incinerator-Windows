import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PostHog } from 'posthog-node';

const POSTHOG_KEY = 'phc_REPLACE_WITH_YOUR_KEY';
const POSTHOG_HOST = 'https://us.i.posthog.com';

const CONFIG_DIR = app.getPath('userData');
const DEVICE_ID_PATH = path.join(CONFIG_DIR, 'device-id.json');
const TELEMETRY_CONFIG_PATH = path.join(CONFIG_DIR, 'incinerator-config.json');

let client: PostHog | null = null;
let deviceId: string = '';
let sessionStart: number = Date.now();

function loadConfig(): Record<string, any> {
  try {
    if (fs.existsSync(TELEMETRY_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(TELEMETRY_CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

function isOptedOut(): boolean {
  const config = loadConfig();
  return config.telemetryOptOut === true;
}

function getOrCreateDeviceId(): string {
  try {
    if (fs.existsSync(DEVICE_ID_PATH)) {
      const data = JSON.parse(fs.readFileSync(DEVICE_ID_PATH, 'utf-8'));
      if (data.id) return data.id;
    }
  } catch { /* ignore */ }

  const id = crypto.randomUUID();
  try {
    fs.writeFileSync(DEVICE_ID_PATH, JSON.stringify({ id, createdAt: new Date().toISOString() }));
  } catch { /* ignore */ }
  return id;
}

function isFirstLaunch(): boolean {
  try {
    if (fs.existsSync(DEVICE_ID_PATH)) {
      return false;
    }
  } catch { /* ignore */ }
  return true;
}

export function initTelemetry(): void {
  if (isOptedOut()) return;

  const firstLaunch = isFirstLaunch();
  deviceId = getOrCreateDeviceId();
  sessionStart = Date.now();

  try {
    client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, flushAt: 5, flushInterval: 30000 });
  } catch {
    client = null;
    return;
  }

  if (firstLaunch) {
    capture('app_installed', {
      platform: process.platform,
      arch: process.arch,
      electron_version: process.versions.electron,
      app_version: app.getVersion(),
    });
  }

  capture('app_opened', {
    platform: process.platform,
    app_version: app.getVersion(),
  });
}

export function capture(event: string, properties?: Record<string, any>): void {
  if (!client || isOptedOut()) return;
  try {
    client.capture({
      distinctId: deviceId,
      event,
      properties: { ...properties },
    });
  } catch { /* silently fail */ }
}

export function trackFileAction(action: 'scheduled' | 'incinerated', count: number): void {
  if (count <= 0) return;
  capture(`files_${action}`, { count });
}

export function shutdownTelemetry(): void {
  if (!client) return;

  const durationSeconds = Math.round((Date.now() - sessionStart) / 1000);
  capture('session_ended', { duration_seconds: durationSeconds });

  try {
    client.shutdown();
  } catch { /* ignore */ }
  client = null;
}
