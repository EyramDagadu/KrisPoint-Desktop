// @ts-nocheck
// Report History Management Service with Search and Backup
import { userStorageService } from './UserStorageService.js';

export class ReportHistoryService {
  constructor() {
    this.reports = new Map();
    this.searchIndex = new Map();
    this.backups = new Map();
    this.maxHistorySize = 1000;
    this.autoBackupInterval = null;
    this.initialize();
  }

  initialize() {
    this.loadFromStorage();
    this.setupAutoBackup();
    this.rebuildSearchIndex();
  }

  // Report management
  saveReport(reportData, patientData) {
    const reportId = this.generateReportId();
    const timestamp = new Date();
    
    const report = {
      id: reportId,
      timestamp,
      reportData: { ...reportData },
      patientData: { ...patientData },
      status: 'completed',
      wordCount: this.calculateWordCount(reportData),
      sections: this.getCompletedSections(reportData),
      lastModified: timestamp,
      version: 1,
      tags: this.extractTags(reportData),
      summary: this.generateReportSummary(reportData, patientData)
    };

    // Add to history
    this.reports.set(reportId, report);
    
    // Update search index
    this.addToSearchIndex(report);
    
    // Clean up old reports if necessary
    this.enforceHistoryLimit();
    
    // Save to storage
    this.saveToStorage();
    
    // Create automatic backup
    this.createBackup(report, 'auto');
    
    return reportId;
  }

  updateReport(reportId, reportData, patientData) {
    const existingReport = this.reports.get(reportId);
    if (!existingReport) return null;

    const updatedReport = {
      ...existingReport,
      reportData: { ...reportData },
      patientData: { ...patientData },
      lastModified: new Date(),
      version: existingReport.version + 1,
      wordCount: this.calculateWordCount(reportData),
      sections: this.getCompletedSections(reportData),
      tags: this.extractTags(reportData),
      summary: this.generateReportSummary(reportData, patientData)
    };

    this.reports.set(reportId, updatedReport);
    this.updateSearchIndex(updatedReport);
    this.saveToStorage();
    
    return updatedReport;
  }

  deleteReport(reportId) {
    const report = this.reports.get(reportId);
    if (report) {
      // Create backup before deletion
      this.createBackup(report, 'before_delete');
      
      // Remove from maps
      this.reports.delete(reportId);
      this.removeFromSearchIndex(reportId);
      
      this.saveToStorage();
      return true;
    }
    return false;
  }

  getReport(reportId) {
    return this.reports.get(reportId);
  }

  getAllReports() {
    return Array.from(this.reports.values()).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  getRecentReports(limit = 10) {
    return this.getAllReports().slice(0, limit);
  }

  // Search functionality
  searchReports(query, filters = {}) {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery && Object.keys(filters).length === 0) {
      return this.getAllReports();
    }

    let results = Array.from(this.reports.values());

    // Text search
    if (normalizedQuery) {
      results = results.filter(report => {
        const searchableText = this.getSearchableText(report).toLowerCase();
        return searchableText.includes(normalizedQuery) ||
               this.fuzzyMatch(searchableText, normalizedQuery);
      });
    }

    // Apply filters
    if (filters.dateRange) {
      results = this.filterByDateRange(results, filters.dateRange);
    }

    if (filters.patientName) {
      results = results.filter(report => 
        report.patientData.name?.toLowerCase().includes(filters.patientName.toLowerCase())
      );
    }

    if (filters.modality) {
      results = results.filter(report => 
        report.reportData.modality === filters.modality
      );
    }

    if (filters.status) {
      results = results.filter(report => report.status === filters.status);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(report => 
        filters.tags.some(tag => report.tags.includes(tag))
      );
    }

    // Sort results by relevance and date
    return this.sortSearchResults(results, normalizedQuery);
  }

  // Advanced search with medical terminology
  medicalSearch(query) {
    const medicalTerms = this.extractMedicalTerms(query);
    const synonyms = this.getMedicalSynonyms(medicalTerms);
    
    let expandedQuery = query;
    synonyms.forEach(synonym => {
      expandedQuery += ` ${synonym}`;
    });

    return this.searchReports(expandedQuery);
  }

  // Backup and restore
  createBackup(report, type = 'manual') {
    const backupId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backup = {
      id: backupId,
      type,
      timestamp: new Date(),
      report: JSON.parse(JSON.stringify(report)), // Deep clone
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    };

    this.backups.set(backupId, backup);
    this.cleanupOldBackups();
    this.saveBackupsToStorage();
    
    return backupId;
  }

  getAllBackups() {
    return Array.from(this.backups.values()).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  restoreFromBackup(backupId) {
    const backup = this.backups.get(backupId);
    if (!backup) return null;

    const restoredReport = backup.report;
    
    // Generate new ID for restored report
    const newReportId = this.generateReportId();
    restoredReport.id = newReportId;
    restoredReport.lastModified = new Date();
    restoredReport.version += 1;

    // Add back to reports
    this.reports.set(newReportId, restoredReport);
    this.addToSearchIndex(restoredReport);
    this.saveToStorage();

    return restoredReport;
  }

  exportBackups() {
    return {
      backups: Array.from(this.backups.values()),
      exportDate: new Date(),
      version: '1.0'
    };
  }

  importBackups(backupData) {
    try {
      if (backupData.backups) {
        backupData.backups.forEach(backup => {
          this.backups.set(backup.id, backup);
        });
        this.saveBackupsToStorage();
        return true;
      }
    } catch (error) {
      console.error('Error importing backups:', error);
    }
    return false;
  }

  // Analytics and insights
  getReportStatistics() {
    const reports = Array.from(this.reports.values());
    
    return {
      totalReports: reports.length,
      totalWordCount: reports.reduce((sum, r) => sum + r.wordCount, 0),
      averageWordCount: reports.length > 0 ? 
        Math.round(reports.reduce((sum, r) => sum + r.wordCount, 0) / reports.length) : 0,
      modalityBreakdown: this.getModalityBreakdown(reports),
      reportsThisWeek: this.getReportsInDateRange(reports, 7),
      reportsThisMonth: this.getReportsInDateRange(reports, 30),
      mostCommonTags: this.getMostCommonTags(reports),
      averageReportsPerDay: this.calculateAverageReportsPerDay(reports),
      busiest Day: this.getBusiestDay(reports)
    };
  }

  getProductivityInsights() {
    const reports = Array.from(this.reports.values());
    const last30Days = reports.filter(r => 
      (new Date() - new Date(r.timestamp)) <= 30 * 24 * 60 * 60 * 1000
    );

    return {
      reportsCompleted: last30Days.length,
      wordsWritten: last30Days.reduce((sum, r) => sum + r.wordCount, 0),
      averageReportTime: this.calculateAverageReportTime(last30Days),
      mostProductiveHour: this.getMostProductiveHour(last30Days),
      completionRate: this.calculateCompletionRate(last30Days),
      trendsAnalysis: this.analyzeTrends(reports)
    };
  }

  // Helper methods
  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculateWordCount(reportData) {
    const sections = ['findings', 'impression', 'technique', 'clinicalHistory'];
    return sections.reduce((count, section) => {
      const text = reportData[section] || '';
      return count + text.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
  }

  getCompletedSections(reportData) {
    const sections = ['findings', 'impression', 'technique', 'clinicalHistory'];
    return sections.filter(section => 
      reportData[section] && reportData[section].trim().length > 0
    );
  }

  extractTags(reportData) {
    const tags = [];
    
    // Extract modality
    if (reportData.modality) tags.push(reportData.modality);
    
    // Extract study type
    if (reportData.examSubtype) tags.push(reportData.examSubtype);
    
    // Extract findings keywords
    const findings = reportData.findings || '';
    const commonKeywords = [
      'normal', 'abnormal', 'mass', 'lesion', 'fracture', 'effusion',
      'pneumonia', 'consolidation', 'nodule', 'cardiomegaly'
    ];
    
    commonKeywords.forEach(keyword => {
      if (findings.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return [...new Set(tags)]; // Remove duplicates
  }

  generateReportSummary(reportData, patientData) {
    const modality = reportData.modality || 'Study';
    const patient = patientData.name || 'Patient';
    const findings = reportData.findings || '';
    
    // Extract first sentence of findings or create generic summary
    const firstSentence = findings.split('.')[0];
    if (firstSentence && firstSentence.length > 10) {
      return `${modality} for ${patient}: ${firstSentence}.`;
    }
    
    return `${modality} report for ${patient}`;
  }

  getSearchableText(report) {
    const sections = ['findings', 'impression', 'technique', 'clinicalHistory'];
    const reportText = sections.map(section => 
      report.reportData[section] || ''
    ).join(' ');
    
    const patientText = Object.values(report.patientData).join(' ');
    const tagsText = report.tags.join(' ');
    
    return `${reportText} ${patientText} ${tagsText} ${report.summary}`;
  }

  fuzzyMatch(text, query) {
    // Simple fuzzy matching for typos
    const words = query.split(' ');
    return words.some(word => {
      if (word.length < 3) return text.includes(word);
      
      // Allow 1 character difference for fuzzy matching
      const regex = new RegExp(word.split('').join('.*'), 'i');
      return regex.test(text);
    });
  }

  filterByDateRange(reports, dateRange) {
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return reports;
    }
    
    return reports.filter(report => new Date(report.timestamp) >= startDate);
  }

  sortSearchResults(results, query) {
    if (!query) {
      return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Score results based on relevance
    return results.map(report => ({
      ...report,
      relevanceScore: this.calculateRelevanceScore(report, query)
    })).sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  calculateRelevanceScore(report, query) {
    const searchableText = this.getSearchableText(report).toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    let score = 0;
    
    // Exact matches in summary get highest score
    if (report.summary.toLowerCase().includes(normalizedQuery)) score += 10;
    
    // Matches in patient name
    if (report.patientData.name?.toLowerCase().includes(normalizedQuery)) score += 8;
    
    // Matches in tags
    if (report.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) score += 6;
    
    // Matches in findings
    if (report.reportData.findings?.toLowerCase().includes(normalizedQuery)) score += 4;
    
    // Matches in impression
    if (report.reportData.impression?.toLowerCase().includes(normalizedQuery)) score += 3;
    
    // General text matches
    const matches = (searchableText.match(new RegExp(normalizedQuery, 'gi')) || []).length;
    score += matches;
    
    return score;
  }

  // Storage methods
  saveToStorage() {
    try {
      const data = {
        reports: Array.from(this.reports.entries()),
        lastUpdated: new Date()
      };
      userStorageService.setItem('krishPoint_reportHistory', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving report history:', error);
    }
  }

  loadFromStorage() {
    try {
      const data = userStorageService.getItem('krishPoint_reportHistory');
      if (data) {
        const parsed = JSON.parse(data);
        this.reports = new Map(parsed.reports || []);
      }
    } catch (error) {
      console.error('Error loading report history:', error);
    }
  }

  saveBackupsToStorage() {
    try {
      const data = {
        backups: Array.from(this.backups.entries()),
        lastUpdated: new Date()
      };
      userStorageService.setItem('krishPoint_backups', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving backups:', error);
    }
  }

  loadBackupsFromStorage() {
    try {
      const data = userStorageService.getItem('krishPoint_backups');
      if (data) {
        const parsed = JSON.parse(data);
        this.backups = new Map(parsed.backups || []);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  }

  // Maintenance methods
  enforceHistoryLimit() {
    if (this.reports.size > this.maxHistorySize) {
      const sortedReports = Array.from(this.reports.values())
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      const toDelete = sortedReports.slice(0, this.reports.size - this.maxHistorySize);
      toDelete.forEach(report => {
        this.reports.delete(report.id);
        this.removeFromSearchIndex(report.id);
      });
    }
  }

  cleanupOldBackups() {
    const maxBackups = 100;
    if (this.backups.size > maxBackups) {
      const sortedBackups = Array.from(this.backups.values())
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      const toDelete = sortedBackups.slice(0, this.backups.size - maxBackups);
      toDelete.forEach(backup => this.backups.delete(backup.id));
    }
  }

  setupAutoBackup() {
    // Auto backup every 5 minutes
    this.autoBackupInterval = setInterval(() => {
      this.saveToStorage();
      this.saveBackupsToStorage();
    }, 5 * 60 * 1000);
  }

  // Search index methods
  rebuildSearchIndex() {
    this.searchIndex.clear();
    this.reports.forEach(report => this.addToSearchIndex(report));
  }

  addToSearchIndex(report) {
    const searchableText = this.getSearchableText(report);
    const words = searchableText.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      if (word.length > 2) {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word).add(report.id);
      }
    });
  }

  updateSearchIndex(report) {
    this.removeFromSearchIndex(report.id);
    this.addToSearchIndex(report);
  }

  removeFromSearchIndex(reportId) {
    this.searchIndex.forEach((reportIds, word) => {
      reportIds.delete(reportId);
      if (reportIds.size === 0) {
        this.searchIndex.delete(word);
      }
    });
  }

  // Medical terminology helpers
  extractMedicalTerms(query) {
    const medicalTermPattern = /\b(?:CT|MRI|X-ray|ultrasound|mammography|pneumonia|fracture|mass|lesion|nodule|effusion|consolidation|cardiomegaly|atelectasis|hemorrhage)\b/gi;
    return query.match(medicalTermPattern) || [];
  }

  getMedicalSynonyms(terms) {
    const synonymMap = {
      'pneumonia': ['consolidation', 'infiltrate', 'opacity'],
      'fracture': ['break', 'crack', 'discontinuity'],
      'mass': ['lesion', 'nodule', 'growth'],
      'cardiomegaly': ['enlarged heart', 'cardiac enlargement'],
      'effusion': ['fluid', 'collection']
    };

    const synonyms = [];
    terms.forEach(term => {
      const termSynonyms = synonymMap[term.toLowerCase()] || [];
      synonyms.push(...termSynonyms);
    });

    return synonyms;
  }

  // Analytics helper methods
  getModalityBreakdown(reports) {
    const breakdown = {};
    reports.forEach(report => {
      const modality = report.reportData.modality || 'Unknown';
      breakdown[modality] = (breakdown[modality] || 0) + 1;
    });
    return breakdown;
  }

  getReportsInDateRange(reports, days) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return reports.filter(report => new Date(report.timestamp) >= cutoff).length;
  }

  getMostCommonTags(reports) {
    const tagCounts = {};
    reports.forEach(report => {
      report.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  calculateAverageReportsPerDay(reports) {
    if (reports.length === 0) return 0;
    
    const firstReport = Math.min(...reports.map(r => new Date(r.timestamp)));
    const daysSinceFirst = Math.max(1, (Date.now() - firstReport) / (24 * 60 * 60 * 1000));
    
    return Math.round((reports.length / daysSinceFirst) * 100) / 100;
  }

  getBusiestDay(reports) {
    const dayCounts = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    reports.forEach(report => {
      const day = new Date(report.timestamp).getDay();
      const dayName = dayNames[day];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
  }

  calculateAverageReportTime(reports) {
    // This would require tracking start/end times
    // For now, return estimated time based on word count
    const avgWords = reports.reduce((sum, r) => sum + r.wordCount, 0) / reports.length;
    return Math.round(avgWords / 100 * 60); // Estimate: 100 words per minute
  }

  getMostProductiveHour(reports) {
    const hourCounts = {};
    
    reports.forEach(report => {
      const hour = new Date(report.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    return mostProductiveHour ? `${mostProductiveHour}:00` : 'None';
  }

  calculateCompletionRate(reports) {
    const completeReports = reports.filter(r => r.sections.length >= 2);
    return reports.length > 0 ? Math.round((completeReports.length / reports.length) * 100) : 0;
  }

  analyzeTrends(reports) {
    // Analyze trends over time
    const last30Days = reports.filter(r => 
      (Date.now() - new Date(r.timestamp)) <= 30 * 24 * 60 * 60 * 1000
    );
    const previous30Days = reports.filter(r => {
      const age = Date.now() - new Date(r.timestamp);
      return age > 30 * 24 * 60 * 60 * 1000 && age <= 60 * 24 * 60 * 60 * 1000;
    });

    const currentPeriod = last30Days.length;
    const previousPeriod = previous30Days.length;
    
    let trend = 'stable';
    let change = 0;
    
    if (previousPeriod > 0) {
      change = Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    return { trend, change };
  }

  // Cleanup
  destroy() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
    }
  }
}

// Create and export singleton instance
export const reportHistoryService = new ReportHistoryService();