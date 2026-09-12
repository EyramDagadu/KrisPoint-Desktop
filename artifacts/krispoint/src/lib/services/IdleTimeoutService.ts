import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';

export interface IdleTimeoutConfig {
  idleTimeoutMs: number;
  warningTimeMs: number;
}

const DEFAULT_CONFIG: IdleTimeoutConfig = {
  idleTimeoutMs: 15 * 60 * 1000,
  warningTimeMs: 2 * 60 * 1000
};

export const showIdleWarning = writable(false);
export const idleTimeRemaining = writable(0);

class IdleTimeoutService {
  private config: IdleTimeoutConfig = DEFAULT_CONFIG;
  private lastActivityTime: number = Date.now();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private isActive: boolean = false;
  private onLogout: (() => Promise<void>) | null = null;

  private readonly ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click'
  ];

  init(onLogout: () => Promise<void>, config?: Partial<IdleTimeoutConfig>) {
    if (!browser) return;
    
    this.onLogout = onLogout;
    
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
    
    this.lastActivityTime = Date.now();
    this.startMonitoring();
  }

  private startMonitoring() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });
    
    this.checkInterval = setInterval(() => this.checkIdleTime(), 5000);
  }

  private handleActivity = () => {
    const wasShowingWarning = get(showIdleWarning);
    this.lastActivityTime = Date.now();
    
    if (wasShowingWarning) {
      showIdleWarning.set(false);
      idleTimeRemaining.set(0);
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }
  };

  private checkIdleTime() {
    if (!this.isActive) return;
    
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;
    const warningThreshold = this.config.idleTimeoutMs - this.config.warningTimeMs;
    
    if (idleTime >= this.config.idleTimeoutMs) {
      this.triggerLogout();
    } else if (idleTime >= warningThreshold && !get(showIdleWarning)) {
      this.showWarning();
    }
  }

  private showWarning() {
    const remaining = this.config.idleTimeoutMs - (Date.now() - this.lastActivityTime);
    showIdleWarning.set(true);
    idleTimeRemaining.set(Math.ceil(remaining / 1000));
    
    this.countdownInterval = setInterval(() => {
      const timeLeft = this.config.idleTimeoutMs - (Date.now() - this.lastActivityTime);
      if (timeLeft <= 0) {
        this.triggerLogout();
      } else {
        idleTimeRemaining.set(Math.ceil(timeLeft / 1000));
      }
    }, 1000);
  }

  private async triggerLogout() {
    showIdleWarning.set(false);
    this.stop();
    
    if (this.onLogout) {
      await this.onLogout();
    }
  }

  extendSession() {
    this.handleActivity();
  }

  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    this.ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    
    showIdleWarning.set(false);
    idleTimeRemaining.set(0);
  }

  setConfig(config: Partial<IdleTimeoutConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): IdleTimeoutConfig {
    return { ...this.config };
  }
}

export const idleTimeoutService = new IdleTimeoutService();
