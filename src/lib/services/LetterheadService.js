// Service for handling letterhead integration with PDF generation

export class LetterheadService {
    
    // Convert base64 data URL to Uint8Array for pdf-lib
    static dataUrlToUint8Array(dataUrl) {
        const base64 = dataUrl.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
    
    // Determine image format from data URL (only PDF-compatible formats)
    static getImageFormat(dataUrl) {
        if (dataUrl.includes('data:image/png')) return 'png';
        if (dataUrl.includes('data:image/jpeg') || dataUrl.includes('data:image/jpg')) return 'jpg';
        // Only support PNG/JPEG for pdf-lib compatibility
        return null; // Unsupported format
    }
    
    // Load image from data URL and prepare for PDF embedding
    static async loadImageForPDF(dataUrl) {
        try {
            const format = this.getImageFormat(dataUrl);
            
            // Only process supported formats
            if (!format) {
                console.warn('Unsupported image format for PDF embedding. Only PNG and JPEG are supported.');
                return null;
            }
            
            const imageBytes = this.dataUrlToUint8Array(dataUrl);
            
            return {
                bytes: imageBytes,
                format: format
            };
        } catch (error) {
            console.error('Failed to load image for PDF:', error);
            return null;
        }
    }
    
    // Calculate letterhead dimensions for PDF
    static calculateLetterheadSize(letterheadSettings, pageWidth) {
        const maxWidth = pageWidth - (letterheadSettings.margin * 2);
        const targetHeight = letterheadSettings.height;
        
        return {
            maxWidth,
            targetHeight,
            x: letterheadSettings.margin,
            opacity: letterheadSettings.opacity
        };
    }
}