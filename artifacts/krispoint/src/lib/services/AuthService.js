import { getServerAuthService } from './ServerAuthService.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.permissions = [];
        this.isAuthenticated = false;
        this._serverAuthService = null;
    }
    
    getServerAuth() {
        if (!this._serverAuthService) {
            this._serverAuthService = getServerAuthService();
        }
        return this._serverAuthService;
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
    
    getUserRole() {
        return this.currentUser?.roleName || null;
    }
    
    getUserRoleDisplayName() {
        return this.currentUser?.roleDisplayName || null;
    }

    async hasAnyDoctors() {
        try {
            const response = await fetch('/api/auth/check-users');
            const result = await response.json();
            return result.success ? result.hasUsers : false;
        } catch (error) {
            console.error('Error checking users:', error);
            return false;
        }
    }
    
    async getRoles() {
        const serverAuth = this.getServerAuth();
        return await serverAuth.getRoles();
    }
    
    async getUsers() {
        const serverAuth = this.getServerAuth();
        return await serverAuth.getUsers();
    }

    async register(userData) {
        const serverAuth = this.getServerAuth();
        return await serverAuth.register(userData);
    }

    async login(username, password) {
        const serverAuth = this.getServerAuth();
        const result = await serverAuth.login(username, password);
        
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
    }

    async logout() {
        const serverAuth = this.getServerAuth();
        await serverAuth.logout();
        
        this.currentUser = null;
        this.permissions = [];
        this.isAuthenticated = false;
    }

    async loadSession() {
        const serverAuth = this.getServerAuth();
        const result = await serverAuth.validateSession();
        
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
    }

    async updateProfile(updates) {
        try {
            if (!this.currentUser?.id) {
                return { success: false, error: 'User not logged in' };
            }
            
            const response = await fetch(`/api/users/${this.currentUser.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            const result = await response.json();

            if (result.success) {
                const sessionResult = await this.loadSession();
                if (!sessionResult.success || !sessionResult.user) {
                    return { success: false, error: 'Profile saved, but the updated session could not be loaded' };
                }
                return { ...result, user: sessionResult.user };
            }
            return result;
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: 'Network error occurred' };
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            return await response.json();
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, error: 'Network error occurred' };
        }
    }

    async getSecurityQuestion(username) {
        try {
            const response = await fetch('/api/auth/security-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            return await response.json();
        } catch (error) {
            console.error('Get security question error:', error);
            return { success: false, error: 'Network error occurred' };
        }
    }

    async verifySecurityAnswer(username, answer) {
        try {
            const response = await fetch('/api/auth/verify-security-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, answer })
            });
            return await response.json();
        } catch (error) {
            console.error('Verify security answer error:', error);
            return { success: false, error: 'Network error occurred' };
        }
    }

    async resetPassword(username, newPassword) {
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, newPassword })
            });
            return await response.json();
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, error: 'Network error occurred' };
        }
    }

    async updateSecurityQuestion(data) {
        try {
            const response = await fetch('/api/auth/update-security-question', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Update security question error:', error);
            return { success: false, error: 'Network error occurred' };
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.isAuthenticated && this.currentUser !== null;
    }
}

export const authService = new AuthService();
