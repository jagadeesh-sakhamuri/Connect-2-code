import { tokenStorage } from '../security/tokenStorage';

const GUEST_SCOPE = 'guest';

function hashScope(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function getIdentityKey(): string {
  const user = tokenStorage.getUser();

  if (user?.id !== undefined && user?.id !== null && String(user.id).trim()) {
    return `id:${String(user.id)}`;
  }

  if (user?.email) {
    return `email:${String(user.email).trim().toLowerCase()}`;
  }

  return GUEST_SCOPE;
}

function getScope(): string {
  const identity = getIdentityKey();
  return identity === GUEST_SCOPE ? GUEST_SCOPE : hashScope(identity);
}

function getScopedKey(key: string): string {
  return `c2c:user:${getScope()}:${key}`;
}

export const userScopedStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(getScopedKey(key));
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(getScopedKey(key), value);
    } catch {}
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(getScopedKey(key));
    } catch {}
  },
};
