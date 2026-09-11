import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const initialCounts = {
  pendingReviews: 0,
  returnedReports: 0,
  loading: false,
  lastFetched: null
};

function createReportBadgeStore() {
  const { subscribe, set, update } = writable(initialCounts);

  return {
    subscribe,
    
    async loadCounts() {
      if (!browser) return;
      
      update(state => ({ ...state, loading: true }));
      
      try {
        const response = await fetch('/api/reports/counts', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            update(state => ({
              ...state,
              pendingReviews: data.counts.pendingReviews || 0,
              returnedReports: data.counts.returnedReports || 0,
              loading: false,
              lastFetched: Date.now()
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load report counts:', error);
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },
    
    async refreshAfterAction() {
      await this.loadCounts();
    },
    
    reset() {
      set(initialCounts);
    }
  };
}

export const reportBadgeCounts = createReportBadgeStore();
