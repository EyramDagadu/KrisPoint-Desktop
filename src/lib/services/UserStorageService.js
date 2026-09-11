// UserStorageService.js - User-specific localStorage with isolation
import { browser } from '$app/environment';

const SESSION_KEY = 'KRISPOINT_CURRENT_USER';

class UserStorageService {
  constructor() {
    this.currentUsername = null;
    if (browser) {
      this.loadCurrentUser();
    }
  }

  loadCurrentUser() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const user = JSON.parse(sessionData);
        this.currentUsername = user.username;
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  }

  getCurrentUsername() {
    if (!this.currentUsername && browser) {
      this.loadCurrentUser();
    }
    return this.currentUsername;
  }

  setCurrentUser(username) {
    this.currentUsername = username;
  }

  getUserKey(key) {
    const username = this.getCurrentUsername();
    if (!username) {
      console.warn(`No user logged in, using global key: ${key}`);
      return key;
    }
    return `${username}_${key}`;
  }

  setItem(key, value) {
    if (!browser) return;
    const userKey = this.getUserKey(key);
    localStorage.setItem(userKey, value);
  }

  getItem(key) {
    if (!browser) return null;
    const userKey = this.getUserKey(key);
    return localStorage.getItem(userKey);
  }

  removeItem(key) {
    if (!browser) return;
    const userKey = this.getUserKey(key);
    localStorage.removeItem(userKey);
  }

  // Clear all data for current user
  clearUserData() {
    if (!browser) return;
    const username = this.getCurrentUsername();
    if (!username) return;

    const keys = Object.keys(localStorage);
    const userPrefix = `${username}_`;
    
    keys.forEach(key => {
      if (key.startsWith(userPrefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const userStorageService = new UserStorageService();
