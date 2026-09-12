// CompletionService.js - Medical report completion calculation based on clinical requirements
export class CompletionService {
    constructor() {
        // Weighted completion scoring based on medical report requirements
        this.weights = {
            patientData: 10,      // Patient identifiers (name, MRN, etc.)
            studyMetadata: 10,    // Study details (modality, date, exam type)
            clinicalHistory: 10,  // Clinical indication/history
            technique: 15,        // Technique/protocol description
            findings: 25,         // Clinical findings (most critical)
            impression: 30        // Impression/conclusion (most critical)
        };
        
        // Minimum content thresholds for each section
        this.thresholds = {
            clinicalHistory: 3,   // At least 3 words
            technique: 5,         // At least 5 words or mentions key elements
            findings: 15,         // At least 15 words or structured content
            impression: 5         // At least 5 words or 1 complete sentence
        };
    }

    /**
     * Calculate completion percentage and missing sections for a radiology report
     * @param {Object} reportData - Current report content
     * @param {Object} patientData - Patient information
     * @param {string} reportStatus - Report status ('draft' or 'finalized')
     * @returns {Object} { percent: number, missing: string[], details: Object }
     */
    computeReportCompletion(reportData, patientData, reportStatus = 'draft') {
        // If report is finalized, always show 100% complete
        if (reportStatus === 'finalized') {
            return {
                percent: 100,
                missing: [],
                details: { finalized: true }
            };
        }

        const scores = {};
        const missing = [];
        const details = {};

        // 1. Patient Data (10%) - Essential identifiers
        const patientScore = this.evaluatePatientData(patientData);
        scores.patientData = patientScore.score;
        details.patientData = patientScore.details;
        if (patientScore.score < this.weights.patientData) {
            missing.push(...patientScore.missing);
        }

        // 2. Study Metadata (10%) - Exam details
        const studyScore = this.evaluateStudyMetadata(patientData);
        scores.studyMetadata = studyScore.score;
        details.studyMetadata = studyScore.details;
        if (studyScore.score < this.weights.studyMetadata) {
            missing.push(...studyScore.missing);
        }

        // 3. Clinical History (10%) - Indication
        const historyScore = this.evaluateClinicalHistory(patientData, reportData);
        scores.clinicalHistory = historyScore.score;
        details.clinicalHistory = historyScore.details;
        if (historyScore.score < this.weights.clinicalHistory) {
            missing.push(...historyScore.missing);
        }

        // 4. Technique (15%) - Protocol description
        const techniqueScore = this.evaluateTechnique(reportData);
        scores.technique = techniqueScore.score;
        details.technique = techniqueScore.details;
        if (techniqueScore.score < this.weights.technique) {
            missing.push(...techniqueScore.missing);
        }

        // 5. Findings (25%) - Clinical observations
        const findingsScore = this.evaluateFindings(reportData);
        scores.findings = findingsScore.score;
        details.findings = findingsScore.details;
        if (findingsScore.score < this.weights.findings) {
            missing.push(...findingsScore.missing);
        }

        // 6. Impression (30%) - Clinical conclusion
        const impressionScore = this.evaluateImpression(reportData);
        scores.impression = impressionScore.score;
        details.impression = impressionScore.details;
        if (impressionScore.score < this.weights.impression) {
            missing.push(...impressionScore.missing);
        }

        // Calculate total percentage
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const percent = Math.min(Math.round(totalScore), 100);

        return {
            percent,
            missing: [...new Set(missing)], // Remove duplicates
            details,
            scores
        };
    }

    evaluatePatientData(patientData) {
        const required = ['name'];
        const optional = ['mrn', 'age', 'gender'];
        const missing = [];
        let score = 0;

        // Patient name is essential (7 points)
        if (patientData.name && patientData.name.trim()) {
            score += 7;
        } else {
            missing.push('Patient name');
        }

        // At least one additional identifier (3 points)
        const hasOptional = optional.some(field => 
            patientData[field] && String(patientData[field]).trim()
        );
        
        if (hasOptional) {
            score += 3;
        } else {
            missing.push('Patient identifiers (MRN, age, or gender)');
        }

        return {
            score: Math.min(score, this.weights.patientData),
            missing,
            details: { required: 'name', optional }
        };
    }

    evaluateStudyMetadata(patientData) {
        const required = ['examType', 'studyDate'];
        const optional = ['modality', 'examSubtype'];
        const missing = [];
        let score = 0;

        // Exam type/modality (5 points)
        if ((patientData.examType && patientData.examType.trim()) || 
            (patientData.modality && patientData.modality.trim())) {
            score += 5;
        } else {
            missing.push('Exam type/modality');
        }

        // Study date (3 points)
        if (patientData.studyDate) {
            score += 3;
        } else {
            missing.push('Study date');
        }

        // Body part/subtype (2 points)
        if (patientData.examSubtype && patientData.examSubtype.trim()) {
            score += 2;
        } else {
            missing.push('Body part/exam subtype');
        }

        return {
            score: Math.min(score, this.weights.studyMetadata),
            missing,
            details: { required, optional }
        };
    }

    evaluateClinicalHistory(patientData, reportData) {
        const missing = [];
        let score = 0;

        // Check for clinical history/indication
        const indication = patientData.indication || patientData.clinicalHistory || '';
        const wordCount = indication.trim().split(/\s+/).filter(w => w.length > 0).length;

        if (wordCount >= this.thresholds.clinicalHistory) {
            score = this.weights.clinicalHistory;
        } else if (wordCount > 0) {
            // Give full credit for any clinical history (even brief)
            score = this.weights.clinicalHistory;
        } else {
            missing.push('Clinical indication/history');
        }

        return {
            score,
            missing,
            details: { wordCount, threshold: this.thresholds.clinicalHistory }
        };
    }

    evaluateTechnique(reportData) {
        const missing = [];
        let score = 0;

        // Extract technique content (could be in dedicated section or beginning of content)
        const content = reportData.content || '';
        const techniqueContent = this.extractTechniqueContent(content);
        const wordCount = techniqueContent.split(/\s+/).filter(w => w.length > 0).length;

        if (wordCount >= this.thresholds.technique) {
            score = this.weights.technique;
        } else if (wordCount > 0) {
            score = Math.round(this.weights.technique * 0.6); // Partial credit
            missing.push('Detailed technique description');
        } else {
            missing.push('Technique/protocol description');
        }

        return {
            score,
            missing,
            details: { wordCount, threshold: this.thresholds.technique }
        };
    }

    evaluateFindings(reportData) {
        const missing = [];
        let score = 0;

        const content = reportData.content || '';
        const findingsContent = this.extractFindingsContent(content);
        const wordCount = findingsContent.split(/\s+/).filter(w => w.length > 0).length;

        // Check for structured content (bullet points, numbered lists)
        const hasStructure = /[•\-\*]|\d+\.|:\s*\n/g.test(findingsContent);
        
        if (wordCount >= this.thresholds.findings || hasStructure) {
            score = this.weights.findings;
        } else if (wordCount >= 5) {
            score = Math.round(this.weights.findings * 0.7); // Partial credit
            missing.push('Detailed clinical findings');
        } else {
            missing.push('Clinical findings');
        }

        return {
            score,
            missing,
            details: { wordCount, threshold: this.thresholds.findings, hasStructure }
        };
    }

    evaluateImpression(reportData) {
        const missing = [];
        let score = 0;

        const content = reportData.content || '';
        const impressionContent = this.extractImpressionContent(content);
        const wordCount = impressionContent.split(/\s+/).filter(w => w.length > 0).length;

        // Check for complete sentences
        const hasCompleteSentence = /[.!?]\s*$|[.!?]\s+[A-Z]/g.test(impressionContent);

        if (wordCount >= this.thresholds.impression || hasCompleteSentence) {
            score = this.weights.impression;
        } else if (wordCount > 0) {
            score = Math.round(this.weights.impression * 0.5); // Partial credit
            missing.push('Complete clinical impression');
        } else {
            missing.push('Clinical impression/conclusion');
        }

        return {
            score,
            missing,
            details: { wordCount, threshold: this.thresholds.impression, hasCompleteSentence }
        };
    }

    // Helper methods to extract content from different sections
    extractTechniqueContent(content) {
        // Look for TECHNIQUE section or first few sentences
        const techniqueMatch = content.match(/TECHNIQUE:\s*([^]*?)(?=\n[A-Z]+:|$)/i);
        if (techniqueMatch) return techniqueMatch[1].trim();
        
        // Fallback: first 50 words might contain technique
        const words = content.split(/\s+/).slice(0, 50).join(' ');
        return words;
    }

    extractFindingsContent(content) {
        // Look for FINDINGS section
        const findingsMatch = content.match(/FINDINGS:\s*([^]*?)(?=\n[A-Z]+:|$)/i);
        if (findingsMatch) return findingsMatch[1].trim();
        
        // Fallback: most of the content is likely findings
        const sections = content.split(/\n(?=[A-Z]+:)/);
        return sections.find(section => !section.match(/^(TECHNIQUE|COMPARISON|IMPRESSION):/i)) || content;
    }

    extractImpressionContent(content) {
        // Look for IMPRESSION section
        const impressionMatch = content.match(/IMPRESSION:\s*([^]*?)$/i);
        if (impressionMatch) return impressionMatch[1].trim();
        
        // Look for CONCLUSION section
        const conclusionMatch = content.match(/CONCLUSION:\s*([^]*?)$/i);
        if (conclusionMatch) return conclusionMatch[1].trim();
        
        // Fallback: last paragraph might be impression
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
        return paragraphs[paragraphs.length - 1] || '';
    }

    /**
     * Get a human-readable completion summary
     * @param {Object} result - Result from computeReportCompletion
     * @returns {string} Human-readable summary
     */
    getCompletionSummary(result) {
        if (result.percent === 100) {
            return 'Report is complete';
        }
        
        if (result.missing.length === 0) {
            return `${result.percent}% complete`;
        }
        
        const missingCount = result.missing.length;
        if (missingCount === 1) {
            return `${result.percent}% complete - Missing: ${result.missing[0]}`;
        } else if (missingCount <= 3) {
            return `${result.percent}% complete - Missing: ${result.missing.join(', ')}`;
        } else {
            return `${result.percent}% complete - ${missingCount} items missing`;
        }
    }
}

// Export singleton instance
export const completionService = new CompletionService();