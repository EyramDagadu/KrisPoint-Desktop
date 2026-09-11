// Authentication Store for KrisPoint - Multi-User Hospital System
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { authService } from '../services/AuthService.js';
import { reportBadgeCounts } from './reportBadgeStore.js';
import { chatService } from '../services/ChatService';

// Authentication state
const initialAuthState = {
    isAuthenticated: false,
    currentUser: null,
    permissions: [],
    isLoading: false,
    error: null
};

export const authState = writable(initialAuthState);

// Derived stores for easy access
export const isAuthenticated = derived(authState, $authState => $authState.isAuthenticated);
export const currentUser = derived(authState, $authState => $authState.currentUser);
export const permissions = derived(authState, $authState => $authState.permissions);
export const authError = derived(authState, $authState => $authState.error);
export const isLoading = derived(authState, $authState => $authState.isLoading);

// Permission check helpers
export function hasPermission(permission) {
    let perms = [];
    authState.subscribe(state => perms = state.permissions)();
    return perms.includes(permission);
}

export function hasAnyPermission(permissionList) {
    let perms = [];
    authState.subscribe(state => perms = state.permissions)();
    return permissionList.some(p => perms.includes(p));
}

// Actions
export const authActions = {
    // Initialize authentication state
    async initialize() {
        if (!browser) return;
        
        authState.update(state => ({ ...state, isLoading: true }));
        
        try {
            const result = await authService.loadSession();
            
            authState.update(state => ({
                ...state,
                isAuthenticated: authService.isLoggedIn(),
                currentUser: authService.getCurrentUser(),
                permissions: authService.permissions || [],
                isLoading: false,
                error: null
            }));
        } catch (error) {
            authState.update(state => ({
                ...state,
                isAuthenticated: false,
                currentUser: null,
                permissions: [],
                isLoading: false,
                error: error.message
            }));
        }
    },

    // Login
    async login(username, password) {
        authState.update(state => ({ ...state, isLoading: true, error: null }));
        
        try {
            const result = await authService.login(username, password);
            
            if (result.success) {
                authState.update(state => ({
                    ...state,
                    isAuthenticated: true,
                    currentUser: result.user,
                    permissions: result.permissions || [],
                    isLoading: false,
                    error: null
                }));
                // Start real-time SSE monitor for session termination
                authActions.startSessionEventSource();
                return { success: true, mustChangePassword: result.mustChangePassword || false };
            } else {
                authState.update(state => ({
                    ...state,
                    isAuthenticated: false,
                    currentUser: null,
                    permissions: [],
                    isLoading: false,
                    error: result.error
                }));
                return { success: false, error: result.error };
            }
        } catch (error) {
            authState.update(state => ({
                ...state,
                isAuthenticated: false,
                currentUser: null,
                permissions: [],
                isLoading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    },

    // Register new doctor
    async register(doctorData) {
        authState.update(state => ({ ...state, isLoading: true, error: null }));
        
        try {
            const result = await authService.register(doctorData);
            
            if (result.success) {
                authState.update(state => ({
                    ...state,
                    isLoading: false,
                    error: null
                }));
                return { success: true, doctor: result.doctor };
            } else {
                authState.update(state => ({
                    ...state,
                    isLoading: false,
                    error: result.error
                }));
                // Pass through isLocked and existingUsername for single-user lock
                return { 
                    success: false, 
                    error: result.error,
                    isLocked: result.isLocked,
                    existingUsername: result.existingUsername
                };
            }
        } catch (error) {
            authState.update(state => ({
                ...state,
                isLoading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    },

    // Logout
    async logout() {
        // Close ALL SSE connections via central manager
        if (browser) {
            try {
                const { SSEManager } = await import('$lib/services/SSEManager');
                SSEManager.closeAll();
            } catch (e) {
                console.error('Failed to close SSE connections:', e);
            }
        }
        
        // Stop session event source
        if (sessionEventSource) {
            sessionEventSource.close();
            sessionEventSource = null;
        }
        
        // Stop chat service polling to prevent network errors during logout
        if (browser) {
            try {
                chatService.destroy();
            } catch (e) {
                console.error('Failed to destroy chat service:', e);
            }
        }
        
        // Update chat presence to offline before logging out
        if (browser) {
            try {
                await fetch('/api/chat/presence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ isOnline: false })
                });
            } catch (e) {
                console.error('Failed to update presence on logout:', e);
            }
        }
        
        await authService.logout();
        
        authState.update(state => ({
            ...state,
            isAuthenticated: false,
            currentUser: null,
            permissions: [],
            isLoading: false,
            error: null
        }));
        
        // Reset badge counts to avoid stale data on next login
        reportBadgeCounts.reset();
        
        // Redirect to login page
        if (browser) {
            const { goto } = await import('$app/navigation');
            goto('/auth');
        }
    },

    // Update profile
    async updateProfile(updates) {
        authState.update(state => ({ ...state, isLoading: true, error: null }));
        
        try {
            const result = await authService.updateProfile(updates);
            
            if (result.success) {
                authState.update(state => ({
                    ...state,
                    currentUser: result.user,
                    isLoading: false,
                    error: null
                }));
                return { success: true, user: result.user };
            } else {
                authState.update(state => ({
                    ...state,
                    isLoading: false,
                    error: result.error
                }));
                return { success: false, error: result.error };
            }
        } catch (error) {
            authState.update(state => ({
                ...state,
                isLoading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
        authState.update(state => ({ ...state, isLoading: true, error: null }));
        
        try {
            const result = await authService.changePassword(currentPassword, newPassword);
            
            if (result.success) {
                authState.update(state => ({
                    ...state,
                    isLoading: false,
                    error: null
                }));
                return { success: true, message: result.message };
            } else {
                authState.update(state => ({
                    ...state,
                    isLoading: false,
                    error: result.error
                }));
                return { success: false, error: result.error };
            }
        } catch (error) {
            authState.update(state => ({
                ...state,
                isLoading: false,
                error: error.message
            }));
            return { success: false, error: error.message };
        }
    },

    // Get security question for forgot password
    async getSecurityQuestion(username) {
        try {
            const result = await authService.getSecurityQuestion(username);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Verify security answer
    async verifySecurityAnswer(username, answer) {
        try {
            const result = await authService.verifySecurityAnswer(username, answer);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Reset password using security question
    async resetPassword(username, newPassword) {
        try {
            const result = await authService.resetPassword(username, newPassword);
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Update security question for existing user
    async updateSecurityQuestion(data) {
        try {
            const result = await authService.updateSecurityQuestion(data);
            if (result.success) {
                // Refresh current user to get updated data
                const updatedUser = authService.getCurrentUser();
                authState.update(state => ({
                    ...state,
                    currentUser: updatedUser
                }));
            }
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Clear error
    clearError() {
        authState.update(state => ({ ...state, error: null }));
    },

    // Check if any doctors exist
    hasAnyDoctors() {
        return authService.hasAnyDoctors();
    },

    // Validate session is still active (detects if another login invalidated it)
    async validateSession() {
        if (!browser) return { valid: true };
        
        try {
            const res = await fetch('/api/auth/session', { credentials: 'include' });
            if (!res.ok || res.status === 401) {
                // Session invalid - force full logout
                await authService.logout();
                authState.update(state => ({
                    ...state,
                    isAuthenticated: false,
                    currentUser: null,
                    permissions: [],
                    error: 'Session expired or terminated'
                }));
                return { valid: false, reason: 'session_invalid' };
            }
            return { valid: true };
        } catch (e) {
            return { valid: true }; // Assume valid on network error
        }
    },

    // Stop session event source
    stopSessionEventSource() {
        if (sessionEventSource) {
            sessionEventSource.close();
            sessionEventSource = null;
            console.log('SSE session monitor stopped');
        }
    },

    // Start real-time session event source (SSE)
    startSessionEventSource() {
        if (!browser) return;
        
        // Close any existing connection
        if (sessionEventSource) {
            sessionEventSource.close();
        }
        
        try {
            sessionEventSource = new EventSource('/api/auth/session-events');
            
            sessionEventSource.onopen = () => {
                console.log('SSE session monitor connected');
            };
            
            sessionEventSource.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'session_terminated') {
                        console.log('Session terminated by server:', data.reason);
                        authActions.stopSessionEventSource();
                        
                        // Clear auth state
                        await authService.logout();
                        authState.update(state => ({
                            ...state,
                            isAuthenticated: false,
                            currentUser: null,
                            permissions: [],
                            error: 'Your session was terminated because you logged in elsewhere'
                        }));
                        
                        reportBadgeCounts.reset();
                        
                        // Redirect to login
                        const { goto } = await import('$app/navigation');
                        goto('/auth?reason=session_terminated');
                    }
                } catch (e) {
                    console.error('Error parsing SSE message:', e);
                }
            };
            
            sessionEventSource.onerror = (error) => {
                console.log('SSE connection error, will reconnect...');
            };
        } catch (e) {
            console.error('Failed to start SSE session monitor:', e);
        }
    }
};

// Session validator interval ID (fallback polling)
let sessionValidatorId = null;

// Session event source (real-time SSE)
let sessionEventSource = null;

// Initialize auth when the store is created
if (browser) {
    authActions.initialize().then(() => {
        // Only start SSE monitor if authenticated
        let isAuth = false;
        authState.subscribe(s => isAuth = s.isAuthenticated)();
        if (isAuth) {
            authActions.startSessionEventSource();
        }
    });
}