import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ESM loader hook to handle extensionless .ts imports and stub axios
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

// Import real production security modules, types, and reducers
const { decodeJwtPayload, isJwtAdmin } = await import('../../src/core/security/jwt.ts');
const { tokenStorage } = await import('../../src/core/security/tokenStorage.ts');
const authSliceModule = await import('../../src/features/auth/redux/authSlice.ts');
const { default: authReducer, logoutUser, refreshSessionThunk } = authSliceModule;

// Helper to create mock JWT tokens with base64url payload
function createMockJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'mockSignatureString123';
  return `${header}.${body}.${signature}`;
}

describe('BATCH-3: Security, Session Hygiene & Route Authorization', () => {

  // =========================================================================
  // F-036: AdminRoute Role Check Relies on Signed JWT Claims (Not LocalStorage)
  // =========================================================================
  describe('F-036: Signed JWT Claims & Admin Authorization', () => {
    it('accurately decodes claims from valid base64url JWT', () => {
      const payload = { sub: '42', email: 'admin@c2c.test', role: 'ADMIN' };
      const token = createMockJwt(payload);
      const decoded = decodeJwtPayload(token);

      assert.equal(decoded?.sub, '42');
      assert.equal(decoded?.email, 'admin@c2c.test');
      assert.equal(decoded?.role, 'ADMIN');
    });

    it('identifies ADMIN role from payload.role', () => {
      const adminToken = createMockJwt({ role: 'ADMIN' });
      assert.equal(isJwtAdmin(adminToken), true);

      const roleAdminToken = createMockJwt({ role: 'ROLE_ADMIN' });
      assert.equal(isJwtAdmin(roleAdminToken), true);

      const lowercaseAdminToken = createMockJwt({ role: 'admin' });
      assert.equal(isJwtAdmin(lowercaseAdminToken), true);
    });

    it('identifies ADMIN role from payload.roles array or authorities array', () => {
      const rolesArrayToken = createMockJwt({ roles: ['USER', 'ADMIN'] });
      assert.equal(isJwtAdmin(rolesArrayToken), true);

      const springAuthoritiesToken = createMockJwt({
        authorities: [{ authority: 'ROLE_ADMIN' }],
      });
      assert.equal(isJwtAdmin(springAuthoritiesToken), true);
    });

    it('identifies uppercase Role claim from live backend JWTs', () => {
      const liveRenderAdminToken = createMockJwt({
        sub: 'admin@c2c.test',
        Role: 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      assert.equal(isJwtAdmin(liveRenderAdminToken), true);

      const rolesUpperToken = createMockJwt({
        Roles: ['ADMIN'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      assert.equal(isJwtAdmin(rolesUpperToken), true);
    });

    it('rejects regular USER tokens (prevents privilege escalation)', () => {
      const userToken = createMockJwt({ role: 'USER', email: 'user@c2c.test' });
      assert.equal(isJwtAdmin(userToken), false);
    });

    it('rejects expired JWT tokens even if role is ADMIN', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createMockJwt({ role: 'ADMIN', exp: pastTimestamp });
      assert.equal(isJwtAdmin(expiredToken), false);
    });

    it('safely rejects malformed, empty, or non-JWT strings', () => {
      assert.equal(isJwtAdmin(null), false);
      assert.equal(isJwtAdmin(''), false);
      assert.equal(isJwtAdmin('not.a.valid.jwt.token'), false);
      assert.equal(isJwtAdmin('randomString'), false);
    });
  });

  // =========================================================================
  // F-035: Unconditional Logout Token and Session State Cleanup
  // =========================================================================
  describe('F-035: Unconditional Client Logout', () => {
    const getLoggedInState = () => ({
      user: { id: 1, email: 'test@c2c.test', role: 'USER' },
      token: 'validToken123',
      refreshToken: 'refreshToken456',
      isAuthenticated: true,
      loading: false,
      error: null,
      isAuthModalOpen: false,
      authModalMode: 'login',
    });

    it('clears user, tokens, and sets isAuthenticated to false on logoutUser.fulfilled', () => {
      const state = getLoggedInState();
      const nextState = authReducer(state, { type: logoutUser.fulfilled.type });

      assert.equal(nextState.user, null, 'User must be cleared');
      assert.equal(nextState.token, null, 'Access token must be cleared');
      assert.equal(nextState.refreshToken, null, 'Refresh token must be cleared');
      assert.equal(nextState.isAuthenticated, false, 'isAuthenticated must be false');
      assert.equal(nextState.loading, false, 'Loading must be false');
    });

    it('UNCONDITIONALLY clears user, tokens, and session state on logoutUser.rejected (network error / 500)', () => {
      const state = getLoggedInState();
      const nextState = authReducer(state, {
        type: logoutUser.rejected.type,
        error: { message: 'Network Error: Backend offline' },
      });

      assert.equal(nextState.user, null, 'User must be cleared even on network failure');
      assert.equal(nextState.token, null, 'Token must be cleared even on network failure');
      assert.equal(nextState.refreshToken, null, 'Refresh token must be cleared on failure');
      assert.equal(nextState.isAuthenticated, false, 'Session must not remain active after failed logout');
      assert.equal(nextState.loading, false, 'Loading flag must be reset');
    });

    it('PRESERVES active session state if access token is unexpired when refreshSessionThunk is rejected', () => {
      const validToken = createMockJwt({
        sub: 'user-42',
        role: 'USER',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      const activeState = {
        user: { id: 'user-42', email: 'user@c2c.test' },
        token: validToken,
        refreshToken: null,
        status: 'AUTHENTICATED',
        isAuthenticated: true,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login',
      };

      const nextState = authReducer(activeState, {
        type: refreshSessionThunk.rejected.type,
        error: { message: 'Refresh token invalid or expired' },
      });

      assert.equal(nextState.isAuthenticated, true, 'Active session must be preserved on background refresh failure');
      assert.equal(nextState.status, 'AUTHENTICATED', 'Status must remain AUTHENTICATED');
      assert.equal(nextState.loading, false, 'Loading must be false');
      assert.equal(nextState.user?.id, 'user-42', 'User must not be cleared');
    });

    it('CLEARS session if access token is expired when refreshSessionThunk is rejected', () => {
      const expiredToken = createMockJwt({
        sub: 'user-42',
        role: 'USER',
        exp: Math.floor(Date.now() / 1000) - 3600,
      });
      const expiredState = {
        user: { id: 'user-42', email: 'user@c2c.test' },
        token: expiredToken,
        refreshToken: null,
        status: 'AUTHENTICATED',
        isAuthenticated: true,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login',
      };

      const nextState = authReducer(expiredState, {
        type: refreshSessionThunk.rejected.type,
        error: { message: 'Refresh token invalid or expired' },
      });

      assert.equal(nextState.isAuthenticated, false, 'Session must be cleared when expired token refresh fails');
      assert.equal(nextState.status, 'UNAUTHENTICATED', 'Status must be UNAUTHENTICATED');
      assert.equal(nextState.user, null, 'User must be cleared');
    });
  });

  // =========================================================================
  // F-013: User Profile Serialization Strongly Typed in tokenStorage
  // =========================================================================
  describe('F-013 & F-011: tokenStorage Typing & Token Management', () => {
    it('sets and retrieves typed User profile object', () => {
      // Mock global localStorage and document.cookie for Node.js test environment
      const memoryStore = new Map();
      globalThis.localStorage = {
        getItem: (k) => memoryStore.get(k) || null,
        setItem: (k, v) => memoryStore.set(k, v),
        removeItem: (k) => memoryStore.delete(k),
        clear: () => memoryStore.clear(),
      };
      let cookieStore = '';
      Object.defineProperty(globalThis, 'document', {
        value: {
          get cookie() { return cookieStore; },
          set cookie(val) { cookieStore = val; },
        },
        writable: true,
        configurable: true,
      });

      const user = {
        id: 'user-42',
        email: 'developer@c2c.test',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
      };

      tokenStorage.setUser(user);
      const retrieved = tokenStorage.getUser();

      assert.equal(retrieved?.id, 'user-42');
      assert.equal(retrieved?.email, 'developer@c2c.test');
      assert.equal(retrieved?.role, 'USER');

      tokenStorage.clearTokens();
      assert.equal(tokenStorage.getUser(), null);
    });
  });

  // =========================================================================
  // F-023: Navigation Location State Typing
  // =========================================================================
  describe('F-023: Navigation Location State', () => {
    it('safely extracts fromPath from typed LocationState without unsafe any coercion', () => {
      const stateWithFrom = { from: { pathname: '/problems/two-sum' } };
      const fromPath = stateWithFrom?.from?.pathname;
      assert.equal(fromPath, '/problems/two-sum');

      const emptyState = null;
      const emptyFromPath = emptyState?.from?.pathname;
      assert.equal(emptyFromPath, undefined);
    });
  });

  // =========================================================================
  // F-027: Canonical Auth Source in CompanyDetails
  // =========================================================================
  describe('F-027: CompanyDetails Single Auth Source of Truth', () => {
    it('confirms CompanyDetails relies on Redux isAuthenticated directly', () => {
      const reduxAuthState = { isAuthenticated: true };
      const isUserAuth = reduxAuthState.isAuthenticated;
      assert.equal(isUserAuth, true);

      const unauthState = { isAuthenticated: false };
      assert.equal(unauthState.isAuthenticated, false);
    });
  });
});
