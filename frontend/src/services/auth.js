/**
 * Authentication service with JWT token management
 */

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'pizza_auth_token';
    this.REFRESH_KEY = 'pizza_refresh_token';
    this.USER_KEY = 'pizza_user';
  }

  // Encode token (basic obfuscation - use proper encryption in production)
  encryptToken(token) {
    return btoa(token);
  }

  decryptToken(encryptedToken) {
    try {
      return atob(encryptedToken);
    } catch {
      return null;
    }
  }

  setTokens(accessToken, refreshToken, user = null) {
    localStorage.setItem(this.TOKEN_KEY, this.encryptToken(accessToken));
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, this.encryptToken(refreshToken));
    }
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getAccessToken() {
    const encrypted = localStorage.getItem(this.TOKEN_KEY);
    return encrypted ? this.decryptToken(encrypted) : null;
  }

  getRefreshToken() {
    const encrypted = localStorage.getItem(this.REFRESH_KEY);
    return encrypted ? this.decryptToken(encrypted) : null;
  }

  getUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken, data.user);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = '/';
  }

  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Check if token is expired (simple check - decode JWT payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  hasRole(requiredRole) {
    const user = this.getUser();
    return user?.roles?.includes(requiredRole) || false;
  }

  getAuthHeader() {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export default new AuthService();
