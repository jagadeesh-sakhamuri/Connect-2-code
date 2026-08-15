/**
 * Token Storage Abstraction Layer with Cookie & LocalStorage Fallbacks
 * Stores accessToken and refreshToken in HttpCookies & LocalStorage
 * Clears cookies on logout as requested
 */

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function eraseCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const tokenStorage = {
  getToken(): string | null {
    return getCookie('accessToken') || localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  },

  setToken(token: string): void {
    setCookie('accessToken', token);
    try {
      localStorage.setItem('accessToken', token);
    } catch {}
  },

  getRefreshToken(): string | null {
    return getCookie('refreshToken') || localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  },

  setRefreshToken(token: string): void {
    setCookie('refreshToken', token);
    try {
      localStorage.setItem('refreshToken', token);
    } catch {}
  },

  clearTokens(): void {
    eraseCookie('accessToken');
    eraseCookie('refreshToken');
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    } catch {}
  },
};
