// CustomOptionsService.js - Manages custom modality and body region options
import { userStorageService } from './UserStorageService.js';

class CustomOptionsService {
  constructor() {
    this.CUSTOM_MODALITIES_KEY = 'customModalities';
    this.CUSTOM_REGIONS_KEY = 'customRegions';
  }

  // Get all custom modalities for current user
  getCustomModalities() {
    try {
      const stored = userStorageService.getItem(this.CUSTOM_MODALITIES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading custom modalities:', error);
      return [];
    }
  }

  // Get all custom body regions for current user
  // Returns array of objects: [{ region: 'Lumbosacral', modalities: ['ct', 'mri', 'xray'] }]
  getCustomRegions() {
    try {
      const stored = userStorageService.getItem(this.CUSTOM_REGIONS_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      
      // Backward compatibility: if stored data is old format (simple array), convert it
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        // Old format: ['Region1', 'Region2'] - convert to new format with all modalities
        const converted = parsed.map(region => ({
          region,
          modalities: ['ct', 'mri', 'xray', 'us', 'mg', 'fl', 'nm'] // Available for all
        }));
        // Save in new format
        userStorageService.setItem(this.CUSTOM_REGIONS_KEY, JSON.stringify(converted));
        return converted;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading custom regions:', error);
      return [];
    }
  }

  // Get custom regions filtered by modality
  getCustomRegionsForModality(modality) {
    const allRegions = this.getCustomRegions();
    return allRegions
      .filter(item => item.modalities.includes(modality))
      .map(item => item.region);
  }

  // Add a new custom modality (if not already exists)
  addCustomModality(modality) {
    if (!modality || !modality.trim()) return false;
    
    const trimmedModality = modality.trim();
    const customModalities = this.getCustomModalities();
    
    // Check if already exists (case-insensitive)
    const exists = customModalities.some(
      m => m.toLowerCase() === trimmedModality.toLowerCase()
    );
    
    if (!exists) {
      customModalities.push(trimmedModality);
      userStorageService.setItem(this.CUSTOM_MODALITIES_KEY, JSON.stringify(customModalities));
      console.log('✅ Added custom modality to persistent storage:', trimmedModality);
      return true;
    }
    
    console.log('ℹ️ Custom modality already exists:', trimmedModality);
    return false;
  }

  // Add a new custom body region with modality associations
  // modalities: array of modality codes like ['ct', 'mri', 'xray']
  addCustomRegion(region, modalities = []) {
    if (!region || !region.trim()) return false;
    if (!modalities || modalities.length === 0) {
      console.error('❌ Cannot add custom region without modalities');
      return false;
    }
    
    const trimmedRegion = region.trim();
    const customRegions = this.getCustomRegions();
    
    // Check if already exists (case-insensitive)
    const existingIndex = customRegions.findIndex(
      item => item.region.toLowerCase() === trimmedRegion.toLowerCase()
    );
    
    if (existingIndex === -1) {
      // Add new region with modalities
      customRegions.push({ region: trimmedRegion, modalities });
      userStorageService.setItem(this.CUSTOM_REGIONS_KEY, JSON.stringify(customRegions));
      console.log('✅ Added custom region to persistent storage:', trimmedRegion, 'for modalities:', modalities);
      return true;
    } else {
      // Update existing region's modalities (merge)
      const existing = customRegions[existingIndex];
      const mergedModalities = [...new Set([...existing.modalities, ...modalities])];
      customRegions[existingIndex] = { region: trimmedRegion, modalities: mergedModalities };
      userStorageService.setItem(this.CUSTOM_REGIONS_KEY, JSON.stringify(customRegions));
      console.log('✅ Updated custom region modalities:', trimmedRegion, 'now available for:', mergedModalities);
      return true;
    }
  }

  // Remove a custom modality
  removeCustomModality(modality) {
    const customModalities = this.getCustomModalities();
    const filtered = customModalities.filter(m => m !== modality);
    userStorageService.setItem(this.CUSTOM_MODALITIES_KEY, JSON.stringify(filtered));
  }

  // Remove a custom body region
  removeCustomRegion(region) {
    const customRegions = this.getCustomRegions();
    const filtered = customRegions.filter(item => item.region !== region);
    userStorageService.setItem(this.CUSTOM_REGIONS_KEY, JSON.stringify(filtered));
  }

  // Clear all custom options (useful for testing or reset)
  clearAll() {
    userStorageService.removeItem(this.CUSTOM_MODALITIES_KEY);
    userStorageService.removeItem(this.CUSTOM_REGIONS_KEY);
    console.log('🗑️ Cleared all custom options');
  }
}

export const customOptionsService = new CustomOptionsService();
