// Professional Medical PDF Report Generator
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { get } from 'svelte/store';
import { reportData, patientData } from '../stores/reportStore.js';
import { letterheadStore } from '../stores/letterheadStore.js';
import { currentUser } from '../stores/authStore.js';
import { LetterheadService } from './LetterheadService.js';
import { settingsService } from './SettingsService.js';
import { userStorageService } from './UserStorageService.js';

class ProfessionalPDFService {
    constructor() {
        // Default values - will be adjusted based on quality settings
        this.setQualityParameters('high'); // Default to high quality
    }

    /**
     * Convert hex color string to pdf-lib rgb() object
     * Supports 3-digit (#f00) and 6-digit (#ff0000) hex formats
     * Returns black rgb(0,0,0) for invalid or missing colors
     */
    hexToRgbColor(hexColor) {
        if (!hexColor || typeof hexColor !== 'string') {
            return rgb(0, 0, 0); // Default to black
        }
        
        // Remove # if present
        let hex = hexColor.replace('#', '');
        
        // Expand 3-digit hex to 6-digit
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        
        // Validate 6-digit hex
        if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
            return rgb(0, 0, 0); // Default to black for invalid colors
        }
        
        // Convert to 0-1 floats for pdf-lib
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        return rgb(r, g, b);
    }

    setQualityParameters(quality) {
        // Single quality setting for all PDFs - A4 size for international compatibility
        this.pageWidth = 595; // A4 width: 210mm at 72 DPI
        this.pageHeight = 842; // A4 height: 297mm at 72 DPI
        this.margin = 56; // ~20mm margins
        this.rightMargin = 56;
        this.lineHeight = 14; // ~1.25x body font for tighter spacing
        this.titleFontSize = 16;
        this.headerFontSize = 13;
        this.bodyFontSize = 11;
        this.footerFontSize = 8;
        this.sectionSpacing = 18; // Paragraph-style spacing before major sections - larger than lineHeight (14pt) for clear separation
        this.subHeaderSpacing = 8; // Space before sub-headers (LUNGS:, HEART:, etc.)
        this.contentWidth = this.pageWidth - (this.margin + this.rightMargin);
    }
    
    getFontPaths(fontFamily) {
        const fontMap = {
            liberation: {
                regular: '/fonts/LiberationSans-Regular.ttf',
                bold: '/fonts/LiberationSans-Bold.ttf',
                italic: '/fonts/LiberationSans-Italic.ttf',
                boldItalic: '/fonts/LiberationSans-BoldItalic.ttf'
            },
            noto: {
                regular: '/fonts/NotoSans-Regular.ttf',
                bold: '/fonts/NotoSans-Bold.ttf',
                italic: '/fonts/NotoSans-Italic.ttf',
                boldItalic: '/fonts/NotoSans-BoldItalic.ttf'
            },
            source: {
                regular: '/fonts/SourceSans3-Regular.ttf',
                bold: '/fonts/SourceSans3-Bold.ttf',
                italic: '/fonts/SourceSans3-It.ttf',
                boldItalic: '/fonts/SourceSans3-BoldIt.ttf'
            },
            dejavu: {
                regular: '/fonts/DejaVuSans.ttf',
                bold: '/fonts/DejaVuSans-Bold.ttf',
                italic: '/fonts/DejaVuSans-Oblique.ttf',
                boldItalic: '/fonts/DejaVuSans-BoldOblique.ttf'
            }
        };
        
        return fontMap[fontFamily] || fontMap.liberation;
    }

    async generateMedicalReport(fontScale = 1.0, lineSpacing = 1.0, fontFamily = 'liberation') {
        console.log('🏁 generateMedicalReport called with fontScale:', fontScale, 'lineSpacing:', lineSpacing, 'fontFamily:', fontFamily);
        try {
            console.log('🏁 Getting report/patient/letterhead data...');
            const currentReportData = get(reportData);
            const currentPatientData = get(patientData);
            const currentLetterheadData = get(letterheadStore);
            console.log('🏁 Data retrieved, report content length:', currentReportData?.content?.length || 0);
            
            // Store data for multi-page use
            this.currentPatientData = currentPatientData;
            this.currentLetterheadData = currentLetterheadData;
            this.currentReportData = currentReportData;
            
            // Apply quality settings from user preferences
            const settings = settingsService.getAllSettings();
            const exportQuality = settings.reports?.exportQuality || 'high';
            this.setQualityParameters(exportQuality);
            
            // Apply font scaling if provided (excluding footer text)
            if (fontScale !== 1.0) {
                this.titleFontSize *= fontScale;
                this.headerFontSize *= fontScale;
                this.bodyFontSize *= fontScale;
                // Footer font size is NOT scaled - stays at base size
            }
            
            // Apply line spacing scaling separately (affects lineHeight only)
            if (lineSpacing !== 1.0) {
                this.lineHeight *= lineSpacing;
            } else if (fontScale !== 1.0) {
                // If only font scaling, scale line height with font size
                this.lineHeight *= fontScale;
            }

            const pdfDoc = await PDFDocument.create();
            this.pdfDoc = pdfDoc; // Store for multi-page use
            
            // Register fontkit for custom TrueType font embedding
            pdfDoc.registerFontkit(fontkit);
            
            // Load and embed TrueType fonts based on selected font family
            const fontPaths = this.getFontPaths(fontFamily);
            console.log('📝 Loading fonts:', fontPaths);
            
            const regularFontBytes = await fetch(fontPaths.regular).then(res => res.arrayBuffer());
            const boldFontBytes = await fetch(fontPaths.bold).then(res => res.arrayBuffer());
            
            const regularFont = await pdfDoc.embedFont(regularFontBytes);
            const boldFont = await pdfDoc.embedFont(boldFontBytes);
            
            // Try to load italic fonts (optional - fallback to regular/bold if not available)
            let italicFont = regularFont; // Fallback to regular
            let boldItalicFont = boldFont; // Fallback to bold
            
            try {
                const italicFontBytes = await fetch(fontPaths.italic).then(res => res.arrayBuffer());
                if (italicFontBytes.byteLength > 1000) { // Valid font file check
                    italicFont = await pdfDoc.embedFont(italicFontBytes);
                }
            } catch (error) {
                console.warn('⚠️ Italic font not available, using regular font as fallback');
            }
            
            try {
                const boldItalicFontBytes = await fetch(fontPaths.boldItalic).then(res => res.arrayBuffer());
                if (boldItalicFontBytes.byteLength > 1000) { // Valid font file check
                    boldItalicFont = await pdfDoc.embedFont(boldItalicFontBytes);
                }
            } catch (error) {
                console.warn('⚠️ Bold-Italic font not available, using bold font as fallback');
            }
            
            // Store fonts for multi-page use
            this.regularFont = regularFont;
            this.boldFont = boldFont;
            this.italicFont = italicFont;
            this.boldItalicFont = boldItalicFont;

            let currentPage = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
            
            // Start position - use letterhead top margin if letterhead is at top, otherwise use default margin
            let yPosition;
            if (currentLetterheadData.currentLetterhead && currentLetterheadData.settings.position === 'top') {
                yPosition = this.pageHeight - (currentLetterheadData.settings.topMargin || 10);
                yPosition = await this.addLetterhead(currentPage, currentLetterheadData.currentLetterhead, currentLetterheadData.settings, yPosition, pdfDoc);
            } else {
                yPosition = this.pageHeight - this.margin;
            }

            // Add hospital/clinic header
            yPosition = await this.addHeader(currentPage, boldFont, regularFont, yPosition);
            yPosition -= 5; // Reduced from 10 to 5

            // Add patient information
            yPosition = await this.addPatientInfo(currentPage, boldFont, regularFont, currentPatientData, yPosition);
            yPosition -= 2; // Much tighter spacing to dividing line

            // Add centered study-specific report title
            yPosition = await this.addStudySpecificTitle(currentPage, boldFont, currentPatientData, yPosition);
            yPosition -= 8; // Reduced from 15 to 8

            // Add report sections
            const reportResult = await this.addReportSections(pdfDoc, currentPage, boldFont, regularFont, currentReportData, yPosition);
            yPosition = reportResult.yPosition;
            currentPage = reportResult.currentPage;
            
            // Add signed addendums if any exist
            if (this.signedAddendums && this.signedAddendums.length > 0) {
                const addendumResult = await this.addAddendumSections(pdfDoc, currentPage, boldFont, regularFont, this.signedAddendums, yPosition);
                yPosition = addendumResult.yPosition;
                currentPage = addendumResult.currentPage;
            }

            // Add footers to all pages with correct page numbers
            await this.addFootersToAllPages(pdfDoc, regularFont, currentPatientData);

            // Add letterhead at bottom if position is 'bottom'
            if (currentLetterheadData.currentLetterhead && currentLetterheadData.settings.position === 'bottom') {
                // Add letterhead at bottom of each page
                const pages = pdfDoc.getPages();
                for (const page of pages) {
                    await this.addLetterheadAtBottom(page, currentLetterheadData.currentLetterhead, currentLetterheadData.settings, pdfDoc);
                }
            }

            return await pdfDoc.save();
        } catch (error) {
            console.error('❌ PDF Generation Error:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error stack:', error.stack);
            throw error; // Re-throw the original error with full details
        }
    }

    async addHeader(page, boldFont, regularFont, yPosition) {
        // Header removed - will add study-specific title after patient info instead
        return yPosition;
    }

    async addPatientInfo(page, boldFont, regularFont, patientInfo, yPosition) {
        // Get comparison section from report content if available
        const reportContent = get(reportData);
        const comparisonText = this.extractComparisonFromReport(reportContent.content) || "No prior studies for comparison";
        
        // Left column patient data - ALL CAPS (without indication)
        const leftColumnData = [
            { label: "PATIENT NAME:", value: (patientInfo.name || "N/A").toUpperCase() },
            { label: "HOSPITAL NO:", value: (patientInfo.hospitalNumber || "N/A").toUpperCase() },
            { label: "AGE:", value: patientInfo.age ? `${patientInfo.age} ${(patientInfo.ageUnit || 'years').toUpperCase()}` : "N/A" }
        ];

        // Right column report data - ALL CAPS (compact labels)
        const rightColumnData = [
            { label: "SEX:", value: (patientInfo.gender || "N/A").toUpperCase() },
            { label: "DATE:", value: (this.formatDate(patientInfo.studyDate) || this.formatDate(new Date())).toUpperCase() }
        ];

        const startY = yPosition;
        // Left column gets 75% width (for longer patient names), right gets 25%
        const leftColumnWidth = this.contentWidth * 0.75;
        const rightColumnStart = this.margin + leftColumnWidth;
        const leftValueOffset = 95; // Offset for left column values
        let currentLeftY = startY;
        let currentRightY = startY;

        // Draw left column with dynamic positioning
        for (const item of leftColumnData) {
            const wrappedValue = this.wrapText(item.value, leftColumnWidth - leftValueOffset - 10, regularFont, this.bodyFontSize);
            
            // Label
            page.drawText(item.label, {
                x: this.margin,
                y: currentLeftY,
                size: this.bodyFontSize,
                font: boldFont,
                color: rgb(0, 0, 0)
            });
            
            // Value
            let valueY = currentLeftY;
            for (const line of wrappedValue) {
                page.drawText(line, {
                    x: this.margin + leftValueOffset,
                    y: valueY,
                    size: this.bodyFontSize,
                    font: regularFont,
                    color: rgb(0, 0, 0)
                });
                valueY -= this.lineHeight * 0.8;
            }
            
            currentLeftY = valueY - 5;
        }

        // Draw right column with dynamic positioning (shorter labels now)
        for (const item of rightColumnData) {
            const wrappedValue = this.wrapText(item.value, this.contentWidth - leftColumnWidth - 50, regularFont, this.bodyFontSize);
            
            // Label
            page.drawText(item.label, {
                x: rightColumnStart,
                y: currentRightY,
                size: this.bodyFontSize,
                font: boldFont,
                color: rgb(0, 0, 0)
            });
            
            // Value - compact spacing for short labels (SEX:, DATE:)
            let valueY = currentRightY;
            for (const line of wrappedValue) {
                page.drawText(line, {
                    x: rightColumnStart + 45, // Tighter spacing for short labels
                    y: valueY,
                    size: this.bodyFontSize,
                    font: regularFont,
                    color: rgb(0, 0, 0)
                });
                valueY -= this.lineHeight * 0.8;
            }
            
            currentRightY = valueY - 5;
        }

        // Add INDICATION as full-width field below the two columns
        const afterColumnsY = Math.min(currentLeftY, currentRightY);
        let indicationY = afterColumnsY;
        
        // Draw INDICATION label
        page.drawText("INDICATION:", {
            x: this.margin,
            y: indicationY,
            size: this.bodyFontSize,
            font: boldFont,
            color: rgb(0, 0, 0)
        });
        
        // Wrap indication text to full content width minus label space
        const indicationText = (patientInfo.indication || "N/A").toUpperCase();
        const maxIndicationWidth = this.contentWidth - 95; // Match left column value offset
        const wrappedIndication = this.wrapText(indicationText, maxIndicationWidth, regularFont, this.bodyFontSize);
        
        // Draw indication value - aligned with left column values for symmetry
        let indicationValueY = indicationY;
        for (const line of wrappedIndication) {
            page.drawText(line, {
                x: this.margin + 95, // Same offset as left column values
                y: indicationValueY,
                size: this.bodyFontSize,
                font: regularFont,
                color: rgb(0, 0, 0)
            });
            indicationValueY -= this.lineHeight * 0.8;
        }

        // Add divider after patient info
        const finalY = indicationValueY - 5;
        const dividerY = finalY + 2; // Almost touching the text like an underline
        page.drawLine({
            start: { x: this.margin, y: dividerY },
            end: { x: this.pageWidth - this.rightMargin, y: dividerY },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7)
        });

        return dividerY - 20;
    }

    async addStudySpecificTitle(page, boldFont, patientData, yPosition) {
        // Generate study-specific title based on exam type and body part/indication
        const examType = patientData.examType || '';
        const examSubtype = patientData.examSubtype || '';
        const indication = patientData.indication || '';
        
        let reportTitle = 'REPORT';
        
        if (examType) {
            // Create specific titles based on exam type
            if (examSubtype) {
                reportTitle = `${examSubtype.toUpperCase()} ${examType.toUpperCase()} REPORT`;
            } else if (indication) {
                // Try to extract body part from indication for more specific title
                const bodyParts = ['CHEST', 'ABDOMEN', 'HEAD', 'BRAIN', 'SPINE', 'PELVIS', 'EXTREMITY', 'NECK'];
                const indicationUpper = indication.toUpperCase();
                const bodyPart = bodyParts.find(part => indicationUpper.includes(part));
                
                if (bodyPart) {
                    reportTitle = `${bodyPart} ${examType.toUpperCase()} REPORT`;
                } else {
                    reportTitle = `${examType.toUpperCase()} REPORT`;
                }
            } else {
                reportTitle = `${examType.toUpperCase()} REPORT`;
            }
        }
        
        // Calculate center position for the title
        const titleWidth = boldFont.widthOfTextAtSize(reportTitle, this.headerFontSize);
        const centerX = (this.pageWidth - titleWidth) / 2;
        
        // Draw centered title
        page.drawText(reportTitle, {
            x: centerX,
            y: yPosition,
            size: this.headerFontSize,
            font: boldFont,
            color: rgb(0, 0, 0)
        });
        
        // Add underline
        page.drawLine({
            start: { x: centerX, y: yPosition - 5 },
            end: { x: centerX + titleWidth, y: yPosition - 5 },
            thickness: 1,
            color: rgb(0, 0, 0)
        });
        
        return yPosition - 8; // Reduced spacing after title
    }

    extractComparisonFromReport(content) {
        if (!content) return null;
        
        // Look for comparison section in the content
        // Try different patterns to find comparison text
        const comparisonPatterns = [
            /COMPARISON[:\s]*(.*?)(?=\n\n|\nTECHNIQUE|\nFINDINGS|\nIMPRESSION|$)/is,
            /Comparison[:\s]*(.*?)(?=\n\n|\nTechnique|\nFindings|\nImpression|$)/is,
            /Prior studies[:\s]*(.*?)(?=\n\n|\nTechnique|\nFindings|\nImpression|$)/is
        ];
        
        for (const pattern of comparisonPatterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return match[1].trim().substring(0, 100) + (match[1].trim().length > 100 ? "..." : "");
            }
        }
        
        return null;
    }

    async addReportSections(pdfDoc, currentPage, boldFont, regularFont, reportData, yPosition) {
        // Parse HTML to preserve formatting
        const reportContent = reportData.content || "No report content available.";
        console.log('📄 Starting PDF generation, content length:', reportContent.length);
        
        const formattedContent = this.parseHTMLWithFormatting(reportContent);
        console.log('📄 Parsed content into', formattedContent.length, 'segments');

        // Check if we need a new page
        if (yPosition < 150) {
            currentPage = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
            yPosition = await this.addContinuationPageHeader(currentPage);
        }

        // Report content starts immediately - no redundant title needed since we have study-specific title above

        // Add the full report content with formatting support
        const textResult = await this.addFormattedTextWithBreaks(
            pdfDoc,
            currentPage, 
            formattedContent, 
            boldFont,
            regularFont, 
            this.bodyFontSize, 
            this.margin + 10, 
            yPosition, 
            this.contentWidth - 10
        );
        
        // Return both Y position and current page for proper signature placement
        return {
            yPosition: textResult.yPosition,
            currentPage: textResult.currentPage
        };
    }
    
    setSignedAddendums(addendums) {
        this.signedAddendums = addendums || [];
    }
    
    async addAddendumSections(pdfDoc, currentPage, boldFont, regularFont, addendums, yPosition) {
        console.log('📝 Adding', addendums.length, 'addendum sections to PDF');
        
        for (const addendum of addendums) {
            // Check if we need a new page for the addendum header
            if (yPosition < 150) {
                currentPage = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                yPosition = await this.addContinuationPageHeader(currentPage);
            }
            
            // Add separator line
            yPosition -= 20;
            currentPage.drawLine({
                start: { x: this.margin, y: yPosition },
                end: { x: this.pageWidth - this.rightMargin, y: yPosition },
                thickness: 1,
                color: rgb(0.6, 0.4, 0.8) // Purple color for addendums
            });
            yPosition -= 15;
            
            // Add addendum header
            const signedDate = addendum.signedAt ? new Date(addendum.signedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Unknown date';
            
            const headerText = `ADDENDUM — ${signedDate}`;
            currentPage.drawText(headerText, {
                x: this.margin,
                y: yPosition,
                size: this.headerFontSize,
                font: boldFont,
                color: rgb(0.49, 0.23, 0.93) // Purple color
            });
            yPosition -= this.lineHeight + 5;
            
            // Add reason
            if (addendum.reason) {
                currentPage.drawText('Reason: ' + addendum.reason, {
                    x: this.margin,
                    y: yPosition,
                    size: this.bodyFontSize - 1,
                    font: regularFont,
                    color: rgb(0.4, 0.4, 0.4)
                });
                yPosition -= this.lineHeight;
            }
            
            // Add signer info
            if (addendum.signerName) {
                currentPage.drawText('Signed by: ' + addendum.signerName, {
                    x: this.margin,
                    y: yPosition,
                    size: this.bodyFontSize - 1,
                    font: regularFont,
                    color: rgb(0.4, 0.4, 0.4)
                });
                yPosition -= this.lineHeight + 5;
            }
            
            // Add addendum content
            if (addendum.content) {
                const formattedContent = this.parseHTMLWithFormatting(addendum.content);
                const textResult = await this.addFormattedTextWithBreaks(
                    pdfDoc,
                    currentPage,
                    formattedContent,
                    boldFont,
                    regularFont,
                    this.bodyFontSize,
                    this.margin + 10,
                    yPosition,
                    this.contentWidth - 10
                );
                yPosition = textResult.yPosition;
                currentPage = textResult.currentPage;
            }
        }
        
        return {
            yPosition,
            currentPage
        };
    }

    parseHTMLWithFormatting(html) {
        console.log('🔍 parseHTMLWithFormatting called with', html?.length || 0, 'characters');
        
        // Handle empty or null input
        if (!html || html.trim() === '') {
            return [{ text: '', bold: false, italic: false, underline: false }];
        }
        
        try {
            const result = [];
            
            if (typeof document !== 'undefined') {
                console.log('🔍 Creating temp div and parsing HTML...');
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                console.log('🔍 HTML parsed, starting text extraction...');
                
                this.extractFormattedText(tempDiv, result);
                
                return result.length > 0 ? result : [{ text: '', bold: false, italic: false, underline: false }];
            } else {
                // Fallback - convert to plain text
                const plainText = this.extractPlainTextWithBreaks(html);
                return [{ text: plainText, bold: false, italic: false, underline: false }];
            }
        } catch (error) {
            console.warn('Error parsing HTML with formatting:', error);
            const fallbackText = (html || '').replace(/<[^>]*>/g, '').trim();
            return [{ text: fallbackText, bold: false, italic: false, underline: false }];
        }
    }

    extractFormattedText(element, result, currentFormatting = { bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0, color: null }, listContext = { inList: false, listType: null, listIndex: 0, nestingLevel: 0 }, depth = 0) {
        // Safety guard: prevent infinite recursion
        if (depth > 100) {
            console.warn('⚠️ Maximum recursion depth reached in extractFormattedText');
            return;
        }
        
        // Safety guard: limit result array size to prevent memory issues
        if (result.length > 10000) {
            console.warn('⚠️ Maximum result segments reached in extractFormattedText');
            return;
        }
        
        // Emergency safety: ensure element has childNodes
        if (!element || !element.childNodes || element.childNodes.length === 0) {
            return;
        }
        
        // Emergency safety: limit iterations to prevent infinite loops
        let iterationCount = 0;
        const MAX_ITERATIONS = 1000;
        
        for (const node of element.childNodes) {
            iterationCount++;
            if (iterationCount > MAX_ITERATIONS) {
                console.warn('⚠️ Maximum iterations reached in extractFormattedText loop, stopping to prevent freeze');
                break;
            }
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                if (text.trim()) {
                    // Check if this text is a sub-header within content (e.g., "LUNGS:", "HEART:", "LIVER:", "Lungs:")
                    // Matches patterns like: "LUNGS:", "Heart:", "LEFT KIDNEY:", "Liver/Spleen:"
                    const trimmedText = text.trim();
                    const subHeaderPattern = /^([A-Za-z][A-Za-z\s\/]+):$/;
                    const isSubHeader = !currentFormatting.isHeading && subHeaderPattern.test(trimmedText) && trimmedText.length < 30;
                    
                    result.push({
                        text: text,
                        bold: currentFormatting.bold,
                        italic: currentFormatting.italic,
                        underline: currentFormatting.underline,
                        isHeading: currentFormatting.isHeading,
                        headingLevel: currentFormatting.headingLevel,
                        isMajorSection: currentFormatting.isMajorSection || false,
                        isSubHeader: isSubHeader,
                        inListItem: listContext.inListItem,
                        colorHex: currentFormatting.color || null
                    });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                let newFormatting = { ...currentFormatting };
                let newListContext = { ...listContext };
                
                // Check for list tags
                if (tagName === 'ul' || tagName === 'ol') {
                    // If we're already in a list, this is a nested list - add line break before it
                    if (listContext.inList) {
                        result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0 });
                    } else if (result.length > 0) {
                        // Add spacing before top-level lists (prevents overlap with section headings like "IMPRESSION:")
                        result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0, isSpacerBeforeList: true });
                    }
                    
                    newListContext.inList = true;
                    newListContext.listType = tagName;
                    newListContext.listIndex = 0;
                    // Increment nesting level for nested lists
                    newListContext.nestingLevel = listContext.inList ? listContext.nestingLevel + 1 : 0;
                }
                // Check for list items
                else if (tagName === 'li') {
                    if (listContext.inList) {
                        // Increment list index BEFORE creating the segment so it persists
                        listContext.listIndex = listContext.listIndex + 1;
                        
                        // Add bullet or number prefix with isListItem marker and nesting level
                        if (listContext.listType === 'ul') {
                            // Different bullet symbols for different nesting levels (professional document style)
                            let bulletSymbol;
                            if (listContext.nestingLevel === 0) {
                                bulletSymbol = '• ';  // Bullet (U+2022) for parent level
                            } else if (listContext.nestingLevel === 1) {
                                bulletSymbol = '○ ';  // White circle (U+25CB) for first sub-level
                            } else {
                                bulletSymbol = '▪ ';  // Black small square (U+25AA) for deeper levels
                            }
                            
                            result.push({ 
                                text: bulletSymbol, 
                                bold: false, 
                                italic: false, 
                                underline: false, 
                                isHeading: false, 
                                headingLevel: 0, 
                                isListItemBullet: true,
                                listNestingLevel: listContext.nestingLevel 
                            });
                        } else if (listContext.listType === 'ol') {
                            // Determine numbering style based on nesting level
                            let numberText;
                            if (listContext.nestingLevel === 0) {
                                // Parent level: 1, 2, 3...
                                numberText = `${listContext.listIndex}. `;
                            } else if (listContext.nestingLevel === 1) {
                                // First sub-level: a, b, c...
                                numberText = `${this.numberToLetter(listContext.listIndex)}. `;
                            } else {
                                // Deeper levels: i, ii, iii...
                                numberText = `${this.numberToRoman(listContext.listIndex)}. `;
                            }
                            
                            result.push({ 
                                text: numberText, 
                                bold: false, 
                                italic: false, 
                                underline: false, 
                                isHeading: false, 
                                headingLevel: 0, 
                                isListItemBullet: true,
                                listNestingLevel: listContext.nestingLevel 
                            });
                        }
                    }
                    newListContext.inListItem = true;
                    newListContext.listIndex = listContext.listIndex; // Carry forward the updated index
                }
                // Check for heading tags
                else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                    const headingLevel = parseInt(tagName.substring(1));
                    newFormatting.bold = true; // Headings are bold
                    newFormatting.isHeading = true;
                    newFormatting.headingLevel = headingLevel;
                    
                    // Check if this is a major section header (COMPARISON, TECHNIQUE, FINDINGS, IMPRESSION, RECOMMENDATIONS)
                    const headingText = node.textContent?.trim().toUpperCase() || '';
                    const majorSections = ['COMPARISON', 'TECHNIQUE', 'FINDINGS', 'IMPRESSION', 'RECOMMENDATIONS'];
                    const isMajorSection = majorSections.some(section => 
                        headingText.startsWith(section) || headingText === section + ':'
                    );
                    newFormatting.isMajorSection = isMajorSection;
                    
                    // Add spacing before heading (except first element) - use major section spacing if applicable
                    // Check if there's already spacing before this heading (from empty paragraphs in saved reports)
                    if (result.length > 0) {
                        // Look back to find recent spacers (could be multiple from empty paragraphs)
                        // and consolidate them into a single major section spacer
                        let spacerFoundIndex = -1;
                        for (let i = result.length - 1; i >= 0 && i >= result.length - 4; i--) {
                            const seg = result[i];
                            if (seg.text === '\n' && (seg.isSpacerAfterParagraph || seg.isSpacerBeforeMajorSection || !seg.text.trim())) {
                                spacerFoundIndex = i;
                            } else if (seg.text && seg.text.trim()) {
                                // Found actual content, stop looking
                                break;
                            }
                        }
                        
                        if (isMajorSection) {
                            if (spacerFoundIndex >= 0) {
                                // Remove extra spacers and keep just one for major section
                                while (result.length > spacerFoundIndex + 1 && result[result.length - 1].text === '\n') {
                                    result.pop();
                                }
                                // Convert the remaining spacer to major section spacing
                                result[spacerFoundIndex].isSpacerBeforeMajorSection = true;
                                result[spacerFoundIndex].isSpacerAfterParagraph = false;
                            } else {
                                result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0, isSpacerBeforeMajorSection: true });
                            }
                        } else if (spacerFoundIndex < 0) {
                            result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0, isSpacerBeforeHeading: true });
                        }
                    }
                }
                // Check for other formatting tags
                else if (tagName === 'b' || tagName === 'strong') {
                    newFormatting.bold = true;
                } else if (tagName === 'i' || tagName === 'em') {
                    newFormatting.italic = true;
                } else if (tagName === 'u') {
                    newFormatting.underline = true;
                } else if (tagName === 'span') {
                    // Check for inline color style (from TipTap Color extension)
                    const style = node.getAttribute('style') || '';
                    const colorMatch = style.match(/color:\s*([#\w]+)/i);
                    if (colorMatch && colorMatch[1]) {
                        newFormatting.color = colorMatch[1];
                    }
                } else if (tagName === 'table') {
                    // Parse table into structured data for PDF rendering
                    const tableData = this.parseTableElement(node);
                    if (tableData.rows.length > 0) {
                        result.push({
                            isTable: true,
                            tableData: tableData,
                            bold: false,
                            italic: false,
                            underline: false
                        });
                    }
                    continue; // Skip to next sibling - table is already fully parsed
                } else if (['p', 'div', 'br'].includes(tagName)) {
                    // Skip empty paragraphs entirely (spacer paragraphs between sections)
                    // These are <p></p>, <p><br></p>, <p>&nbsp;</p>, etc.
                    const paragraphText = (node.textContent || '').trim();
                    const isEmptyParagraph = ['p', 'div'].includes(tagName) && 
                        (paragraphText === '' || paragraphText === '\u00A0'); // Empty or just &nbsp;
                    
                    if (isEmptyParagraph) {
                        // Skip empty paragraphs - section spacing is handled by sectionSpacing setting
                        continue;
                    }
                    
                    // Add line break for block elements UNLESS we're inside a list item
                    // (TipTap wraps list content in <p> tags, we don't want extra breaks)
                    if (!listContext.inListItem) {
                        result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0 });
                    }
                }
                
                // Recursively process child nodes
                this.extractFormattedText(node, result, newFormatting, newListContext, depth + 1);
                
                // Add line break after block elements - matches editor margin-bottom: 0.75em
                // Note: 'li' items get a simple newline, not extra paragraph spacing
                // Skip paragraph spacing for <p> tags inside list items
                // Also skip if this was an empty paragraph (already skipped above via continue)
                const paragraphTextAfter = (node.textContent || '').trim();
                const isEmptyParagraphAfter = ['p', 'div'].includes(tagName) && 
                    (paragraphTextAfter === '' || paragraphTextAfter === '\u00A0');
                    
                if (['p', 'div'].includes(tagName) && !listContext.inListItem && !isEmptyParagraphAfter) {
                    result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0, isSpacerAfterParagraph: true });
                } else if (tagName === 'li') {
                    result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0, isListItemEnd: true });
                }
                // Add minimal spacing after headings - matches editor margin-bottom: 0.25em
                else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
                    result.push({ text: '\n', bold: false, italic: false, underline: false, isHeading: false, headingLevel: 0, isSpacerAfterHeading: true });
                }
            }
        }
    }

    extractPlainTextWithBreaks(html) {
        // Fallback method - used when DOM is not available
        if (!html || html.trim() === '') {
            return '';
        }
        
        try {
            let cleanText = html
                .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<li[^>]*>/gi, '• ')
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            
            // Normalize spacing while preserving paragraph structure
            cleanText = cleanText
                .replace(/\r\n/g, '\n')     // Normalize line endings
                .replace(/\r/g, '\n')       // Mac line endings
                .replace(/\t/g, ' ')        // Tabs to spaces
                .replace(/[ \u00A0]+/g, ' ') // Multiple spaces and non-breaking spaces
                .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
                .trim();
                
            return cleanText;
        } catch (error) {
            console.warn('Error extracting text with breaks:', error);
            return (html || '').replace(/<[^>]*>/g, '').replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
        }
    }

    parseTableElement(tableElement) {
        const rows = [];
        const tableRows = tableElement.querySelectorAll('tr');
        
        for (const tr of tableRows) {
            const cells = [];
            const cellElements = tr.querySelectorAll('th, td');
            
            for (const cell of cellElements) {
                // Parse cell content with formatting preserved
                const formattedContent = this.parseCellContent(cell);
                
                cells.push({
                    formattedContent: formattedContent,
                    text: cell.textContent?.trim() || '', // Fallback plain text
                    isHeader: false,
                    colspan: parseInt(cell.getAttribute('colspan') || '1', 10),
                    rowspan: parseInt(cell.getAttribute('rowspan') || '1', 10)
                });
            }
            
            if (cells.length > 0) {
                rows.push(cells);
            }
        }
        
        // Calculate column count (max cells in any row, accounting for colspan)
        let colCount = 0;
        for (const row of rows) {
            let rowColCount = 0;
            for (const cell of row) {
                rowColCount += cell.colspan;
            }
            colCount = Math.max(colCount, rowColCount);
        }
        
        return { rows, colCount };
    }
    
    parseCellContent(cellElement) {
        const segments = [];
        
        const processNode = (node, isBold = false, isItalic = false, textColor = null, listPrefix = null) => {
            if (node.nodeType === 3) { // Text node
                const text = node.textContent;
                if (text && text.trim()) {
                    segments.push({
                        text: listPrefix ? `${listPrefix} ${text}` : text,
                        bold: isBold,
                        italic: isItalic,
                        color: textColor
                    });
                }
                return;
            }
            
            if (node.nodeType !== 1) return;
            
            const tagName = node.tagName?.toLowerCase();
            
            // Check for color in style
            let nodeColor = textColor;
            const styleAttr = node.getAttribute?.('style') || '';
            const colorMatch = styleAttr.match(/color:\s*([^;]+)/i);
            if (colorMatch) {
                nodeColor = colorMatch[1].trim();
            }
            
            // Determine formatting
            const nodeBold = isBold || tagName === 'strong' || tagName === 'b';
            const nodeItalic = isItalic || tagName === 'em' || tagName === 'i';
            
            // Handle lists
            if (tagName === 'ol' || tagName === 'ul') {
                const isOrdered = tagName === 'ol';
                const listItems = node.querySelectorAll(':scope > li');
                listItems.forEach((li, index) => {
                    const prefix = isOrdered ? `${index + 1}.` : '•';
                    // Process li children with prefix for first text
                    let prefixUsed = false;
                    for (const child of li.childNodes) {
                        if (!prefixUsed && child.nodeType === 3 && child.textContent?.trim()) {
                            processNode(child, nodeBold, nodeItalic, nodeColor, prefix);
                            prefixUsed = true;
                        } else if (!prefixUsed && child.nodeType === 1) {
                            // Check if this element has text
                            const firstText = child.textContent?.trim();
                            if (firstText) {
                                // Process with prefix
                                if (child.nodeType === 3) {
                                    processNode(child, nodeBold, nodeItalic, nodeColor, prefix);
                                } else {
                                    // Add prefix as separate segment then process element
                                    segments.push({ text: prefix + ' ', bold: nodeBold, italic: nodeItalic, color: nodeColor });
                                    processNode(child, nodeBold, nodeItalic, nodeColor, null);
                                }
                                prefixUsed = true;
                            }
                        } else {
                            processNode(child, nodeBold, nodeItalic, nodeColor, null);
                        }
                    }
                    // Add line break after list item if not last
                    if (index < listItems.length - 1) {
                        segments.push({ text: '\n', bold: false, italic: false, color: null });
                    }
                });
                return;
            }
            
            // Process children
            for (const child of node.childNodes) {
                processNode(child, nodeBold, nodeItalic, nodeColor, listPrefix);
                listPrefix = null; // Only apply prefix to first text
            }
        };
        
        processNode(cellElement);
        
        return segments;
    }

    async renderTable(pdfDoc, currentPage, tableData, startX, startY, maxWidth, font, boldFont, fontSize) {
        const { rows, colCount } = tableData;
        if (rows.length === 0 || colCount === 0) {
            return { yPosition: startY, currentPage };
        }
        
        const cellPadding = 4;
        const lineHeight = fontSize + 2;
        const colWidth = Math.floor(maxWidth / colCount);
        const borderColor = this.hexToRgbColor('#475569');
        const defaultColor = this.hexToRgbColor('#000000');
        
        let currentY = startY;
        let page = currentPage;
        
        for (const row of rows) {
            // Calculate row height based on content (check for multi-line cells)
            let maxLines = 1;
            for (const cell of row) {
                if (cell.formattedContent && cell.formattedContent.length > 0) {
                    // Count newlines in content
                    let lineCount = 1;
                    for (const seg of cell.formattedContent) {
                        if (seg.text.includes('\n')) {
                            lineCount += (seg.text.match(/\n/g) || []).length;
                        }
                    }
                    maxLines = Math.max(maxLines, lineCount);
                }
            }
            const cellHeight = lineHeight * maxLines + cellPadding * 2;
            
            // Check if we need a new page
            if (currentY - cellHeight < this.margin + 60) {
                page = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                currentY = this.pageHeight - this.margin;
            }
            
            let cellX = startX;
            for (let i = 0; i < row.length; i++) {
                const cell = row[i];
                const actualWidth = colWidth * cell.colspan;
                
                // Draw cell border
                page.drawRectangle({
                    x: cellX,
                    y: currentY - cellHeight,
                    width: actualWidth,
                    height: cellHeight,
                    borderColor: borderColor,
                    borderWidth: 0.5
                });
                
                // Render formatted content
                const maxTextWidth = actualWidth - cellPadding * 2;
                let textX = cellX + cellPadding;
                let textY = currentY - cellPadding - fontSize;
                
                if (cell.formattedContent && cell.formattedContent.length > 0) {
                    for (const segment of cell.formattedContent) {
                        if (segment.text === '\n') {
                            // Move to next line
                            textY -= lineHeight;
                            textX = cellX + cellPadding;
                            continue;
                        }
                        
                        const segmentFont = segment.bold ? boldFont : font;
                        const segmentColor = segment.color ? this.hexToRgbColor(segment.color) : defaultColor;
                        
                        // Handle text that may contain newlines
                        const lines = segment.text.split('\n');
                        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                            let displayText = lines[lineIdx];
                            
                            // Truncate if too long
                            while (segmentFont.widthOfTextAtSize(displayText, fontSize) > maxTextWidth && displayText.length > 0) {
                                displayText = displayText.slice(0, -1);
                            }
                            if (displayText !== lines[lineIdx] && displayText.length > 3) {
                                displayText = displayText.slice(0, -3) + '...';
                            }
                            
                            if (displayText.trim()) {
                                page.drawText(displayText, {
                                    x: textX,
                                    y: textY,
                                    size: fontSize,
                                    font: segmentFont,
                                    color: segmentColor
                                });
                                // Advance X position for next inline segment
                                textX += segmentFont.widthOfTextAtSize(displayText, fontSize);
                            }
                            
                            // Move to next line if there are more
                            if (lineIdx < lines.length - 1) {
                                textY -= lineHeight;
                                textX = cellX + cellPadding;
                            }
                        }
                    }
                } else {
                    // Fallback to plain text
                    let displayText = cell.text;
                    while (font.widthOfTextAtSize(displayText, fontSize) > maxTextWidth && displayText.length > 0) {
                        displayText = displayText.slice(0, -1);
                    }
                    if (displayText !== cell.text && displayText.length > 3) {
                        displayText = displayText.slice(0, -3) + '...';
                    }
                    
                    page.drawText(displayText, {
                        x: textX,
                        y: textY,
                        size: fontSize,
                        font: font,
                        color: defaultColor
                    });
                }
                
                cellX += actualWidth;
            }
            
            currentY -= cellHeight;
        }
        
        // Add spacing after table
        currentY -= fontSize;
        
        return { yPosition: currentY, currentPage: page };
    }
    
    async addFormattedTextWithBreaks(pdfDoc, currentPage, formattedSegments, boldFont, regularFont, fontSize, startX, startY, maxWidth) {
        console.log('📄 Rendering', formattedSegments.length, 'segments to PDF...');
        let currentX = startX;
        let currentY = startY;
        let currentPage_internal = currentPage;
        let inListItem = false;
        let currentNestingLevel = 0; // Track current list nesting level
        // Professional list indentation: 0.25-0.5 inch (18-36pt at 72 DPI)
        const listIndent = 18; // ~0.25 inch indent for list items
        const hangingIndent = 18; // Additional indent for wrapped lines (hanging indent)
        const nestedListIndent = 18; // Additional indent per nesting level
        
        // Emergency safety: global iteration counter to prevent infinite loops
        let totalIterations = 0;
        const MAX_TOTAL_ITERATIONS = 50000;
        
        // Safety guard: limit segments to prevent infinite loops
        const maxSegments = Math.min(formattedSegments.length, 10000);
        if (formattedSegments.length > maxSegments) {
            console.warn(`Truncating ${formattedSegments.length} segments to ${maxSegments} for safety`);
        }
        
        for (let segmentIndex = 0; segmentIndex < maxSegments; segmentIndex++) {
            totalIterations++;
            if (totalIterations > MAX_TOTAL_ITERATIONS) {
                console.error('⚠️ EMERGENCY STOP: Maximum total iterations reached, stopping PDF generation to prevent freeze');
                break;
            }
            const segment = formattedSegments[segmentIndex];
            
            // Handle table segments
            if (segment.isTable && segment.tableData) {
                const tableResult = await this.renderTable(
                    pdfDoc,
                    currentPage_internal,
                    segment.tableData,
                    startX,
                    currentY,
                    maxWidth,
                    regularFont,
                    boldFont,
                    fontSize - 1 // Slightly smaller font for tables
                );
                currentY = tableResult.yPosition;
                currentPage_internal = tableResult.currentPage;
                currentX = startX;
                continue;
            }
            
            if (!segment.text) continue;
            
            // Track if we're entering/exiting a list item
            if (segment.isListItemBullet) {
                inListItem = true;
                currentNestingLevel = segment.listNestingLevel || 0;
            }
            if (segment.isListItemEnd) {
                inListItem = false;
                currentNestingLevel = 0;
            }
            
            // Handle sub-headers within content (e.g., "LUNGS:", "HEART:", "LIVER:")
            // Add spacing before sub-headers for visual separation
            if (segment.isSubHeader && currentX === startX) {
                // Add space before sub-header (10-12pt)
                currentY -= this.subHeaderSpacing || 12;
            }
            
            // Determine font size based on heading level and section type
            let segmentFontSize = fontSize;
            if (segment.isHeading) {
                if (segment.isMajorSection) {
                    // Major sections: 13-14pt bold uppercase (per professional guidelines)
                    segmentFontSize = this.headerFontSize;
                } else {
                    // Scale font size based on heading level (h1 biggest, h6 smallest)
                    switch (segment.headingLevel) {
                        case 1: segmentFontSize = fontSize + 6; break; // h1: +6
                        case 2: segmentFontSize = fontSize + 4; break; // h2: +4
                        case 3: segmentFontSize = fontSize + 2; break; // h3: +2
                        case 4: segmentFontSize = fontSize + 1; break; // h4: +1
                        default: segmentFontSize = fontSize; break; // h5, h6
                    }
                }
            } else if (segment.isSubHeader) {
                // Sub-headers within findings: slightly larger (11.5-12.5pt)
                segmentFontSize = fontSize + 1;
            }
            
            // Choose font based on formatting (supports bold, italic, and bold+italic)
            let font = regularFont;
            const isBold = segment.bold || segment.isHeading || segment.isSubHeader;
            const isItalic = segment.italic;
            
            if (isBold && isItalic) {
                font = this.boldItalicFont;
            } else if (isBold) {
                font = this.boldFont;
            } else if (isItalic) {
                font = this.italicFont;
            } else {
                font = this.regularFont;
            }
            
            // Handle line breaks with context-appropriate spacing
            if (segment.text === '\n') {
                // Professional medical report spacing - hierarchical and clean
                if (segment.isSpacerBeforeMajorSection) {
                    // Major section spacing (COMPARISON, TECHNIQUE, FINDINGS, IMPRESSION, RECOMMENDATIONS)
                    // 28-32pt space for clear visual separation between major report sections
                    currentY -= this.sectionSpacing || 28;
                } else if (segment.isSpacerAfterHeading) {
                    // Minimal space after section headers (12-14pt margin-bottom)
                    currentY -= this.lineHeight * 0.75;
                } else if (segment.isSpacerAfterParagraph) {
                    // Standard paragraph spacing - professional, not excessive
                    currentY -= this.lineHeight * 0.5;
                } else if (segment.isSpacerBeforeHeading) {
                    // Space before non-major section headers
                    currentY -= this.subHeaderSpacing || 12;
                } else if (segment.isListItemEnd) {
                    // List items - tight spacing (6-8pt between items)
                    currentY -= this.lineHeight * 0.5;
                } else {
                    // Normal line spacing
                    currentY -= this.lineHeight;
                }
                
                // Reset X position based on list context and nesting level
                if (inListItem) {
                    const nestingIndent = currentNestingLevel * nestedListIndent;
                    currentX = startX + listIndent + nestingIndent; // Indent for list items
                } else {
                    currentX = startX;
                }
                
                // Check if we need a new page
                if (currentY < 100) {
                    currentPage_internal = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                    currentY = await this.addContinuationPageHeader(currentPage_internal);
                    const nestingIndent = currentNestingLevel * nestedListIndent;
                    currentX = inListItem ? (startX + listIndent + nestingIndent) : startX;
                }
                continue;
            }
            
            // Apply list indentation for bullet/number - draw inline with text
            // Add extra indentation for nested lists (20px per nesting level)
            if (segment.isListItemBullet) {
                const nestingIndent = (segment.listNestingLevel || 0) * nestedListIndent;
                currentX = startX + listIndent + nestingIndent;
            }
            
            // Clean text for PDF encoding but preserve word structure
            const cleanText = this.normalizeForWinAnsi(segment.text);
            
            // Check if this segment contains internal line breaks that need to be processed
            if (cleanText.includes('\n')) {
                // Split by line breaks and process each line separately
                const lines = cleanText.split('\n');
                for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                    const line = lines[lineIndex].trim();
                    
                    if (line) {
                        // Process this line as words
                        const words = line.split(' ').filter(word => word.trim().length > 0);
                        
                        for (let i = 0; i < words.length; i++) {
                            totalIterations++;
                            if (totalIterations > MAX_TOTAL_ITERATIONS) {
                                console.error('⚠️ EMERGENCY STOP: Iteration limit in word loop 1');
                                break;
                            }
                            
                            const word = words[i];
                            // Skip empty or whitespace-only words
                            if (!word || word.trim().length === 0) {
                                console.log('⚠️ Skipping empty word at index', i);
                                continue;
                            }
                            
                            let wordWidth;
                            try {
                                wordWidth = font.widthOfTextAtSize(word + ' ', segmentFontSize);
                                if (!isFinite(wordWidth) || wordWidth < 0) {
                                    console.warn('Invalid wordWidth:', wordWidth, 'for word:', word);
                                    wordWidth = 50; // Fallback width
                                }
                            } catch (err) {
                                console.error('Error calculating word width:', err, 'for word:', word);
                                // Skip this word entirely if width calculation fails
                                continue;
                            }
                            
                            // Check if word fits on current line
                            if (currentX + wordWidth > startX + maxWidth) {
                                // Wrap to next line
                                currentY -= this.lineHeight;
                                // Apply hanging indent for list items with nesting
                                if (inListItem) {
                                    const nestingIndent = currentNestingLevel * nestedListIndent;
                                    currentX = startX + listIndent + nestingIndent + hangingIndent;
                                } else {
                                    currentX = startX;
                                }
                                
                                // Check if we need a new page
                                if (currentY < 100) {
                                    currentPage_internal = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                                    currentY = await this.addContinuationPageHeader(currentPage_internal);
                                    const nestingIndent = currentNestingLevel * nestedListIndent;
                                    currentX = inListItem ? (startX + listIndent + nestingIndent + hangingIndent) : startX;
                                }
                            }
                            
                            // Draw the word with appropriate color
                            const textColor = segment.colorHex ? this.hexToRgbColor(segment.colorHex) : rgb(0, 0, 0);
                            currentPage_internal.drawText(word, {
                                x: currentX,
                                y: currentY,
                                size: segmentFontSize,
                                font: font,
                                color: textColor
                            });
                            
                            currentX += wordWidth;
                        }
                    }
                    
                    // Add line break after each line (except the last one)
                    if (lineIndex < lines.length - 1) {
                        currentY -= this.lineHeight;
                        currentX = startX;
                        
                        // Check if we need a new page
                        if (currentY < 100) {
                            currentPage_internal = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                            currentY = await this.addContinuationPageHeader(currentPage_internal);
                            currentX = startX;
                        }
                    }
                }
                continue;
            }
            
            // Process as normal text without internal line breaks
            const words = cleanText.split(' ').filter(word => word.trim().length > 0);
            
            for (let i = 0; i < words.length; i++) {
                totalIterations++;
                if (totalIterations > MAX_TOTAL_ITERATIONS) {
                    console.error('⚠️ EMERGENCY STOP: Iteration limit in word loop 2');
                    break;
                }
                
                const word = words[i];
                // Skip empty or whitespace-only words
                if (!word || word.trim().length === 0) {
                    console.log('⚠️ Skipping empty word at index', i);
                    continue;
                }
                
                let wordWidth;
                try {
                    wordWidth = font.widthOfTextAtSize(word + ' ', segmentFontSize);
                    if (!isFinite(wordWidth) || wordWidth < 0) {
                        console.warn('Invalid wordWidth:', wordWidth, 'for word:', word);
                        wordWidth = 50; // Fallback width
                    }
                } catch (err) {
                    console.error('Error calculating word width:', err, 'for word:', word);
                    // Skip this word entirely if width calculation fails
                    continue;
                }
                
                // Check if word fits on current line
                if (currentX + wordWidth > startX + maxWidth) {
                    // Wrap to next line
                    currentY -= this.lineHeight;
                    // Apply hanging indent for list items with nesting
                    if (inListItem) {
                        const nestingIndent = currentNestingLevel * nestedListIndent;
                        currentX = startX + listIndent + nestingIndent + hangingIndent;
                    } else {
                        currentX = startX;
                    }
                    
                    // Check if we need a new page
                    if (currentY < 100) {
                        currentPage_internal = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                        currentY = await this.addContinuationPageHeader(currentPage_internal);
                        const nestingIndent = currentNestingLevel * nestedListIndent;
                        currentX = inListItem ? (startX + listIndent + nestingIndent + hangingIndent) : startX;
                    }
                }
                
                // Draw the word with appropriate color (ensure it's WinAnsi compatible)
                const textColor = segment.colorHex ? this.hexToRgbColor(segment.colorHex) : rgb(0, 0, 0);
                currentPage_internal.drawText(word, {
                    x: currentX,
                    y: currentY,
                    size: segmentFontSize,
                    font: font,
                    color: textColor
                });
                
                currentX += wordWidth;
                
                // Add space after word (except for last word)
                if (i < words.length - 1) {
                    const spaceWidth = font.widthOfTextAtSize(' ', segmentFontSize);
                    currentX += spaceWidth;
                }
            }
        }
        
        return {
            yPosition: currentY,
            currentPage: currentPage_internal
        };
    }

    // Helper: Convert number to lowercase letter (1=a, 2=b, etc.)
    numberToLetter(num) {
        return String.fromCharCode(96 + num); // 97 is 'a'
    }
    
    // Helper: Convert number to lowercase Roman numerals
    numberToRoman(num) {
        const romanMap = [
            [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
        ];
        let result = '';
        for (const [value, letter] of romanMap) {
            while (num >= value) {
                result += letter;
                num -= value;
            }
        }
        return result;
    }
    
    normalizeForWinAnsi(text) {
        // Unicode normalization for TrueType fonts (DejaVu Sans supports full Unicode)
        // We can now keep actual bullet symbols and special characters!
        // Keep bullets (•), dashes (–, —), ellipsis (…) - DejaVu Sans supports them!
        return text
            .replace(/[""]/g, '"')       // Smart quotes to regular quotes
            .replace(/['']/g, "'");      // Smart apostrophes to regular apostrophes
    }

    async addWrappedTextPreservingBreaks(currentPage, text, font, fontSize, x, startY, maxWidth, pdfDoc) {
        if (!text || text.trim() === '') {
            return { yPosition: startY, currentPage };
        }

        // Split text by newlines to preserve paragraph structure
        const lines = text.split('\n');
        let yPosition = startY;
        let page = currentPage;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // If line is empty, add paragraph spacing
            if (line === '') {
                yPosition -= this.lineHeight;
                continue;
            }
            
            // Normalize text for WinAnsi encoding
            const normalizedLine = this.normalizeForWinAnsi(line);
            
            // Word wrap this line
            const words = normalizedLine.split(' ').filter(word => word.length > 0);
            let currentLine = '';
            
            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const textWidth = font.widthOfTextAtSize(testLine, fontSize);
                
                if (textWidth > maxWidth && currentLine) {
                    // Draw current line
                    page.drawText(currentLine, {
                        x,
                        y: yPosition,
                        size: fontSize,
                        font,
                        color: rgb(0, 0, 0)
                    });
                    currentLine = word;
                    yPosition -= this.lineHeight;
                    
                    // Check if we need a new page
                    if (yPosition < 100) {
                        page = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                        yPosition = await this.addContinuationPageHeader(page);
                    }
                } else {
                    currentLine = testLine;
                }
            }
            
            // Draw final line of this paragraph
            if (currentLine) {
                page.drawText(currentLine, {
                    x,
                    y: yPosition,
                    size: fontSize,
                    font,
                    color: rgb(0, 0, 0)
                });
                yPosition -= this.lineHeight;
                
                // Check if we need a new page
                if (yPosition < 100) {
                    page = pdfDoc.addPage([this.pageWidth, this.pageHeight]);
                    yPosition = await this.addContinuationPageHeader(page);
                }
            }
            
            // Add extra spacing after paragraphs (when next line is empty or we're at the end)
            if (i < lines.length - 1 && lines[i + 1].trim() === '') {
                yPosition -= this.lineHeight * 0.5; // Half line spacing
            }
        }
        
        return { yPosition, currentPage: page };
    }

    async addLetterhead(page, letterhead, settings, yPosition, pdfDoc) {
        if (!letterhead || !letterhead.url) {
            return yPosition;
        }

        try {
            // Load image data
            const imageData = await LetterheadService.loadImageForPDF(letterhead.url);
            if (!imageData) {
                console.warn('Failed to load letterhead image');
                return yPosition;
            }

            // Calculate dimensions
            const dimensions = LetterheadService.calculateLetterheadSize(settings, this.pageWidth);
            
            // Embed image in PDF (only PNG/JPEG supported)
            let embeddedImage;
            try {
                if (imageData.format === 'png') {
                    embeddedImage = await pdfDoc.embedPng(imageData.bytes);
                } else if (imageData.format === 'jpg') {
                    embeddedImage = await pdfDoc.embedJpg(imageData.bytes);
                } else {
                    console.warn('Unsupported image format for PDF:', imageData.format);
                    return yPosition;
                }
            } catch (embedError) {
                console.warn('Failed to embed letterhead image:', embedError);
                return yPosition;
            }

            // Calculate image scaling to fit within bounds
            const imageDims = embeddedImage.scale(1);
            const scaleWidth = dimensions.maxWidth / imageDims.width;
            const scaleHeight = dimensions.targetHeight / imageDims.height;
            const scale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up

            const finalWidth = imageDims.width * scale;
            const finalHeight = imageDims.height * scale;

            // Position image (centered horizontally)
            const imageX = (this.pageWidth - finalWidth) / 2;
            const imageY = yPosition - finalHeight;

            // Draw letterhead image
            page.drawImage(embeddedImage, {
                x: imageX,
                y: imageY,
                width: finalWidth,
                height: finalHeight,
                opacity: dimensions.opacity
            });

            // Adjust y position for content below letterhead
            return imageY - 20; // Add some spacing below letterhead

        } catch (error) {
            console.error('Error adding letterhead to PDF:', error);
            return yPosition; // Continue without letterhead
        }
    }

    async addLetterheadAtBottom(page, letterhead, settings, pdfDoc) {
        if (!letterhead || !letterhead.url) {
            return;
        }

        try {
            // Load image data
            const imageData = await LetterheadService.loadImageForPDF(letterhead.url);
            if (!imageData) {
                console.warn('Failed to load letterhead image for bottom placement');
                return;
            }

            // Calculate dimensions
            const dimensions = LetterheadService.calculateLetterheadSize(settings, this.pageWidth);
            
            // Embed image in PDF (only PNG/JPEG supported)
            let embeddedImage;
            try {
                if (imageData.format === 'png') {
                    embeddedImage = await pdfDoc.embedPng(imageData.bytes);
                } else if (imageData.format === 'jpg') {
                    embeddedImage = await pdfDoc.embedJpg(imageData.bytes);
                } else {
                    console.warn('Unsupported image format for bottom letterhead:', imageData.format);
                    return;
                }
            } catch (embedError) {
                console.warn('Failed to embed bottom letterhead image:', embedError);
                return;
            }

            // Calculate image scaling to fit within bounds
            const imageDims = embeddedImage.scale(1);
            const scaleWidth = dimensions.maxWidth / imageDims.width;
            const scaleHeight = dimensions.targetHeight / imageDims.height;
            const scale = Math.min(scaleWidth, scaleHeight, 1); // Don't scale up

            const finalWidth = imageDims.width * scale;
            const finalHeight = imageDims.height * scale;

            // Position image at bottom (centered horizontally), above footer area
            const imageX = (this.pageWidth - finalWidth) / 2;
            const footerHeight = 80; // Reserve space for footer content
            const imageY = dimensions.margin + footerHeight;

            // Draw letterhead image at bottom
            page.drawImage(embeddedImage, {
                x: imageX,
                y: imageY,
                width: finalWidth,
                height: finalHeight,
                opacity: dimensions.opacity
            });

        } catch (error) {
            console.error('Error adding bottom letterhead to PDF:', error);
        }
    }

    // Add condensed header for continuation pages
    async addContinuationPageHeader(page) {
        let yPosition = this.pageHeight - this.margin;
        
        // Add letterhead at top if position is 'top'
        if (this.currentLetterheadData?.currentLetterhead && this.currentLetterheadData.settings.position === 'top') {
            yPosition = this.pageHeight - (this.currentLetterheadData.settings.topMargin || 10);
            yPosition = await this.addLetterhead(page, this.currentLetterheadData.currentLetterhead, this.currentLetterheadData.settings, yPosition, this.pdfDoc);
        }
        
        // Add condensed patient info (single line)
        const patientInfo = this.currentPatientData;
        const patientSummary = `${(patientInfo.name || 'N/A').toUpperCase()} | ${patientInfo.age ? patientInfo.age + ' YRS' : 'N/A'} | ${(patientInfo.gender || 'N/A').toUpperCase()}`;
        
        page.drawText(patientSummary, {
            x: this.margin,
            y: yPosition,
            size: this.bodyFontSize - 1,
            font: this.boldFont,
            color: rgb(0.3, 0.3, 0.3)
        });
        
        // Add divider
        yPosition -= 8;
        page.drawLine({
            start: { x: this.margin, y: yPosition },
            end: { x: this.pageWidth - this.rightMargin, y: yPosition },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7)
        });
        
        return yPosition - 15; // Return position after header
    }

    // Add footers to all pages with correct page numbers
    async addFootersToAllPages(pdfDoc, regularFont, patientInfo) {
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;
        
        for (let i = 0; i < totalPages; i++) {
            await this.addFooterToPage(pdfDoc, pages[i], regularFont, patientInfo, i + 1, totalPages);
        }
    }

    async addFooterToPage(pdfDoc, page, regularFont, patientInfo, pageNumber, totalPages) {
        const currentDate = new Date().toLocaleString();
        const currentUserData = get(currentUser);
        const currentReportData = this.currentReportData || get(reportData);
        
        // Determine if dual signature layout is needed based on workflow data
        // Dual layout: when the report has both primary signer and reviewer (co-signature)
        const creatorInfo = currentReportData?.creatorInfo;
        const signerInfo = currentReportData?.signerInfo;
        const reviewerInfo = currentReportData?.reviewerInfo;
        const signedBy = currentReportData?.signedBy;
        const reviewedBy = currentReportData?.reviewedBy;
        const createdBy = currentReportData?.createdBy || creatorInfo?.id;
        
        // Normalize IDs to strings for reliable comparison (handles numeric, string, and UUID IDs)
        const normalizeId = (id) => id != null ? String(id).trim() : null;
        const signedByStr = normalizeId(signedBy);
        const createdByStr = normalizeId(createdBy);
        const reviewedByStr = normalizeId(reviewedBy);
        
        // Use dual signature layout when:
        // 1. Report was co-signed: resident signed first, then specialist reviewed (signedBy != reviewedBy)
        // 2. OR report was signed by different person than creator (specialist picked up resident's case)
        // Single signature when: same person created AND signed (specialist self-sign, or resident self-sign)
        
        const creatorInfoIdStr = normalizeId(creatorInfo?.id);
        const signerInfoIdStr = normalizeId(signerInfo?.id);
        const reviewerInfoIdStr = normalizeId(reviewerInfo?.id);
        
        // TRUE co-signature: resident signed first (signedBy), then specialist reviewed (reviewedBy)
        // Both must exist AND be DIFFERENT people
        const hasCoSignature = reviewedByStr && signedByStr && 
                               reviewedByStr !== signedByStr &&
                               signerInfo && reviewerInfo;
        
        // Different signer case: specialist signed a resident's report directly
        // createdBy != signedBy, and either no reviewer OR reviewer is the same as signer
        const hasDifferentSigner = signedByStr && createdByStr && 
                                   signedByStr !== createdByStr && 
                                   creatorInfo && signerInfo &&
                                   creatorInfoIdStr && signerInfoIdStr &&
                                   creatorInfoIdStr !== signerInfoIdStr &&
                                   (!reviewedByStr || reviewedByStr === signedByStr);
        
        const isDualSignature = hasCoSignature || hasDifferentSigner;
        
        // Debug logging for signature determination
        if (typeof console !== 'undefined') {
            console.log('PDF Signature Layout Debug:', {
                createdBy: createdByStr, 
                signedBy: signedByStr, 
                reviewedBy: reviewedByStr,
                creatorInfoId: creatorInfoIdStr,
                signerInfoId: signerInfoIdStr,
                reviewerInfoId: reviewerInfoIdStr,
                creatorInfoName: creatorInfo?.fullName,
                signerInfoName: signerInfo?.fullName,
                reviewerInfoName: reviewerInfo?.fullName,
                hasCoSignature, 
                hasDifferentSigner, 
                isDualSignature
            });
        }
        
        // Load signature from the appropriate user based on context
        let signatureUrl = null;
        let signingUserInfo = null;
        
        if (isDualSignature) {
            // In dual mode, the RIGHT side shows the reviewer/co-signer (specialist)
            if (hasCoSignature) {
                signingUserInfo = reviewerInfo;
                signatureUrl = reviewerInfo?.signatureUrl;
            } else {
                signingUserInfo = signerInfo;
                signatureUrl = signerInfo?.signatureUrl;
            }
        } else if (signerInfo) {
            // Single signer mode - use the signer's info
            signingUserInfo = signerInfo;
            signatureUrl = signerInfo?.signatureUrl;
        } else {
            // Fallback to current user (for unsigned reports or drafts)
            signingUserInfo = currentUserData;
            signatureUrl = currentUserData?.signatureUrl;
            if (!signatureUrl && typeof localStorage !== 'undefined') {
                signatureUrl = userStorageService.getItem('doctor_signature');
            }
        }
        
        // Clean footer approach - no dynamic signature positioning
        const footerY = 40;
        
        // Center - Page number (for multi-page support)
        const pageText = `Page ${pageNumber} of ${totalPages}`;
        const pageTextWidth = regularFont.widthOfTextAtSize(pageText, this.footerFontSize);
        page.drawText(pageText, {
            x: (this.pageWidth - pageTextWidth) / 2,
            y: footerY,
            size: this.footerFontSize,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5)
        });
        
        // DUAL SIGNATURE LAYOUT: Primary signer (left) and Reviewer/Co-signer (right)
        if (isDualSignature) {
            // Left side - Primary signer (Resident/Creator) signature section
            // In co-signature: signerInfo is the resident who signed first
            // In different-signer: creatorInfo is the original creator
            const leftSideInfo = hasCoSignature ? signerInfo : creatorInfo;
            const leftSideName = leftSideInfo?.fullName || 'Report Creator';
            const leftSideDesignation = leftSideInfo?.designation || 'Resident';
            const leftSideSignatureUrl = leftSideInfo?.signatureUrl;
            
            const leftX = this.margin;
            const leftNameY = footerY + 3;
            const leftDesignationY = footerY - 9;
            
            // Draw left side signature if available
            if (leftSideSignatureUrl) {
                try {
                    const base64Data = leftSideSignatureUrl.split(',')[1];
                    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    
                    let leftSigImage;
                    if (leftSideSignatureUrl.includes('data:image/png')) {
                        leftSigImage = await pdfDoc.embedPng(imageBytes);
                    } else {
                        leftSigImage = await pdfDoc.embedJpg(imageBytes);
                    }
                    
                    const maxSigWidth = 70;
                    const maxSigHeight = 25;
                    const { width: origW, height: origH } = leftSigImage.scale(1);
                    let sigWidth = maxSigWidth;
                    let sigHeight = (origH / origW) * sigWidth;
                    if (sigHeight > maxSigHeight) {
                        sigHeight = maxSigHeight;
                        sigWidth = (origW / origH) * sigHeight;
                    }
                    
                    page.drawImage(leftSigImage, {
                        x: leftX,
                        y: footerY + 20,
                        width: sigWidth,
                        height: sigHeight,
                    });
                } catch (e) {
                    console.warn('Could not embed left side signature:', e);
                }
            }
            
            // Left side name (below the line)
            page.drawText(leftSideName, {
                x: leftX,
                y: leftNameY,
                size: this.footerFontSize + 1,
                font: regularFont,
                color: rgb(0.3, 0.3, 0.3)
            });
            
            // Left side designation (below name)
            page.drawText(`(${leftSideDesignation})`, {
                x: leftX,
                y: leftDesignationY,
                size: this.footerFontSize,
                font: regularFont,
                color: rgb(0.5, 0.5, 0.5)
            });
        } else {
            // Left side - Generated info (single signature mode)
            page.drawText(`Generated: ${currentDate}`, {
                x: this.margin,
                y: footerY,
                size: this.footerFontSize,
                font: regularFont,
                color: rgb(0.5, 0.5, 0.5)
            });
        }
        
        // Right side - Doctor's signature and name (replaces "KrisPoint Radiology System")
        if (signatureUrl) {
            try {
                // Add signature image in footer
                const base64Data = signatureUrl.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                
                let signatureImage;
                if (signatureUrl.includes('data:image/png')) {
                    signatureImage = await pdfDoc.embedPng(imageBytes);
                } else if (signatureUrl.includes('data:image/jpg') || signatureUrl.includes('data:image/jpeg')) {
                    signatureImage = await pdfDoc.embedJpg(imageBytes);
                } else {
                    signatureImage = await pdfDoc.embedPng(imageBytes);
                }
                
                // Larger signature size for better visibility
                const maxFooterSignatureWidth = 80;
                const maxFooterSignatureHeight = 30;
                const { width: originalWidth, height: originalHeight } = signatureImage.scale(1);
                
                let signatureWidth = maxFooterSignatureWidth;
                let signatureHeight = (originalHeight / originalWidth) * signatureWidth;
                
                if (signatureHeight > maxFooterSignatureHeight) {
                    signatureHeight = maxFooterSignatureHeight;
                    signatureWidth = (originalWidth / originalHeight) * signatureHeight;
                }
                
                // Doctor's name and designation - use signingUserInfo for workflow-aware signatures
                const doctorName = signingUserInfo?.fullName || currentUserData?.fullName || 'Unknown Doctor';
                // Handle empty strings and null/undefined - default to 'Doctor' as neutral fallback
                const doctorDesignation = (signingUserInfo?.designation && signingUserInfo.designation.trim()) || 
                                         (currentUserData?.designation && currentUserData.designation.trim()) || 
                                         'Doctor';
                const doctorNameFontSize = this.footerFontSize + 1; // Slightly larger font
                
                // Calculate text width for proper alignment
                const nameWidth = regularFont.widthOfTextAtSize(doctorName, doctorNameFontSize);
                const designationWidth = regularFont.widthOfTextAtSize(`(${doctorDesignation})`, this.footerFontSize);
                const maxTextWidth = Math.max(nameWidth, designationWidth);
                
                // Position everything from the right margin, ensuring it fits
                const rightEdge = this.pageWidth - this.rightMargin - 10;
                const textAreaStartX = rightEdge - maxTextWidth;
                
                // NEW LAYOUT: Signature above line, name and designation below line (matching specialist)
                // footerY = 40 is the baseline, line is at footerY + 10 = 50
                const nameY = footerY + 3;  // Name just below line (same as specialist)
                const designationY = footerY - 9;  // Designation below name (same as specialist)
                const signatureY = footerY + 20;  // Signature above the line
                
                // Center the signature image horizontally
                const signatureX = textAreaStartX + (maxTextWidth - signatureWidth) / 2;
                
                // Draw signature image ABOVE the line
                page.drawImage(signatureImage, {
                    x: signatureX,
                    y: signatureY,
                    width: signatureWidth,
                    height: signatureHeight,
                });
                
                // Add doctor's name BELOW the line (centered, same level as specialist)
                const nameX = textAreaStartX + (maxTextWidth - nameWidth) / 2;
                page.drawText(doctorName, {
                    x: nameX,
                    y: nameY,
                    size: doctorNameFontSize,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3)
                });
                
                // Add doctor's designation below name (centered, same level as specialist)
                const designationX = textAreaStartX + (maxTextWidth - designationWidth) / 2;
                page.drawText(`(${doctorDesignation})`, {
                    x: designationX,
                    y: designationY,
                    size: this.footerFontSize,
                    font: regularFont,
                    color: rgb(0.5, 0.5, 0.5)
                });
                
            } catch (error) {
                console.warn('Could not embed signature in footer:', error);
                // Fallback to text-only with better positioning
                const doctorName = signingUserInfo?.fullName || currentUserData?.fullName || 'Unknown Doctor';
                const fallbackDesignation = (signingUserInfo?.designation && signingUserInfo.designation.trim()) || 
                                           (currentUserData?.designation && currentUserData.designation.trim()) || 
                                           'Doctor';
                const doctorTitle = `${doctorName}, ${fallbackDesignation}`;
                const textWidth = regularFont.widthOfTextAtSize(doctorTitle, this.footerFontSize + 1);
                page.drawText(doctorTitle, {
                    x: this.pageWidth - this.rightMargin - textWidth - 10,
                    y: footerY + 8,
                    size: this.footerFontSize + 1,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3)
                });
            }
        }
        
        // Add footer line FIRST (so text goes below it)
        page.drawLine({
            start: { x: this.margin, y: footerY + 10 },
            end: { x: this.pageWidth - this.rightMargin, y: footerY + 10 },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7)
        });
        
        // If no signature, add name and designation BELOW the line
        if (!signatureUrl) {
            const doctorName = signingUserInfo?.fullName || currentUserData?.fullName || 'KrisPoint Radiology System';
            const doctorDesignation = (signingUserInfo?.designation && signingUserInfo.designation.trim()) || 
                                     (currentUserData?.designation && currentUserData.designation.trim()) || 
                                     'Doctor';
            
            if (doctorDesignation) {
                // Show name and designation on separate lines below the footer line
                const nameWidth = regularFont.widthOfTextAtSize(doctorName, this.footerFontSize + 1);
                const designationText = `(${doctorDesignation})`;
                const designationWidth = regularFont.widthOfTextAtSize(designationText, this.footerFontSize);
                
                // Draw name just below line (closer spacing)
                page.drawText(doctorName, {
                    x: this.pageWidth - this.rightMargin - nameWidth - 10,
                    y: footerY + 3,
                    size: this.footerFontSize + 1,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3)
                });
                
                // Draw designation below name
                page.drawText(designationText, {
                    x: this.pageWidth - this.rightMargin - designationWidth - 10,
                    y: footerY - 9,
                    size: this.footerFontSize,
                    font: regularFont,
                    color: rgb(0.5, 0.5, 0.5)
                });
            } else {
                // Just name, no designation
                const textWidth = regularFont.widthOfTextAtSize(doctorName, this.footerFontSize + 1);
                page.drawText(doctorName, {
                    x: this.pageWidth - this.rightMargin - textWidth - 10,
                    y: footerY + 3,
                    size: this.footerFontSize + 1,
                    font: regularFont,
                    color: rgb(0.3, 0.3, 0.3)
                });
            }
        }
    }

    // Utility methods
    wrapText(text, maxWidth, font, fontSize) {
        if (!text) return [''];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);
            
            if (testWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Word is too long, truncate it
                    lines.push(word.substring(0, Math.floor(maxWidth / fontSize * 2)) + '...');
                    currentLine = '';
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 'N/A';
        try {
            const birth = new Date(dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return `${age} years`;
        } catch {
            return 'N/A';
        }
    }

    generateAccessionNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        return `${year}${month}${day}${random}`;
    }

    // Export functionality
    async exportToPDF(fontScale = 1.0, lineSpacing = 1.0, fontFamily = 'liberation') {
        console.log('⚡ exportToPDF called with fontScale:', fontScale, 'lineSpacing:', lineSpacing, 'fontFamily:', fontFamily);
        try {
            console.log('⚡ Calling generateMedicalReport...');
            const pdfBytes = await this.generateMedicalReport(fontScale, lineSpacing, fontFamily);
            console.log('⚡ generateMedicalReport returned', pdfBytes?.length || 0, 'bytes');
            
            // Generate filename
            const currentPatientData = get(patientData);
            const patientName = currentPatientData.name || 'Unknown_Patient';
            const date = new Date().toISOString().split('T')[0];
            const filename = `${patientName.replace(/\s+/g, '_')}_Radiology_Report_${date}.pdf`;
            
            // Create blob and download
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return { success: true, filename };
        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }

    // Preview functionality
    async previewPDF() {
        try {
            const pdfBytes = await this.generateMedicalReport();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            // Open in new tab for preview
            window.open(url, '_blank');
            
            return { success: true };
        } catch (error) {
            console.error('Preview failed:', error);
            return { success: false, error: error.message };
        }
    }

    async addSignatureSection(pdfDoc, page, regularFont, doctorData, yPosition) {
        try {
            // Signature section styling
            const signatureAreaWidth = 300;
            const signatureAreaHeight = 80;
            const dottedLineY = yPosition - 20;
            
            // Draw dotted line for signature
            this.drawDottedLine(page, this.pageWidth - this.rightMargin - signatureAreaWidth, dottedLineY, signatureAreaWidth);
            
            // Add signature image if available
            if (doctorData.signatureUrl) {
                try {
                    // Convert base64 to array buffer
                    const base64Data = doctorData.signatureUrl.split(',')[1];
                    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    
                    // Determine image type and embed
                    let signatureImage;
                    if (doctorData.signatureUrl.includes('data:image/png')) {
                        signatureImage = await pdfDoc.embedPng(imageBytes);
                    } else if (doctorData.signatureUrl.includes('data:image/jpg') || doctorData.signatureUrl.includes('data:image/jpeg')) {
                        signatureImage = await pdfDoc.embedJpg(imageBytes);
                    } else {
                        // Default to PNG
                        signatureImage = await pdfDoc.embedPng(imageBytes);
                    }
                    
                    // Calculate signature dimensions (maintain aspect ratio)
                    const maxWidth = 150;
                    const maxHeight = 40;
                    const { width: originalWidth, height: originalHeight } = signatureImage.scale(1);
                    
                    let signatureWidth = maxWidth;
                    let signatureHeight = (originalHeight / originalWidth) * signatureWidth;
                    
                    if (signatureHeight > maxHeight) {
                        signatureHeight = maxHeight;
                        signatureWidth = (originalWidth / originalHeight) * signatureHeight;
                    }
                    
                    // Position signature above the dotted line
                    const signatureX = this.pageWidth - this.rightMargin - signatureAreaWidth + ((signatureAreaWidth - signatureWidth) / 2);
                    const signatureY = dottedLineY + 10;
                    
                    // Draw signature image
                    page.drawImage(signatureImage, {
                        x: signatureX,
                        y: signatureY,
                        width: signatureWidth,
                        height: signatureHeight,
                    });
                } catch (imageError) {
                    console.warn('Could not embed signature image:', imageError);
                    // Fall back to text signature
                    this.addTextSignature(page, regularFont, doctorData, yPosition);
                }
            }
            
            // Add doctor name and title below dotted line
            const nameY = dottedLineY - 15;
            const doctorName = doctorData.fullName || 'Unknown Doctor';
            const doctorTitle = `(${doctorData.designation || 'Doctor'})`;
            
            // Calculate proper text widths using font measurements
            const nameWidth = regularFont.widthOfTextAtSize(doctorName, this.bodyFontSize);
            const titleWidth = regularFont.widthOfTextAtSize(doctorTitle, this.footerFontSize + 1);
            
            // Center the text under the signature area using actual text widths
            const signatureAreaLeft = this.pageWidth - this.rightMargin - signatureAreaWidth;
            const nameX = signatureAreaLeft + ((signatureAreaWidth - nameWidth) / 2);
            const titleX = signatureAreaLeft + ((signatureAreaWidth - titleWidth) / 2);
            
            page.drawText(doctorName, {
                x: nameX,
                y: nameY,
                size: this.bodyFontSize,
                font: regularFont,
                color: rgb(0, 0, 0)
            });
            
            page.drawText(doctorTitle, {
                x: titleX,
                y: nameY - 12,
                size: this.footerFontSize + 1,
                font: regularFont,
                color: rgb(0.3, 0.3, 0.3)
            });
            
        } catch (error) {
            console.error('Error adding signature section:', error);
            // Fall back to text signature
            this.addTextSignature(page, regularFont, doctorData, yPosition);
        }
    }

    addTextSignature(page, regularFont, doctorData, yPosition) {
        // Simple text-based signature fallback
        const signatureY = yPosition - 20;
        const doctorName = doctorData.fullName || 'Unknown Doctor';
        
        page.drawText(`Electronically signed by: ${doctorName}`, {
            x: this.pageWidth - this.rightMargin - 200,
            y: signatureY,
            size: this.footerFontSize + 1,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
        });
    }

    drawDottedLine(page, startX, y, width) {
        // Draw a dotted line for signature
        const dotSize = 1;
        const spacing = 3;
        
        for (let x = startX; x < startX + width; x += spacing) {
            page.drawCircle({
                x: x,
                y: y,
                size: dotSize,
                color: rgb(0.5, 0.5, 0.5),
            });
        }
    }
}

// Export singleton instance
export const professionalPDFService = new ProfessionalPDFService();