import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to stub uninstalled dependencies (axios) and resolve extensionless imports
const loaderCode = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'axios') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,' + encodeURIComponent('export default { create: () => ({ interceptors: { request: { use: () => {} }, response: { use: () => {} } } }), isCancel: () => false }; export const AxiosInstance = {}; export const AxiosResponse = {}; export const InternalAxiosRequestConfig = {}; export const isCancel = () => false;')
    };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && !specifier.endsWith('.ts')) {
      return await nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}
`;

register('data:text/javascript,' + encodeURIComponent(loaderCode), pathToFileURL('./'));

// Import real apiClient implementation
const apiClientModule = await import('../../src/core/api/apiClient.ts');
const { resolveApiBaseUrl, BASE_URL } = apiClientModule;

describe('BATCH-1: Network Transport & API Client Base URL Resolution (F-005, F-006)', () => {
  it('F-006: supports relative API base paths starting with "/" and trims trailing slashes', () => {
    assert.equal(resolveApiBaseUrl('/api/v1'), '/api/v1');
    assert.equal(resolveApiBaseUrl('/api/v1/'), '/api/v1');
    assert.equal(resolveApiBaseUrl('/api/custom/endpoint///'), '/api/custom/endpoint');
  });

  it('F-006: normalizes relative API base paths without leading slash', () => {
    assert.equal(resolveApiBaseUrl('api/v1'), '/api/v1');
    assert.equal(resolveApiBaseUrl('api/v1/'), '/api/v1');
  });

  it('preserves explicitly configured absolute HTTP and HTTPS URLs', () => {
    assert.equal(
      resolveApiBaseUrl('http://localhost:8080/api/v1'),
      'http://localhost:8080/api/v1'
    );
    assert.equal(
      resolveApiBaseUrl('http://localhost:8080/api/v1/'),
      'http://localhost:8080/api/v1'
    );
    assert.equal(
      resolveApiBaseUrl('https://api.production.example.com/api/v1'),
      'https://api.production.example.com/api/v1'
    );
    assert.equal(
      resolveApiBaseUrl('https://api.production.example.com/api/v1///'),
      'https://api.production.example.com/api/v1'
    );
  });

  it('F-005: unconfigured env variable (undefined) safely defaults to relative "/api/v1" without hardcoded Render URL', () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    try {
      const result = resolveApiBaseUrl(undefined);
      assert.equal(result, '/api/v1');
      assert.ok(!result.includes('onrender.com'), 'Must not contain hardcoded Render domain');
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /VITE_API_BASE_URL is not configured/);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('F-005: empty or whitespace-only env variable safely defaults to relative "/api/v1"', () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    try {
      assert.equal(resolveApiBaseUrl(''), '/api/v1');
      assert.equal(resolveApiBaseUrl('   '), '/api/v1');
      assert.equal(warnings.length, 2);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('invalid protocol safely falls back to relative "/api/v1" with diagnostic warning', () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (msg) => warnings.push(msg);

    try {
      const result = resolveApiBaseUrl('ftp://invalid-server/api');
      assert.equal(result, '/api/v1');
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /Invalid VITE_API_BASE_URL/);
    } finally {
      console.warn = originalWarn;
    }
  });

  it('exported BASE_URL defaults safely in test/unconfigured environment', () => {
    assert.equal(BASE_URL, '/api/v1');
    assert.ok(!BASE_URL.includes('onrender.com'), 'BASE_URL must not contain hardcoded Render domain');
  });
});
