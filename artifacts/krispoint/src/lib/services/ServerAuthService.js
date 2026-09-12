class ServerAuthService {
  constructor() {
    this.currentUser = null;
    this.permissions = [];
    this.isAuthenticated = false;
    this.initializeDatabase();
  }
  
  async initializeDatabase() {
    try {
      const response = await fetch('/api/admin/seed', { 
        method: 'POST',
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        console.log('Database:', result.alreadySeeded ? 'ready' : 'seeded');
      }
    } catch (error) {
      console.warn('Database initialization deferred');
    }
  }

  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        this.permissions = result.permissions || [];
        this.isAuthenticated = true;
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.currentUser = null;
      this.permissions = [];
      this.isAuthenticated = false;
    }
    
    return { success: true };
  }

  async validateSession() {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        this.permissions = result.permissions || [];
        this.isAuthenticated = true;
      } else {
        this.currentUser = null;
        this.permissions = [];
        this.isAuthenticated = false;
      }

      return result;
    } catch (error) {
      console.error('Session validation error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async register(userData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async getRoles() {
    try {
      const response = await fetch('/api/auth/roles', {
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Get roles error:', error);
      return { success: false, error: 'Network error', roles: [] };
    }
  }

  async getUsers() {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: 'Network error', users: [] };
    }
  }

  async updateUser(userId, updates) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      return await response.json();
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async deactivateUser(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Deactivate user error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  hasAnyPermission(permissions) {
    return permissions.some(p => this.permissions.includes(p));
  }

  hasAllPermissions(permissions) {
    return permissions.every(p => this.permissions.includes(p));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isLoggedIn() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  getUserRole() {
    return this.currentUser?.roleName || null;
  }

  getUserRoleDisplayName() {
    return this.currentUser?.roleDisplayName || null;
  }
}

let _serverAuthServiceInstance = null;

export function getServerAuthService() {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!_serverAuthServiceInstance) {
    _serverAuthServiceInstance = new ServerAuthService();
  }
  return _serverAuthServiceInstance;
}

export { ServerAuthService };
