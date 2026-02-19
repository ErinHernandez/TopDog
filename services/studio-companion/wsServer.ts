/**
 * TopDog Studio Companion — WebSocket Server
 *
 * Lightweight WebSocket server that bridges the Studio web app to local
 * Xcode Simulators and Android Emulators. Runs as a standalone Node.js
 * process on the developer's machine.
 *
 * Protocol: JSON messages over WebSocket (port 9827 by default).
 *
 * Inbound messages (from browser):
 *   { type: "ping" }                                      → health check
 *   { type: "list-devices" }                              → enumerate simulators/emulators
 *   { type: "capture", deviceId: string, platform: string } → capture screenshot
 *
 * Outbound messages (to browser):
 *   { type: "pong" }
 *   { type: "devices", devices: [...] }
 *   { type: "frame", frame: { imageData, width, height, ... } }
 *   { type: "error", message: string }
 *
 * @module services/studio-companion/wsServer
 */

import { WebSocketServer, WebSocket } from 'ws';

import { discoverDevices } from './deviceDiscovery';
import { captureEmulator } from './emulatorCapture';
import { captureSimulator } from './simulatorCapture';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES (mirror the protocol types from lib/studio/core/rendering.ts)
// ─────────────────────────────────────────────────────────────────────────────

interface ClientMessage {
  readonly type: 'ping' | 'list-devices' | 'capture' | 'inject-code' | 'hot-reload' | 'set-props' | 'get-build-status';
  readonly deviceId?: string;
  readonly platform?: 'ios' | 'android';
  readonly componentId?: string;
  readonly languageId?: string;
  readonly code?: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly stateKey?: string;
}

interface ServerMessage {
  readonly type: 'pong' | 'devices' | 'frame' | 'error' | 'build-started' | 'build-complete' | 'build-error';
  readonly devices?: readonly DeviceInfo[];
  readonly frame?: FrameData;
  readonly message?: string;
  readonly componentId?: string;
  readonly languageId?: string;
  readonly duration?: number;
  readonly errors?: readonly { file: string; line: number; column: number; message: string; severity: string }[];
}

interface DeviceInfo {
  readonly id: string;
  readonly name: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly osVersion: string;
  readonly isRunning: boolean;
}

interface FrameData {
  readonly timestamp: number;
  readonly deviceId: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly renderContext: 'isolated';
  readonly imageData: string; // base64
  readonly width: number;
  readonly height: number;
  readonly languageId: string;
  readonly error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PORT = 9827;
const MAX_MESSAGE_SIZE = 5242880; // 5 MB limit per message (increased for code injection payloads)
const ALLOWED_ORIGINS = ['http://localhost', 'http://localhost:3000', 'http://127.0.0.1', 'http://127.0.0.1:3000'];

export function createCompanionServer(port: number = DEFAULT_PORT): WebSocketServer {
  const wss = new WebSocketServer({ port });

  const log = (msg: string) => {
    const ts = new Date().toISOString().slice(11, 23);
     
    console.info(`[companion ${ts}] ${msg}`);
  };

  wss.on('listening', () => {
    log(`Companion service listening on ws://localhost:${port}`);
    log('Waiting for Studio to connect...');
  });

  wss.on('connection', (ws: WebSocket, req: any) => {
    // Validate origin to prevent unauthorized cross-origin connections
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed =>
      origin.startsWith(allowed)
    );

    if (!isAllowedOrigin) {
      log(`Rejected connection from unauthorized origin: ${origin}`);
      ws.close(1008, 'Unauthorized origin');
      return;
    }

    log('Studio connected');

    ws.on('message', async (raw: Buffer) => {
      let msg: ClientMessage;

      // Validate message size before parsing to prevent OOM attacks
      if (raw.length > MAX_MESSAGE_SIZE) {
        log(`Message rejected: size ${raw.length} exceeds limit of ${MAX_MESSAGE_SIZE}`);
        ws.close(1009, 'Message too large');
        return;
      }

      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Parse error';
        log(`Failed to parse message: ${errorMsg}`);
        send(ws, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      try {
        await handleMessage(ws, msg, log);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        log(`Error handling ${msg.type}: ${errorMsg}`);
        send(ws, { type: 'error', message: errorMsg });
      }
    });

    ws.on('close', () => {
      log('Studio disconnected');
    });

    ws.on('error', (err: Error) => {
      log(`WebSocket error: ${err.message}`);
    });
  });

  wss.on('error', (err: Error) => {
    if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
       
      console.error(`\nPort ${port} is already in use.`);
       
      console.error('Another companion instance may be running. Kill it first or use a different port.\n');
      process.exit(1);
    }
     
    console.error('Server error:', err);
  });

  return wss;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

async function handleMessage(
  ws: WebSocket,
  msg: ClientMessage,
  log: (s: string) => void,
): Promise<void> {
  switch (msg.type) {
    case 'ping': {
      send(ws, { type: 'pong' });
      break;
    }

    case 'list-devices': {
      log('Discovering devices...');
      const devices = await discoverDevices();
      log(`Found ${devices.length} device(s)`);
      send(ws, { type: 'devices', devices });
      break;
    }

    case 'capture': {
      if (!msg.deviceId || !msg.platform) {
        send(ws, { type: 'error', message: 'capture requires deviceId and platform' });
        return;
      }

      log(`Capturing ${msg.platform} device: ${msg.deviceId}`);
      const startTime = Date.now();

      let frame: FrameData;

      if (msg.platform === 'ios') {
        frame = await captureSimulator(msg.deviceId);
      } else if (msg.platform === 'android') {
        frame = await captureEmulator(msg.deviceId);
      } else {
        send(ws, { type: 'error', message: `Unsupported platform: ${msg.platform}` });
        return;
      }

      const elapsed = Date.now() - startTime;
      log(`Capture complete in ${elapsed}ms (${frame.width}×${frame.height})`);

      send(ws, { type: 'frame', frame });
      break;
    }

    case 'inject-code': {
      if (!msg.componentId || !msg.languageId || !msg.code) {
        send(ws, { type: 'error', message: 'inject-code requires componentId, languageId, and code' });
        return;
      }

      log(`Code injection requested: ${msg.languageId} component ${msg.componentId}`);
      send(ws, { type: 'build-started', componentId: msg.componentId, languageId: msg.languageId });

      // TODO: Phase 5C — Delegate to codeBuilder module
      // For now, acknowledge but report as not-yet-implemented
      send(ws, {
        type: 'build-error',
        componentId: msg.componentId,
        languageId: msg.languageId,
        errors: [{
          file: 'codeBuilder.ts',
          line: 0,
          column: 0,
          message: 'Code injection not yet implemented. Phase 5C pending.',
          severity: 'error',
        }],
      });
      break;
    }

    case 'hot-reload': {
      if (!msg.componentId || !msg.languageId || !msg.code) {
        send(ws, { type: 'error', message: 'hot-reload requires componentId, languageId, and code' });
        return;
      }

      log(`Hot reload requested: ${msg.languageId} component ${msg.componentId}`);

      // TODO: Phase 5D — Delegate to hot reload module
      send(ws, {
        type: 'build-error',
        componentId: msg.componentId,
        languageId: msg.languageId,
        errors: [{
          file: 'hotReload.ts',
          line: 0,
          column: 0,
          message: 'Hot reload not yet implemented. Phase 5D pending.',
          severity: 'error',
        }],
      });
      break;
    }

    case 'set-props': {
      if (!msg.componentId) {
        send(ws, { type: 'error', message: 'set-props requires componentId' });
        return;
      }

      log(`Set props requested for component ${msg.componentId}`);
      // TODO: Phase 5C — Forward to running native viewer app
      send(ws, { type: 'error', message: 'set-props not yet implemented. Phase 5C pending.' });
      break;
    }

    case 'get-build-status': {
      log('Build status requested');
      // TODO: Phase 5C — Return current build state
      send(ws, { type: 'error', message: 'get-build-status not yet implemented. Phase 5C pending.' });
      break;
    }

    default: {
      send(ws, { type: 'error', message: `Unknown message type: ${(msg as { type: string }).type}` });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}
