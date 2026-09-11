import { writable, get } from 'svelte/store';

// Letterhead configuration store
export const letterheadStore = writable({
    currentLetterhead: null,
    letterheads: [],
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,
    isLoading: false,
    settings: {
        height: 120,
        opacity: 1.0,
        position: 'top',
        margin: 20,
        topMargin: 10
    }
});

// Actions for letterhead management
export const letterheadActions = {
    
    addLetterhead(letterhead) {
        letterheadStore.update(store => ({
            ...store,
            letterheads: [...store.letterheads, letterhead]
        }));
    },
    
    removeLetterhead(letterheadId) {
        letterheadStore.update(store => ({
            ...store,
            letterheads: store.letterheads.filter(l => l.id !== letterheadId),
            currentLetterhead: store.currentLetterhead?.id === letterheadId 
                ? null 
                : store.currentLetterhead
        }));
    },
    
    setCurrentLetterhead(letterhead) {
        letterheadStore.update(store => ({
            ...store,
            currentLetterhead: letterhead
        }));
    },
    
    clearCurrentLetterhead() {
        letterheadStore.update(store => ({
            ...store,
            currentLetterhead: null
        }));
    },
    
    updateSettings(newSettings) {
        letterheadStore.update(store => ({
            ...store,
            settings: { ...store.settings, ...newSettings }
        }));
    },
    
    setUploadState(isUploading, progress = 0, error = null) {
        letterheadStore.update(store => ({
            ...store,
            isUploading,
            uploadProgress: progress,
            uploadError: error
        }));
    },
    
    async loadFromServer() {
        try {
            letterheadStore.update(store => ({ ...store, isLoading: true }));
            
            const response = await fetch('/api/organization/letterhead', {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.letterhead) {
                    letterheadStore.set({
                        currentLetterhead: data.letterhead.currentLetterhead || null,
                        letterheads: data.letterhead.currentLetterhead ? [data.letterhead.currentLetterhead] : [],
                        isUploading: false,
                        uploadProgress: 0,
                        uploadError: null,
                        isLoading: false,
                        settings: { 
                            height: 120,
                            opacity: 1.0,
                            position: 'top',
                            margin: 20,
                            topMargin: 10,
                            ...data.letterhead.settings 
                        }
                    });
                } else {
                    letterheadStore.update(store => ({ ...store, isLoading: false }));
                }
            } else {
                letterheadStore.update(store => ({ ...store, isLoading: false }));
            }
        } catch (error) {
            console.warn('Failed to load letterhead from server:', error);
            letterheadStore.update(store => ({ ...store, isLoading: false }));
        }
    },
    
    async saveToServer() {
        try {
            const store = get(letterheadStore);
            
            const response = await fetch('/api/organization/letterhead', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    letterhead: store.currentLetterhead,
                    settings: store.settings
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success;
            }
            return false;
        } catch (error) {
            console.warn('Failed to save letterhead to server:', error);
            return false;
        }
    },
    
    async deleteFromServer() {
        try {
            const response = await fetch('/api/organization/letterhead', {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                letterheadStore.update(store => ({
                    ...store,
                    currentLetterhead: null,
                    letterheads: []
                }));
                return true;
            }
            return false;
        } catch (error) {
            console.warn('Failed to delete letterhead from server:', error);
            return false;
        }
    },
    
    loadFromStorage() {
        this.loadFromServer();
    },
    
    saveToStorage() {
        this.saveToServer();
    }
};
