import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const host = '127.0.0.1';
const port = 4173;
const baseUrl = `http://${host}:${port}`;
const routes = ['/', '/login', '/practice', '/problems/1', '/companies/tcs'];

const server = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

const fetchWithTimeout = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const stop = () => {
  if (!server.killed) {
    server.kill('SIGTERM');
  }
};

let exitCode = 0;

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetchWithTimeout(baseUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}

    await delay(500);
  }

  if (!ready) {
    throw new Error(`Vite preview did not become ready.\n${output}`);
  }

  for (const route of routes) {
    const response = await fetchWithTimeout(`${baseUrl}${route}`);
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`Route ${route} returned HTTP ${response.status}`);
    }

    if (!body.includes('<!doctype html>') && !body.includes('<!DOCTYPE html>')) {
      throw new Error(`Route ${route} did not return the built SPA HTML document`);
    }
  }

  console.log(`Preview smoke test passed for ${routes.length} routes.`);
} catch (error) {
  exitCode = 1;
  console.error(error instanceof Error ? error.message : error);
} finally {
  stop();
  await delay(200);
  process.exit(exitCode);
}
