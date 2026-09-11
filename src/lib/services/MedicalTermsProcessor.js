// Medical Terms Processor for Enhanced Voice Recognition
export class MedicalTermsProcessor {
    constructor() {
        // Comprehensive medical terminology corrections - EXPANDED FOR RADIOLOGY
        this.medicalCorrections = new Map([
            // ===== ANATOMICAL TERMS - SPINE =====
            ['lumba', 'lumbar'], ['lumber', 'lumbar'], ['lumbar spine', 'lumbar spine'],
            ['thorasic', 'thoracic'], ['thorassic', 'thoracic'], ['thoracic spine', 'thoracic spine'],
            ['cervical', 'cervical'], ['servical', 'cervical'], ['cervical spine', 'cervical spine'],
            ['sacral', 'sacral'], ['sacrum', 'sacrum'], ['coccyx', 'coccyx'], ['coxyx', 'coccyx'],
            ['vertebra', 'vertebra'], ['vertebral', 'vertebral'], ['vertebrae', 'vertebrae'],
            ['intervertebral', 'intervertebral'], ['disc', 'disc'], ['disk', 'disc'],
            
            // ===== ANATOMICAL TERMS - THORAX =====
            ['thorax', 'thorax'], ['thoracic', 'thoracic'], ['chest', 'chest'],
            ['lung', 'lung'], ['lungs', 'lungs'], ['pulmonary', 'pulmonary'], ['pulminary', 'pulmonary'],
            ['pleura', 'pleura'], ['pleural', 'pleural'], ['pleura space', 'pleural space'],
            ['mediastinum', 'mediastinum'], ['mediastinal', 'mediastinal'], ['mediastinum space', 'mediastinal space'],
            ['heart', 'heart'], ['cardiac', 'cardiac'], ['cardio', 'cardiac'],
            ['aorta', 'aorta'], ['aortic', 'aortic'], ['pulmonary artery', 'pulmonary artery'],
            ['hilum', 'hilum'], ['hila', 'hila'], ['hilar', 'hilar'],
            
            // ===== ANATOMICAL TERMS - ABDOMEN =====
            ['abdomen', 'abdomen'], ['abdomin', 'abdomen'], ['abdominal', 'abdominal'],
            ['liver', 'liver'], ['hepatic', 'hepatic'], ['gallbladder', 'gallbladder'], ['gall bladder', 'gallbladder'],
            ['pancreas', 'pancreas'], ['pancreatic', 'pancreatic'], ['pancrease', 'pancreas'],
            ['spleen', 'spleen'], ['splenic', 'splenic'], ['kidney', 'kidney'], ['kidneys', 'kidneys'],
            ['renal', 'renal'], ['ureter', 'ureter'], ['bladder', 'bladder'],
            ['pelvis', 'pelvis'], ['pelvic', 'pelvic'], ['pelvis cavity', 'pelvic cavity'],
            
            // ===== ANATOMICAL TERMS - HEAD/BRAIN =====
            ['brain', 'brain'], ['cerebral', 'cerebral'], ['cerebrum', 'cerebrum'],
            ['cerebellum', 'cerebellum'], ['brainstem', 'brainstem'], ['brain stem', 'brainstem'],
            ['ventricle', 'ventricle'], ['ventricles', 'ventricles'], ['ventricular', 'ventricular'],
            ['subarachnoid', 'subarachnoid'], ['subdural', 'subdural'], ['epidural', 'epidural'],
            ['parenchyma', 'parenchyma'], ['parenchymal', 'parenchymal'], ['gray matter', 'gray matter'],
            ['white matter', 'white matter'], ['skull', 'skull'], ['cranium', 'cranium'], ['cranial', 'cranial'],
            
            // ===== MEDICAL CONDITIONS - LUNG =====
            ['pneumonia', 'pneumonia'], ['pnemonia', 'pneumonia'], ['new monia', 'pneumonia'],
            ['pneumothorax', 'pneumothorax'], ['pneumo thorax', 'pneumothorax'], ['collapsed lung', 'pneumothorax'],
            ['atelectasis', 'atelectasis'], ['a tell ectasis', 'atelectasis'], ['collapsed lung', 'atelectasis'],
            ['consolidation', 'consolidation'], ['consolation', 'consolidation'], ['lung consolidation', 'consolidation'],
            ['effusion', 'effusion'], ['fusion', 'effusion'], ['pleural effusion', 'pleural effusion'],
            ['pulmonary embolism', 'pulmonary embolism'], ['pe', 'pulmonary embolism'], ['blood clot', 'pulmonary embolism'],
            ['emphysema', 'emphysema'], ['copd', 'COPD'], ['chronic obstructive', 'chronic obstructive pulmonary disease'],
            
            // ===== MEDICAL CONDITIONS - CARDIAC =====
            ['cardiomegaly', 'cardiomegaly'], ['cardio megaly', 'cardiomegaly'], ['enlarged heart', 'cardiomegaly'],
            ['myocardial infarction', 'myocardial infarction'], ['heart attack', 'myocardial infarction'],
            ['pericardial effusion', 'pericardial effusion'], ['pericardium', 'pericardium'],
            ['aortic stenosis', 'aortic stenosis'], ['mitral regurgitation', 'mitral regurgitation'],
            
            // ===== MEDICAL CONDITIONS - GENERAL =====
            ['hemorrhage', 'hemorrhage'], ['bleeding', 'hemorrhage'], ['hematoma', 'hematoma'],
            ['infarction', 'infarction'], ['infarct', 'infarct'], ['ischemia', 'ischemia'], ['ischemic', 'ischemic'],
            ['edema', 'edema'], ['swelling', 'edema'], ['mass', 'mass'], ['tumor', 'tumor'],
            ['lesion', 'lesion'], ['nodule', 'nodule'], ['opacity', 'opacity'], ['opacities', 'opacities'],
            ['infiltrate', 'infiltrate'], ['infiltrates', 'infiltrates'], ['inflammation', 'inflammation'],
            ['stenosis', 'stenosis'], ['narrowing', 'narrowing'], ['dilatation', 'dilatation'], ['dilation', 'dilatation'],
            ['thrombosis', 'thrombosis'], ['embolism', 'embolism'], ['clot', 'thrombosis'],
            
            // ===== IMAGING MODALITIES =====
            ['ct scan', 'CT scan'], ['computed tomography', 'computed tomography'], ['cat scan', 'CT scan'],
            ['mri scan', 'MRI scan'], ['magnetic resonance', 'magnetic resonance imaging'],
            ['x ray', 'X-ray'], ['xray', 'X-ray'], ['radiograph', 'radiograph'], ['plain film', 'plain film'],
            ['ultrasound', 'ultrasound'], ['sonogram', 'ultrasound'], ['doppler', 'Doppler'],
            ['mammography', 'mammography'], ['mammogram', 'mammogram'], ['mammo', 'mammography'],
            ['fluoroscopy', 'fluoroscopy'], ['angiography', 'angiography'], ['angio', 'angiography'],
            
            // ===== CONTRAST AGENTS =====
            ['contrast', 'contrast'], ['contrass', 'contrast'], ['contrast agent', 'contrast agent'],
            ['non contrast', 'non-contrast'], ['noncontrast', 'non-contrast'], ['without contrast', 'without contrast'],
            ['with contrast', 'with contrast'], ['post contrast', 'post-contrast'], ['enhanced', 'contrast-enhanced'],
            ['gadolinium', 'gadolinium'], ['iodine', 'iodine contrast'], ['barium', 'barium'],
            
            // ===== DIRECTIONAL/POSITIONAL TERMS =====
            ['anterior', 'anterior'], ['posterior', 'posterior'], ['superior', 'superior'], ['inferior', 'inferior'],
            ['medial', 'medial'], ['lateral', 'lateral'], ['proximal', 'proximal'], ['distal', 'distal'],
            ['bilateral', 'bilateral'], ['unilateral', 'unilateral'], ['ipsilateral', 'ipsilateral'],
            ['contralateral', 'contralateral'], ['midline', 'midline'], ['axial', 'axial'], ['sagittal', 'sagittal'],
            ['coronal', 'coronal'], ['transverse', 'transverse'], ['longitudinal', 'longitudinal'],
            
            // ===== SIGNAL INTENSITY & PATTERN DESCRIPTORS =====
            ['hyper intense', 'hyperintense'], ['hypo intense', 'hypointense'],
            ['iso intense', 'isointense'], ['hetero geneous', 'heterogeneous'],
            ['homo geneous', 'homogeneous'],
            
            // ===== DESCRIPTIVE TERMS =====
            ['normal', 'normal'], ['abnormal', 'abnormal'], ['unremarkable', 'unremarkable'], 
            ['remarkable', 'remarkable'], ['grossly normal', 'grossly normal'], ['within normal limits', 'within normal limits'],
            ['acute', 'acute'], ['chronic', 'chronic'], ['subacute', 'subacute'], ['stable', 'stable'],
            ['unchanged', 'unchanged'], ['improved', 'improved'], ['worsened', 'worsened'], ['resolved', 'resolved'],
            ['mild', 'mild'], ['moderate', 'moderate'], ['severe', 'severe'], ['marked', 'marked'],
            ['slight', 'slight'], ['prominent', 'prominent'], ['extensive', 'extensive'],
            
            // ===== FRACTURE TYPES =====
            ['fracture', 'fracture'], ['frakture', 'fracture'], ['fx', 'fracture'],
            ['comminuted', 'comminuted'], ['displaced', 'displaced'], ['nondisplaced', 'non-displaced'],
            ['compression', 'compression'], ['avulsion', 'avulsion'], ['spiral', 'spiral'],
            ['oblique', 'oblique'], ['transverse', 'transverse'], ['greenstick', 'greenstick'],
            
            // ===== CLINICAL PHRASES =====
            ['clinical correlation', 'clinical correlation'], ['correlation recommended', 'correlation recommended'],
            ['recommend', 'recommend'], ['suggest', 'suggest'], ['consider', 'consider'],
            ['follow up', 'follow-up'], ['followup', 'follow-up'], ['follow up recommended', 'follow-up recommended'],
            ['no acute', 'no acute'], ['no evidence', 'no evidence'], ['no significant', 'no significant'],
            ['cannot exclude', 'cannot exclude'], ['rule out', 'rule out'], ['consistent with', 'consistent with'],
            ['compatible with', 'compatible with'], ['suggestive of', 'suggestive of'],
            
            // ===== COMMON MEDICAL ABBREVIATIONS (expanded form) =====
            ['copd', 'COPD'], ['cad', 'CAD'], ['chf', 'CHF'], ['dvt', 'DVT'], ['pe', 'PE'],
            ['uri', 'URI'], ['uti', 'UTI'], ['gi', 'GI'], ['gu', 'GU'], ['cv', 'CV'],
            ['neuro', 'neurological'], ['ortho', 'orthopedic'], ['onco', 'oncological']
        ]);

        // Template voice command aliases with fuzzy matching
        this.templateCommands = new Map([
            // Spine templates
            ['lumbar spine', ['lumba spine', 'lumber spine', 'lower spine', 'l spine', 'lumbar']],
            ['cervical spine', ['cervical', 'neck spine', 'upper spine', 'c spine', 'servical spine']],
            ['thoracic spine', ['thorasic spine', 'mid spine', 'chest spine', 't spine', 'thorassic spine']],
            
            // CT templates
            ['ct head normal', ['ct head normal', 'head ct normal', 'normal head ct', 'ct brain normal']],
            ['ct head trauma', ['ct head trauma', 'head ct trauma', 'trauma head ct']],
            ['ct chest', ['chest ct', 'ct thorax', 'thorax ct', 'ct chest']],
            ['ct abdomen', ['abdomen ct', 'ct abdominal', 'abdominal ct']],
            ['ct pelvis', ['pelvis ct', 'ct pelvic', 'pelvic ct']],
            
            // MRI templates
            ['mri brain', ['brain mri', 'head mri', 'mri head', 'mri brain']],
            ['mri spine', ['spine mri', 'mri spinal']],
            
            // X-ray templates
            ['chest xray', ['chest x ray', 'xray chest', 'chest radiograph']],
            ['spine xray', ['spine x ray', 'xray spine', 'spinal radiograph']]
        ]);

        // Comprehensive medical abbreviations for expansion - RADIOLOGY FOCUSED
        this.abbreviations = new Map([
            // ===== IMAGING MODALITIES =====
            ['ct', 'CT'], ['cat', 'CT'], ['cta', 'CT angiography'], ['ctp', 'CT perfusion'],
            ['mri', 'MRI'], ['mra', 'MR angiography'], ['mrv', 'MR venography'], ['mrcp', 'MRCP'],
            ['dti', 'diffusion tensor imaging'], ['dwi', 'diffusion weighted imaging'],
            ['us', 'ultrasound'], ['echo', 'echocardiogram'], ['tee', 'transesophageal echocardiogram'],
            ['xr', 'X-ray'], ['kub', 'KUB'], ['cxr', 'chest X-ray'], ['tte', 'transthoracic echocardiogram'],
            ['pet', 'PET scan'], ['spect', 'SPECT'], ['nm', 'nuclear medicine'],
            
            // ===== ANATOMICAL REGIONS =====
            ['c spine', 'cervical spine'], ['t spine', 'thoracic spine'], ['l spine', 'lumbar spine'],
            ['ls', 'lumbosacral'], ['si', 'sacroiliac'], ['tmj', 'temporomandibular joint'],
            ['ivc', 'inferior vena cava'], ['svc', 'superior vena cava'], ['rv', 'right ventricle'],
            ['lv', 'left ventricle'], ['ra', 'right atrium'], ['la', 'left atrium'],
            ['rll', 'right lower lobe'], ['rul', 'right upper lobe'], ['rml', 'right middle lobe'],
            ['lll', 'left lower lobe'], ['lul', 'left upper lobe'], ['lingula', 'lingula'],
            
            // ===== MEDICAL CONDITIONS =====
            ['pe', 'pulmonary embolism'], ['dvt', 'deep vein thrombosis'], ['cad', 'coronary artery disease'],
            ['chf', 'congestive heart failure'], ['copd', 'chronic obstructive pulmonary disease'],
            ['ards', 'acute respiratory distress syndrome'], ['uti', 'urinary tract infection'],
            ['gi', 'gastrointestinal'], ['gu', 'genitourinary'], ['cv', 'cardiovascular'],
            ['mi', 'myocardial infarction'], ['cva', 'cerebrovascular accident'], ['tia', 'transient ischemic attack'],
            ['ich', 'intracerebral hemorrhage'], ['sah', 'subarachnoid hemorrhage'], ['sdh', 'subdural hematoma'],
            ['edh', 'epidural hematoma'], ['icp', 'intracranial pressure'], ['htn', 'hypertension'],
            ['dm', 'diabetes mellitus'], ['uri', 'upper respiratory infection'],
            
            // ===== DIRECTIONAL/POSITIONAL =====
            ['ap', 'anteroposterior'], ['pa', 'posteroanterior'], ['lat', 'lateral'], ['obl', 'oblique'],
            ['rpo', 'right posterior oblique'], ['lpo', 'left posterior oblique'], ['rao', 'right anterior oblique'],
            ['lao', 'left anterior oblique'], ['sup', 'superior'], ['inf', 'inferior'],
            ['med', 'medial'], ['prox', 'proximal'], ['dist', 'distal'], ['bil', 'bilateral'],
            ['unilat', 'unilateral'], ['rt', 'right'], ['lt', 'left'],
            
            // ===== CLINICAL FINDINGS =====
            ['wml', 'white matter lesions'], ['pvh', 'periventricular hyperintensity'],
            ['lac', 'lacunar infarct'], ['flair', 'fluid attenuated inversion recovery'],
            ['t1wi', 'T1-weighted imaging'], ['t2wi', 'T2-weighted imaging'], ['pdwi', 'proton density weighted'],
            ['gre', 'gradient echo'], ['swi', 'susceptibility weighted imaging'],
            
            // ===== MEASUREMENTS =====
            ['hu', 'Hounsfield units'], ['suv', 'standardized uptake value'], ['ejf', 'ejection fraction'],
            ['lvef', 'left ventricular ejection fraction'], ['tr', 'tricuspid regurgitation'],
            ['mr', 'mitral regurgitation'], ['ar', 'aortic regurgitation'], ['as', 'aortic stenosis'],
            
            // ===== COMMON CLINICAL ABBREVIATIONS =====
            ['bp', 'blood pressure'], ['hr', 'heart rate'], ['rr', 'respiratory rate'],
            ['temp', 'temperature'], ['o2 sat', 'oxygen saturation'], ['wbc', 'white blood cell count'],
            ['rbc', 'red blood cell count'], ['hgb', 'hemoglobin'], ['hct', 'hematocrit'],
            ['plt', 'platelet count'], ['bun', 'blood urea nitrogen'], ['cr', 'creatinine'],
            ['gfr', 'glomerular filtration rate'], ['bmi', 'body mass index'],
            
            // ===== REPORT SECTIONS =====
            ['hx', 'history'], ['px', 'physical examination'], ['dx', 'diagnosis'], ['ddx', 'differential diagnosis'],
            ['r/o', 'rule out'], ['vs', 'versus'], ['s/p', 'status post'], ['h/o', 'history of'],
            ['f/u', 'follow-up'], ['c/w', 'consistent with'], ['c/o', 'complains of'], ['tx', 'treatment']
        ]);
    }

    // ===== ADVANCED CORRECTION ALGORITHMS =====
    
    /**
     * Phonetic similarity patterns for medical terms
     * Handles cases where voice recognition breaks words incorrectly
     */
    getPhoneticPatterns() {
        return new Map([
            // Common phonetic breakdowns
            ['new monia', 'pneumonia'],
            ['a tell ectasis', 'atelectasis'], 
            ['a telectasis', 'atelectasis'],
            ['tell ectasis', 'atelectasis'],
            ['pneumo thorax', 'pneumothorax'],
            ['cardio megaly', 'cardiomegaly'],
            ['hepato megaly', 'hepatomegaly'],
            ['spleno megaly', 'splenomegaly'],
            ['lymph adenopathy', 'lymphadenopathy'],
            ['sub arachnoid', 'subarachnoid'],
            ['intra cranial', 'intracranial'],
            ['extra axial', 'extra-axial'],
            ['intra axial', 'intra-axial'],
            ['peri ventricular', 'periventricular'],
            ['retro peritoneal', 'retroperitoneal'],
            ['gastro intestinal', 'gastrointestinal'],
            ['genito urinary', 'genitourinary'],
            ['musculo skeletal', 'musculoskeletal'],
            
            // Medical compound term patterns
            ['heart lung', 'cardiopulmonary'],
            ['liver kidney', 'hepatorenal'],
            ['brain spine', 'neurospinal'],
            ['chest abdomen', 'thoracoabdominal'],
            ['head neck', 'craniocervical'],
            ['back bone', 'vertebral column'],
            ['blood vessel', 'vascular'],
            ['nerve system', 'nervous system'],
            
            // Complex medical phrases
            ['blood clot lung', 'pulmonary embolism'],
            ['collapsed lung', 'pneumothorax'],
            ['fluid lung', 'pleural effusion'],
            ['enlarged heart', 'cardiomegaly'],
            ['kidney stone', 'nephrolithiasis'],
            ['gall stone', 'cholelithiasis'],
            ['brain bleed', 'intracranial hemorrhage'],
            ['spine fusion', 'spinal fusion'],
            ['contrast dye', 'contrast material'],
            
            // Anatomical mispronunciations
            ['servical', 'cervical'],
            ['lumber', 'lumbar'],
            ['thorasic', 'thoracic'],
            ['sacro iliac', 'sacroiliac'],
            ['temporo mandibular', 'temporomandibular'],
            ['sterno clavicular', 'sternoclavicular'],
            ['acromio clavicular', 'acromioclavicular'],
            
            // Common medication/contrast patterns
            ['gadolinium contrast', 'gadolinium'],
            ['iodine contrast', 'iodinated contrast'],
            ['barium contrast', 'barium'],
            ['oral contrast', 'oral contrast material'],
            ['iv contrast', 'intravenous contrast'],
        ]);
    }

    /**
     * Context-aware medical corrections
     * Uses surrounding words to make smarter corrections
     */
    getContextualPatterns() {
        return [
            // Radiology context patterns
            {
                pattern: /(\w+)\s+(ray|scan|study|exam|examination)/gi,
                correction: (match, modality, type) => {
                    const modalityMap = {
                        'ct': 'CT',
                        'cat': 'CT', 
                        'mri': 'MRI',
                        'mr': 'MRI',
                        'pet': 'PET',
                        'x': 'X-ray',
                        'chest': 'chest X-ray',
                        'spine': 'spine X-ray',
                        'head': 'head CT'
                    };
                    return modalityMap[modality.toLowerCase()] || match;
                }
            },
            
            // Anatomical context patterns  
            {
                pattern: /(left|right|bilateral)\s+(\w+)/gi,
                correction: (match, side, anatomy) => {
                    const anatomyMap = {
                        'lung': 'lung',
                        'kidney': 'kidney',
                        'ventricle': 'ventricle',
                        'atrium': 'atrium',
                        'lobe': 'lobe'
                    };
                    const correctedAnatomy = anatomyMap[anatomy.toLowerCase()] || anatomy;
                    return `${side.toLowerCase()} ${correctedAnatomy}`;
                }
            },
            
            // Size/quantity context
            {
                pattern: /(mild|moderate|severe|marked|extensive)\s+(\w+)/gi,
                correction: (match, severity, condition) => {
                    return `${severity.toLowerCase()} ${condition.toLowerCase()}`;
                }
            },
            
            // Temporal context
            {
                pattern: /(acute|chronic|subacute)\s+(\w+)/gi,
                correction: (match, timing, condition) => {
                    return `${timing.toLowerCase()} ${condition.toLowerCase()}`;
                }
            }
        ];
    }

    /**
     * Apply phonetic corrections for commonly mispronounced medical terms
     * @param {string} text - Input text
     * @returns {string} - Phonetically corrected text
     */
    applyPhoneticCorrections(text) {
        if (!text || typeof text !== 'string') return text;
        
        let corrected = text;
        const phoneticPatterns = this.getPhoneticPatterns();
        
        // Apply phonetic pattern corrections
        for (const [incorrect, correct] of phoneticPatterns) {
            const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
            corrected = corrected.replace(regex, correct);
        }
        
        return corrected;
    }

    /**
     * Apply context-aware corrections using surrounding words
     * @param {string} text - Input text  
     * @returns {string} - Context-corrected text
     */
    applyContextualCorrections(text) {
        if (!text || typeof text !== 'string') return text;
        
        let corrected = text;
        const contextualPatterns = this.getContextualPatterns();
        
        // Apply contextual pattern corrections
        for (const pattern of contextualPatterns) {
            corrected = corrected.replace(pattern.pattern, pattern.correction);
        }
        
        return corrected;
    }

    /**
     * Calculate phonetic similarity between two strings
     * Uses a combination of Levenshtein distance and phonetic rules
     * @param {string} str1 - First string
     * @param {string} str2 - Second string  
     * @returns {number} - Similarity score (0-1, higher is more similar)
     */
    calculatePhoneticSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        // Normalize strings for phonetic comparison
        const normalize = (str) => str.toLowerCase()
            .replace(/ph/g, 'f')
            .replace(/gh/g, 'f')
            .replace(/ck/g, 'k')
            .replace(/c([ei])/g, 's$1')
            .replace(/ch/g, 'sh')
            .replace(/th/g, 's')
            .replace(/x/g, 'ks')
            .replace(/z/g, 's');
            
        const norm1 = normalize(str1);
        const norm2 = normalize(str2);
        
        const distance = this.levenshteinDistance(norm1, norm2);
        const maxLength = Math.max(norm1.length, norm2.length);
        
        return maxLength > 0 ? 1 - (distance / maxLength) : 0;
    }

    /**
     * Enhanced medical term correction with advanced algorithms
     * @param {string} text - Raw transcribed text
     * @returns {string} - Corrected text with proper medical terminology
     */
    correctMedicalTerms(text) {
        if (!text || typeof text !== 'string') return text;
        
        // Preserve trailing space for continuous dictation
        const hasTrailingSpace = text.endsWith(' ');
        
        // PRESERVE ORIGINAL CASE - do not lowercase the entire text!
        // Previous stages have set proper capitalization (L3-L5, HU, etc.)
        let corrected = text.trim();
        
        // Step 1: Apply phonetic corrections (handles broken words like "new monia")
        // Note: applyPhoneticCorrections handles its own case preservation
        corrected = this.applyPhoneticCorrections(corrected);
        
        // Step 2: Apply basic medical term corrections (case-insensitive matching)
        for (const [incorrect, correct] of this.medicalCorrections) {
            const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
            corrected = corrected.replace(regex, correct);
        }
        
        // Step 3: Apply contextual corrections (uses surrounding words)
        corrected = this.applyContextualCorrections(corrected);
        
        // Restore trailing space if present in original text
        if (hasTrailingSpace) {
            corrected += ' ';
        }
        
        return corrected;
    }

    /**
     * Process voice commands with medical template aliases
     * @param {string} text - Corrected text
     * @returns {string} - Text with resolved template commands
     */
    processTemplateCommands(text) {
        if (!text || typeof text !== 'string') return text;
        
        const templateMatch = text.match(/(?:template|load template|use template)\s+(.+)/i);
        if (!templateMatch) return text;
        
        const templateQuery = templateMatch[1].toLowerCase().trim();
        
        // Find matching template using fuzzy matching
        for (const [canonical, aliases] of this.templateCommands) {
            // Check exact match first
            if (canonical === templateQuery) {
                return `template ${canonical}`;
            }
            
            // Check if any alias matches
            for (const alias of aliases) {
                if (this.fuzzyMatch(templateQuery, alias)) {
                    return `template ${canonical}`;
                }
            }
        }
        
        // If no exact match, try partial matching
        for (const [canonical, aliases] of this.templateCommands) {
            if (canonical.includes(templateQuery) || 
                aliases.some(alias => alias.includes(templateQuery) || templateQuery.includes(alias))) {
                return `template ${canonical}`;
            }
        }
        
        return text;
    }

    /**
     * Expand medical abbreviations
     * @param {string} text - Text with potential abbreviations
     * @returns {string} - Text with expanded abbreviations
     */
    expandAbbreviations(text) {
        if (!text || typeof text !== 'string') return text;
        
        let expanded = text;
        
        for (const [abbrev, full] of this.abbreviations) {
            const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
            expanded = expanded.replace(regex, full);
        }
        
        return expanded;
    }

    /**
     * Fuzzy matching for voice command recognition
     * @param {string} input - Input text
     * @param {string} target - Target to match against
     * @returns {boolean} - Whether there's a fuzzy match
     */
    fuzzyMatch(input, target) {
        if (!input || !target) return false;
        
        // Calculate Levenshtein distance
        const distance = this.levenshteinDistance(input.toLowerCase(), target.toLowerCase());
        const maxLength = Math.max(input.length, target.length);
        const similarity = 1 - (distance / maxLength);
        
        // Consider it a match if similarity is above 75%
        return similarity >= 0.75;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Convert number word sequences to numeric strings
     * Handles: "five" → "5", "twenty five" → "25", "two point five" → "2.5"
     * STOPS at range connectors (to, through, -) to prevent merging across ranges
     * @param {string} wordSequence - Space-separated number words
     * @returns {string|null} - Numeric string or null if invalid
     */
    wordsToNumber(wordSequence) {
        if (!wordSequence) return null;
        
        const words = wordSequence.toLowerCase().trim().split(/\s+/);
        
        // Single digit/word mappings
        const ones = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
            'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
            'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19
        };
        
        const tens = {
            'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
            'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
        };
        
        const multipliers = { 'hundred': 100, 'thousand': 1000 };
        
        let total = 0;
        let current = 0;
        let decimalMode = false;
        let decimalDigits = [];
        
        for (const word of words) {
            // STOP conditions - range connectors
            if (['to', 'through', '-', '–', '—'].includes(word)) break;
            
            // STOP conditions - units
            if (['millimeters', 'millimeter', 'mm', 'centimeters', 'centimeter', 'cm', 
                 'meters', 'meter', 'm', 'inches', 'inch', 'in', 'hounsfield', 'hu'].includes(word)) break;
            
            // Skip "and"
            if (word === 'and') continue;
            
            // Decimal point - switch to fractional mode
            if (word === 'point') {
                decimalMode = true;
                total += current;
                current = 0;
                continue;
            }
            
            // In decimal mode, collect individual digits
            if (decimalMode) {
                // Accept both number words AND digit strings: "point five" or "point 3"
                if (ones.hasOwnProperty(word) && ones[word] < 10) {
                    decimalDigits.push(ones[word]);
                } else if (/^\d$/.test(word)) {
                    // Accept single digit strings: "3" → 3
                    decimalDigits.push(parseInt(word));
                } else {
                    break; // Stop at non-digit word after decimal
                }
                continue;
            }
            
            // Normal number accumulation
            if (ones.hasOwnProperty(word)) {
                current += ones[word];
            } else if (tens.hasOwnProperty(word)) {
                current += tens[word];
            } else if (multipliers.hasOwnProperty(word)) {
                current *= multipliers[word];
                total += current;
                current = 0;
            } else {
                break; // Stop at unrecognized word
            }
        }
        
        total += current;
        
        // Build final number string
        if (decimalMode && decimalDigits.length > 0) {
            return `${total}.${decimalDigits.join('')}`;
        } else if (total > 0 || decimalDigits.length > 0) {
            return total.toString();
        }
        
        return null;
    }


    /**
     * Capitalize spaced acronyms that voice recognition broke apart
     * "M R I" → "MRI", "C T" → "CT", "D W I" → "DWI"
     * This MUST run FIRST before any lowercasing happens
     */
    capitalizeSpacedAcronyms(text) {
        if (!text) return text;
        
        let result = text;
        
        // Common 2-letter acronyms with spaces
        const twoLetterAcronyms = ['M R', 'C T', 'D W', 'G R', 'P D', 'F S'];
        for (const acronym of twoLetterAcronyms) {
            const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
            result = result.replace(regex, acronym.replace(/\s+/g, ''));
        }
        
        // Common 3-letter acronyms with spaces
        const threeLetterAcronyms = [
            'M R I', 'M R A', 'M R V', 'C T A',
            'D W I', 'A D C', 'G R E', 'S W I',
            'T O F', 'P E T', 'K U B'
        ];
        for (const acronym of threeLetterAcronyms) {
            const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
            result = result.replace(regex, acronym.replace(/\s+/g, ''));
        }
        
        // Common 4+ letter acronyms with spaces
        const longerAcronyms = [
            'F L A I R', 'M P R A G E', 'S S F P',
            'F I E S T A', 'S T I R'
        ];
        for (const acronym of longerAcronyms) {
            const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
            result = result.replace(regex, acronym.replace(/\s+/g, ''));
        }
        
        return result;
    }

    /**
     * Normalize spoken years to 4-digit format
     * "twenty twenty-five" → "2025", "nineteen ninety-nine" → "1999"
     * This MUST run BEFORE normalizeNumbers() to work correctly
     */
    normalizeYears(text) {
        if (!text) return text;
        
        const onesWords = {
            'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
            'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
        };
        
        const tensMap = {
            'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
            'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90'
        };
        
        let result = text;
        
        // Pattern 1: "two thousand (and) twenty-five" → "2025" (handles both digit and word forms)
        result = result.replace(/\btwo thousand(?:\s+and)?\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+|-)(one|two|three|four|five|six|seven|eight|nine)\b/gi, 
            (match, tens, ones) => {
                const tensValue = tensMap[tens.toLowerCase()];  // "20", "30", etc.
                const onesValue = onesWords[ones.toLowerCase()]; // "1", "2", etc.
                const lastTwoDigits = parseInt(tensValue) + parseInt(onesValue); // 20 + 5 = 25
                return `20${lastTwoDigits.toString().padStart(2, '0')}`;
            }
        );
        
        // Pattern 2: "two thousand twenty" → "2020" (even tens)
        result = result.replace(/\btwo thousand(?:\s+and)?\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/gi, 
            (match, tens) => {
                const tensValue = tensMap[tens.toLowerCase()]; // "20", "30", etc.
                return `20${tensValue}`;
            }
        );
        
        // Pattern 3: "twenty twenty-five" → "2025" (2000s style: 20 + compound number)
        result = result.replace(/\btwenty\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+|-)(one|two|three|four|five|six|seven|eight|nine)\b/gi, 
            (match, tens, ones) => {
                const tensValue = tensMap[tens.toLowerCase()];  // "20", "30", etc.
                const onesValue = onesWords[ones.toLowerCase()]; // "1", "2", etc.
                const lastTwoDigits = parseInt(tensValue) + parseInt(onesValue); // 20 + 5 = 25
                return `20${lastTwoDigits.toString().padStart(2, '0')}`;
            }
        );
        
        // Pattern 4: "twenty twenty" → "2020" (even twenties for 2000s)
        result = result.replace(/\btwenty\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/gi, 
            (match, tens) => {
                const tensValue = tensMap[tens.toLowerCase()]; // "20", "30", etc.
                return `20${tensValue}`;
            }
        );
        
        // Pattern 5: "nineteen ninety-nine" → "1999" (1900s style: 19 + compound number)
        result = result.replace(/\bnineteen\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+|-)(one|two|three|four|five|six|seven|eight|nine)\b/gi, 
            (match, tens, ones) => {
                const tensValue = tensMap[tens.toLowerCase()];  // "20", "30", etc.
                const onesValue = onesWords[ones.toLowerCase()]; // "1", "2", etc.
                const lastTwoDigits = parseInt(tensValue) + parseInt(onesValue); // 90 + 9 = 99
                return `19${lastTwoDigits.toString().padStart(2, '0')}`;
            }
        );
        
        // Pattern 6: "nineteen ninety" → "1990" (even years for 1900s)
        result = result.replace(/\bnineteen\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/gi, 
            (match, tens) => {
                const tensValue = tensMap[tens.toLowerCase()]; // "20", "30", etc.
                return `19${tensValue}`;
            }
        );
        
        return result;
    }

    /**
     * Convert spoken dates to standardized format
     * @param {string} text - Text with potential dates
     * @returns {string} - Text with formatted dates
     */
    convertDates(text) {
        if (!text) return text;
        
        const monthNames = {
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12',
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
            'oct': '10', 'nov': '11', 'dec': '12'
        };
        
        const ordinalWords = {
            'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
            'sixth': '6', 'seventh': '7', 'eighth': '8', 'ninth': '9', 'tenth': '10',
            'eleventh': '11', 'twelfth': '12', 'thirteenth': '13', 'fourteenth': '14',
            'fifteenth': '15', 'sixteenth': '16', 'seventeenth': '17', 'eighteenth': '18',
            'nineteenth': '19', 'twentieth': '20', 'twenty first': '21', 'twenty second': '22',
            'twenty third': '23', 'twenty fourth': '24', 'twenty fifth': '25', 'twenty sixth': '26',
            'twenty seventh': '27', 'twenty eighth': '28', 'twenty ninth': '29', 'thirtieth': '30',
            'thirty first': '31'
        };
        
        let result = text;
        
        // NEW: Pattern 0: Whisper often outputs "20th December 2025" instead of word ordinals
        // "1st January 2025", "20th December 2025" → "01/01/2025", "20/12/2025"
        result = result.replace(/(\d{1,2})(?:st|nd|rd|th)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/gi,
            (match, day, month, year) => {
                const m = monthNames[month.toLowerCase()];
                const d = day.padStart(2, '0');
                return `${d}/${m}/${year}`;
            }
        );
        
        // Pattern 1: "January 15, 2025" or "January 15 2025" → "15/01/2025" (DD/MM/YYYY)
        result = result.replace(/(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/gi,
            (match, month, day, year) => {
                const m = monthNames[month.toLowerCase()];
                const d = day.padStart(2, '0');
                return `${d}/${m}/${year}`;
            }
        );
        
        // Pattern 2: "15 January 2025" (International format) → "15/01/2025" (DD/MM/YYYY)
        result = result.replace(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})/gi,
            (match, day, month, year) => {
                const m = monthNames[month.toLowerCase()];
                const d = day.padStart(2, '0');
                return `${d}/${m}/${year}`;
            }
        );
        
        // Pattern 3: "January fifteenth, 2025" → "15/01/2025" (DD/MM/YYYY)
        result = result.replace(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty first|twenty second|twenty third|twenty fourth|twenty fifth|twenty sixth|twenty seventh|twenty eighth|twenty ninth|thirtieth|thirty first),?\s+(\d{4})/gi,
            (match, month, day, year) => {
                const m = monthNames[month.toLowerCase()];
                const d = ordinalWords[day.toLowerCase()].padStart(2, '0');
                return `${d}/${m}/${year}`;
            }
        );
        
        // Pattern 4: "the 15th of January 2025" → "15/01/2025" (DD/MM/YYYY)
        result = result.replace(/the\s+(\d{1,2})(?:st|nd|rd|th)\s+of\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
            (match, day, month, year) => {
                const m = monthNames[month.toLowerCase()];
                const d = day.padStart(2, '0');
                return `${d}/${m}/${year}`;
            }
        );
        
        // Pattern 5: Relative dates (DD/MM/YYYY)
        const today = new Date();
        
        result = result.replace(/\btoday\b/gi, () => {
            const m = (today.getMonth() + 1).toString().padStart(2, '0');
            const d = today.getDate().toString().padStart(2, '0');
            const y = today.getFullYear();
            return `${d}/${m}/${y}`;
        });
        
        result = result.replace(/\byesterday\b/gi, () => {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const m = (yesterday.getMonth() + 1).toString().padStart(2, '0');
            const d = yesterday.getDate().toString().padStart(2, '0');
            const y = yesterday.getFullYear();
            return `${d}/${m}/${y}`;
        });
        
        return result;
    }

    /**
     * Standardize clock positions for anatomical localization
     * Converts variations to consistent "2 o'clock" format
     * @param {string} text - Text containing clock positions
     * @returns {string} - Text with standardized clock positions
     */
    standardizeClockPositions(text) {
        const clockNumbers = {
            'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8',
            'nine': '9', 'ten': '10', 'eleven': '11', 'twelve': '12'
        };
        
        let result = text;
        
        // Pattern 1: "two oclock" or "two o clock" → "2 o'clock"
        // Handles variations: oclock, o'clock, o clock
        result = result.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*o['']?\s*clock\b/gi,
            (match, number) => {
                const digit = clockNumbers[number.toLowerCase()];
                return `${digit} o'clock`;
            }
        );
        
        // Pattern 2: "2 oclock" or "2 o clock" → "2 o'clock"
        result = result.replace(/\b(\d{1,2})\s*o['']?\s*clock\b/gi,
            (match, digit) => {
                return `${digit} o'clock`;
            }
        );
        
        return result;
    }

    /**
     * Format spine vertebrae labels - HANDLES VOSK'S "2/two" AS "to" CONNECTOR
     * Since normalizeNumbers() runs first, this handles digits not words
     * Converts "C 1", "L 3" → "C1", "L3" and ranges "C1 2 C5" → "C1-C5"
     * @param {string} text - Text containing spine labels
     * @returns {string} - Text with formatted spine labels
     */
    formatSpineLabels(text) {
        let result = text;
        
        // Pattern 1: Collapse letter-number spacing "C 1" → "C1"
        result = result.replace(/\b([CTLS])\s*(\d{1,2})\b/gi, 
            (match, letter, digit) => `${letter.toUpperCase()}${digit}`
        );
        
        // Pattern 2: Ranges with multiple connectors (to|through|thru|2|two)
        // Handles Vosk recognizing "to" as "2" or "two"
        // "C1 to C5" OR "C1 2 C5" OR "C1 two C5" → "C1-C5"
        result = result.replace(/\b([CTLS]\d{1,2})\s*(?:-|to|through|thru|2|two)\s*([CTLS]\s*\d{1,2})\b/gi,
            (match, start, end) => {
                // Remove any spaces from the end part "C 5" → "C5"
                const cleanEnd = end.replace(/\s+/g, '').toUpperCase();
                return `${start.toUpperCase()}-${cleanEnd}`;
            }
        );
        
        // Pattern 3: Adjacent vertebrae - "C1 C2" → "C1/C2"
        result = result.replace(/\b([CTLS])(\d{1,2})\s+([CTLS])(\d{1,2})\b/g,
            (match, letter1, num1, letter2, num2) => {
                const L1 = letter1.toUpperCase();
                const L2 = letter2.toUpperCase();
                const n1 = parseInt(num1);
                const n2 = parseInt(num2);
                
                // Check for transition levels (special anatomical junctions)
                const isTransition = 
                    (L1 === 'C' && n1 === 7 && L2 === 'T' && n2 === 1) || // C7/T1
                    (L1 === 'T' && n1 === 1 && L2 === 'C' && n2 === 7) || // T1/C7 (reverse)
                    (L1 === 'T' && n1 === 12 && L2 === 'L' && n2 === 1) || // T12/L1
                    (L1 === 'L' && n1 === 1 && L2 === 'T' && n2 === 12) || // L1/T12 (reverse)
                    (L1 === 'L' && n1 === 5 && L2 === 'S' && n2 === 1) || // L5/S1
                    (L1 === 'S' && n1 === 1 && L2 === 'L' && n2 === 5);   // S1/L5 (reverse)
                
                // Allow if transition level OR same spine region within 3 levels
                // Use HYPHEN (-) for ranges, not slash (/)
                if (isTransition) {
                    return `${L1}${n1}-${L2}${n2}`;
                } else if (L1 === L2 && Math.abs(n2 - n1) <= 3) {
                    return `${L1}${n1}-${L2}${n2}`;
                }
                
                return match; // Keep original if not adjacent or transition
            }
        );
        
        return result;
    }
    
    /**
     * Auto-correct anatomically impossible spinal level combinations
     * Fixes Whisper transcription errors by using medical knowledge
     * 
     * WHISPER MISHEARS:
     * - "twelve" → "one" or "two" (sounds similar)
     * - Creates impossible combinations like "T1-L1" (should be "T12-L1")
     * 
     * MEDICAL AUTO-CORRECTION:
     * - T1-L1 → T12-L1 (thoracolumbar junction)
     * - C1-T1 → C7-T1 (cervicothoracic junction)
     * - L1-S1 → L5-S1 (lumbosacral junction)
     * - Also handles reverse order and missing hyphens
     * 
     * @param {string} text - Text containing spinal level references
     * @returns {string} - Text with medically correct spinal levels
     */
    correctAnatomicallyImpossibleLevels(text) {
        if (!text) return text;
        
        let result = text;
        
        // ═══ THORACOLUMBAR JUNCTION: T12-L1 (most common) ═══
        // "T1-L1" or "T1 L1" or "T2-L1" → "T12-L1"
        result = result.replace(/\bT[12][\s\-,]*L1\b/gi, 'T12-L1');
        result = result.replace(/\bL1[\s\-,]*T[12]\b/gi, 'T12-L1'); // Reverse order
        
        // ═══ CERVICOTHORACIC JUNCTION: C7-T1 ═══
        // "C1-T1" or "C1 T1" → "C7-T1"
        result = result.replace(/\bC1[\s\-,]*T1\b/gi, 'C7-T1');
        result = result.replace(/\bT1[\s\-,]*C1\b/gi, 'C7-T1'); // Reverse order
        
        // ═══ LUMBOSACRAL JUNCTION: L5-S1 ═══
        // "L1-S1" or "L1 S1" → "L5-S1"
        result = result.replace(/\bL1[\s\-,]*S1\b/gi, 'L5-S1');
        result = result.replace(/\bS1[\s\-,]*L1\b/gi, 'L5-S1'); // Reverse order
        
        // ═══ ENSURE CONSISTENT HYPHENATION FOR ALL TRANSITION LEVELS ═══
        // Handle all cases: adjacent (C7T1), spaced (C7 T1), comma (C7,T1), already hyphenated (C7-T1)
        
        // Pattern 1: Adjacent levels with NO separator - "C7T1" → "C7-T1"
        result = result.replace(/\b(C7)(T1)\b/gi, '$1-$2');
        result = result.replace(/\b(T12)(L1)\b/gi, '$1-$2');
        result = result.replace(/\b(L5)(S1)\b/gi, '$1-$2');
        
        // Pattern 2: Levels with space or comma - "C7 T1" or "C7, T1" → "C7-T1"
        result = result.replace(/\b(C7)[\s,]+(T1)\b/gi, '$1-$2');
        result = result.replace(/\b(T12)[\s,]+(L1)\b/gi, '$1-$2');
        result = result.replace(/\b(L5)[\s,]+(S1)\b/gi, '$1-$2');
        
        // ═══ SACRAL LEVEL NORMALIZATION (S1-S5) ═══
        // Handle all sacral level combinations: adjacent, spaced, comma-separated
        // S1S2, S1 S2, S1, S2 → S1-S2
        
        // Adjacent sacral levels: "S1S2" → "S1-S2"
        result = result.replace(/\b(S[1-5])(S[1-5])\b/gi, '$1-$2');
        
        // Space or comma separated sacral levels: "S1 S2" or "S1, S2" → "S1-S2"
        result = result.replace(/\b(S[1-5])[\s,]+(S[1-5])\b/gi, '$1-$2');
        
        return result;
    }

    /**
     * Format MRI sequence terminology for radiology reports
     * Converts spoken MRI sequences to standard nomenclature
     * CRITICAL FIX: Don't interfere with spinal levels (T1-T12, L1-L5, etc.)
     * @param {string} text - Text containing MRI sequences
     * @returns {string} - Text with formatted MRI sequences
     */
    formatMRISequences(text) {
        let result = text;
        
        // Pattern 1: T1/T2 sequences - "T one" → "T1", "T two weighted" → "T2-weighted"
        // CRITICAL: These patterns run AFTER spinal levels are formatted (T12, L1, etc.)
        result = result.replace(/\bT\s+(one|1)\s+weighted\b/gi, 'T1-weighted');
        result = result.replace(/\bT\s+(two|2)\s+weighted\b/gi, 'T2-weighted');
        
        // CRITICAL FIX: Only match MRI sequences in proper context, NOT spinal levels
        // Match "T one" or "T two" ONLY when followed by MRI context words or at end of sentence
        // Negative lookbehind prevents matching spinal levels like "vertebral T1"
        result = result.replace(/\bT\s+(one|1)\b(?=\s+(image|sequence|scan|MRI|axial|sagittal|coronal)|[.,;]|\s*$)/gi, 'T1');
        result = result.replace(/\bT\s+(two|2)\b(?=\s+(image|sequence|scan|MRI|axial|sagittal|coronal|star)|[.,;]|\s*$)/gi, 'T2');
        
        // Pattern 2: T2 star - "T two star" → "T2*"
        result = result.replace(/\bT\s*(two|2)\s*star\b/gi, 'T2*');
        result = result.replace(/\bT2\s*star\b/gi, 'T2*');
        
        // Pattern 3: Common MRI sequences (ensure uppercase)
        const sequences = {
            'flair': 'FLAIR',
            'dwi': 'DWI',
            'adc': 'ADC',
            'gre': 'GRE',
            'stir': 'STIR',
            'pdw': 'PDW',
            'pd': 'PD',
            'swi': 'SWI',
            'tof': 'TOF',
            'fiesta': 'FIESTA',
            'ssfp': 'SSFP',
            'mprage': 'MPRAGE',
            'spgr': 'SPGR',
            'fse': 'FSE',
            'tse': 'TSE'
        };
        
        for (const [spoken, correct] of Object.entries(sequences)) {
            const regex = new RegExp(`\\b${spoken}\\b`, 'gi');
            result = result.replace(regex, correct);
        }
        
        // Pattern 4: Contrast-related terms
        result = result.replace(/\bpost\s*contrast\b/gi, 'post-contrast');
        result = result.replace(/\bpre\s*contrast\b/gi, 'pre-contrast');
        result = result.replace(/\bgadolinium\s*enhanced\b/gi, 'gadolinium-enhanced');
        result = result.replace(/\bcontrast\s*enhanced\b/gi, 'contrast-enhanced');
        
        // Pattern 5: Fat suppression terms
        result = result.replace(/\bfat\s*sat\b/gi, 'fat-saturated');
        result = result.replace(/\bfat\s*saturated\b/gi, 'fat-saturated');
        result = result.replace(/\bfat\s*suppressed\b/gi, 'fat-suppressed');
        result = result.replace(/\bfs\b/gi, 'fat-saturated');
        
        // Pattern 6: Diffusion sequences
        result = result.replace(/\bdiffusion\s*weighted\b/gi, 'diffusion-weighted');
        result = result.replace(/\bapparent\s*diffusion\s*coefficient\b/gi, 'apparent diffusion coefficient (ADC)');
        
        // Pattern 7: Gradient echo variations
        result = result.replace(/\bgradient\s*echo\b/gi, 'gradient echo');
        result = result.replace(/\bgradient\s*recalled\s*echo\b/gi, 'gradient recalled echo (GRE)');
        
        // Pattern 8: Common sequences with hyphens
        result = result.replace(/\bfluid\s*attenuated\s*inversion\s*recovery\b/gi, 'fluid-attenuated inversion recovery (FLAIR)');
        result = result.replace(/\bshort\s*ti\s*inversion\s*recovery\b/gi, 'short TI inversion recovery (STIR)');
        result = result.replace(/\btime\s*of\s*flight\b/gi, 'time-of-flight (TOF)');
        
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1: UNIVERSAL PRE-PROCESSING
    // These run FIRST on ALL text before any other pipelines
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Get simple number mapping (simplified version)
     * @returns {Object} - Word to digit mapping
     */
    getSimpleNumberMap() {
        return {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
            'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
            'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
            'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
            'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50',
            'sixty': '60', 'seventy': '70', 'eighty': '80', 'ninety': '90'
        };
    }
    
    /**
     * ENHANCED number normalization with compound number support
     * "two point five" → "2.5", "seventy five" → "75", "twenty five" → "25"
     * This runs FIRST, converting ALL number words to digits in one pass
     */
    normalizeNumbers(text) {
        if (!text) return text;
        
        let result = text;
        
        // PROTECT "one" in pronoun contexts (where it's not a counting number)
        // Examples: "the first one", "the last one", "this one", "that one", "the old one"
        // These use "one" as a pronoun (stand-in for a noun), not a numeral
        // NOTE: We use explicit whitelists to avoid over-matching numeric phrases
        const pronounOnePatterns = [
            // After ordinals: "the first one", "the second one", "the last one", etc.
            /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|last|next|previous|penultimate|ultimate|final|only)\s+one\b/gi,
            // After specific adjectives (whitelist): "the old one", "the new one", "the big one", etc.
            // Only common adjectives that typically precede pronoun "one"
            /\b(the|a|an)\s+(old|new|big|small|large|little|good|bad|best|worst|right|wrong|same|other|different|better|worse|red|blue|green|black|white|original|correct|incorrect|proper|normal|abnormal)\s+one\b/gi,
            // Demonstratives: "this one", "that one", "which one"
            /\b(this|that|which)\s+one\b/gi,
            // Quantifiers with pronoun "one": "each one", "every one", "any one", "another one"
            /\b(each|every|any|another|either|neither)\s+one\b/gi,
            // "no one" phrase
            /\bno\s+one\b/gi
        ];
        // NOTE: "one of" is intentionally NOT protected - "one of three" should become "1 of 3"
        // NOTE: "the one" by itself is NOT protected - could be numeric in "the one lesion"
        
        // Use placeholder to protect pronoun "one" from conversion
        const PLACEHOLDER = '__PRONOUN_ONE__';
        
        for (const pattern of pronounOnePatterns) {
            result = result.replace(pattern, (match) => {
                return match.replace(/\bone\b/gi, PLACEHOLDER);
            });
        }
        
        // FIRST: Handle compound numbers like "twenty five" → "25"
        const compoundNumbers = {
            'twenty one': '21', 'twenty two': '22', 'twenty three': '23', 'twenty four': '24',
            'twenty five': '25', 'twenty six': '26', 'twenty seven': '27', 'twenty eight': '28', 'twenty nine': '29',
            'thirty one': '31', 'thirty two': '32', 'thirty three': '33', 'thirty four': '34',
            'thirty five': '35', 'thirty six': '36', 'thirty seven': '37', 'thirty eight': '38', 'thirty nine': '39',
            'forty one': '41', 'forty two': '42', 'forty three': '43', 'forty four': '44',
            'forty five': '45', 'forty six': '46', 'forty seven': '47', 'forty eight': '48', 'forty nine': '49',
            'fifty one': '51', 'fifty two': '52', 'fifty three': '53', 'fifty four': '54',
            'fifty five': '55', 'fifty six': '56', 'fifty seven': '57', 'fifty eight': '58', 'fifty nine': '59',
            'sixty one': '61', 'sixty two': '62', 'sixty three': '63', 'sixty four': '64',
            'sixty five': '65', 'sixty six': '66', 'sixty seven': '67', 'sixty eight': '68', 'sixty nine': '69',
            'seventy one': '71', 'seventy two': '72', 'seventy three': '73', 'seventy four': '74',
            'seventy five': '75', 'seventy six': '76', 'seventy seven': '77', 'seventy eight': '78', 'seventy nine': '79',
            'eighty one': '81', 'eighty two': '82', 'eighty three': '83', 'eighty four': '84',
            'eighty five': '85', 'eighty six': '86', 'eighty seven': '87', 'eighty eight': '88', 'eighty nine': '89',
            'ninety one': '91', 'ninety two': '92', 'ninety three': '93', 'ninety four': '94',
            'ninety five': '95', 'ninety six': '96', 'ninety seven': '97', 'ninety eight': '98', 'ninety nine': '99'
        };
        
        for (const [compound, digit] of Object.entries(compoundNumbers)) {
            const regex = new RegExp(`\\b${compound}\\b`, 'gi');
            result = result.replace(regex, digit);
        }
        
        // SECOND: Handle hundreds and thousands BEFORE simple numbers
        // "one hundred" → "100", "two thousand" → "2000", etc.
        const multiplierPatterns = [
            // Hundreds: "one hundred" through "nine hundred"
            ['one hundred', '100'], ['two hundred', '200'], ['three hundred', '300'],
            ['four hundred', '400'], ['five hundred', '500'], ['six hundred', '600'],
            ['seven hundred', '700'], ['eight hundred', '800'], ['nine hundred', '900'],
            // Thousands: "one thousand" through "nine thousand"
            ['one thousand', '1000'], ['two thousand', '2000'], ['three thousand', '3000'],
            ['four thousand', '4000'], ['five thousand', '5000'], ['six thousand', '6000'],
            ['seven thousand', '7000'], ['eight thousand', '8000'], ['nine thousand', '9000']
        ];
        
        for (const [phrase, value] of multiplierPatterns) {
            const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
            result = result.replace(regex, value);
        }
        
        // THIRD: Simple number replacements
        const numberMap = this.getSimpleNumberMap();
        for (const [word, digit] of Object.entries(numberMap)) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            result = result.replace(regex, digit);
        }
        
        // FOURTH: Handle decimals "point five" → ".5"
        result = result.replace(/\bpoint\s+(\d+(?:\s+\d+)*)\b/gi, (match, digits) => {
            const decimalPart = digits.replace(/\s+/g, '');
            return `.${decimalPart}`;
        });
        
        // FIFTH: Clean up spacing around decimal points (e.g., "1 .5" → "1.5")
        result = result.replace(/(\d)\s+\.(\d)/g, '$1.$2');
        
        // RESTORE protected pronoun "one" back from placeholder
        result = result.replace(/__PRONOUN_ONE__/g, 'one');
        
        return result;
    }
    
    /**
     * Normalize ordinal words to cardinal numbers for DATE PARSING ONLY
     * "first July 2025" → "1 July 2025", "twenty-first January" → "21 January"
     * This runs AFTER normalizeNumbers but BEFORE date conversion
     * 
     * IMPORTANT: Only converts ordinals in date contexts (near month names)
     * to avoid breaking phrases like "the first one" → "the 1 one"
     */
    normalizeOrdinals(text) {
        if (!text) return text;
        
        let result = text;
        
        // Month names for context detection (full and abbreviated)
        const months = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec';
        
        // Ordinal to cardinal mapping
        const ordinalMap = {
            // Simple ordinals (1-19)
            'first': '1', 'second': '2', 'third': '3', 'fourth': '4', 'fifth': '5',
            'sixth': '6', 'seventh': '7', 'eighth': '8', 'ninth': '9', 'tenth': '10',
            'eleventh': '11', 'twelfth': '12', 'thirteenth': '13', 'fourteenth': '14',
            'fifteenth': '15', 'sixteenth': '16', 'seventeenth': '17', 'eighteenth': '18',
            'nineteenth': '19',
            // Tens
            'twentieth': '20', 'thirtieth': '30',
            // Compound ordinals (21-31)
            'twenty first': '21', 'twenty second': '22', 'twenty third': '23',
            'twenty fourth': '24', 'twenty fifth': '25', 'twenty sixth': '26',
            'twenty seventh': '27', 'twenty eighth': '28', 'twenty ninth': '29',
            'thirty first': '31'
        };
        
        // Also handle numeric+ordinal patterns from normalizeNumbers
        // "20 first" → "21", etc. (only in date contexts)
        const numericOrdinalMap = {
            '20 first': '21', '20 second': '22', '20 third': '23', '20 fourth': '24',
            '20 fifth': '25', '20 sixth': '26', '20 seventh': '27', '20 eighth': '28', '20 ninth': '29',
            '30 first': '31'
        };
        
        // Pattern 1: Ordinal BEFORE month - "first July" → "1 July", "twenty first January" → "21 January"
        // Handle compound ordinals first (longer matches before shorter)
        const sortedOrdinals = Object.entries(ordinalMap).sort((a, b) => b[0].length - a[0].length);
        for (const [ordinal, cardinal] of sortedOrdinals) {
            const regex = new RegExp(`\\b(${ordinal})\\s+(${months})\\b`, 'gi');
            result = result.replace(regex, `${cardinal} $2`);
        }
        
        // Pattern 2: Ordinal AFTER month - "July first" → "July 1"
        for (const [ordinal, cardinal] of Object.entries(ordinalMap)) {
            const regex = new RegExp(`\\b(${months})\\s+(${ordinal})\\b`, 'gi');
            result = result.replace(regex, `$1 ${cardinal}`);
        }
        
        // Pattern 3: "the Xth of Month" - "the first of July" → "the 1 of July"
        for (const [ordinal, cardinal] of Object.entries(ordinalMap)) {
            const regex = new RegExp(`\\bthe\\s+(${ordinal})\\s+of\\s+(${months})\\b`, 'gi');
            result = result.replace(regex, `the ${cardinal} of $2`);
        }
        
        // Pattern 4: Numeric+ordinal before month - "20 first January" → "21 January"
        for (const [pattern, value] of Object.entries(numericOrdinalMap)) {
            const regex = new RegExp(`\\b(${pattern})\\s+(${months})\\b`, 'gi');
            result = result.replace(regex, `${value} $2`);
        }
        
        return result;
    }
    
    /**
     * Fix Vosk's spaced decimal tokenization
     * Vosk outputs "2 .5" or "8 .3" - join them to "2.5" and "8.3"
     * This runs immediately after normalizeNumbers
     */
    fixDecimalSpacing(text) {
        if (!text) return text;
        
        let result = text;
        
        // Pattern 1: "2 .5" → "2.5" (digit space dot digit)
        result = result.replace(/(\d)\s*\.\s*(\d)/g, '$1.$2');
        
        // Pattern 2: " .5" → ".5" (space dot digit at start or after space)
        result = result.replace(/\s+\.(\d)/g, '.$1');
        
        return result;
    }
    
    /**
     * Normalize medical unit variations to standard abbreviations
     * Handles spelling variants and misrecognitions from Vosk
     * "centimetres" → "cm", "hausfeld" → "HU", etc.
     */
    normalizeUnits(text) {
        if (!text) return text;
        
        let result = text;
        
        // Normalize unit words to abbreviations
        result = result
            .replace(/\b(centimet(?:er|re)s?)\b/gi, 'cm')
            .replace(/\b(millimet(?:er|re)s?)\b/gi, 'mm')
            .replace(/\b(?:houns?field(?:\s+units?)?|haus\s*feld(?:\s+units?)?)\b/gi, 'HU');
        
        // Tighten spacing between numbers and units: "5-10 cm" → "5-10cm"
        result = result.replace(/(\d(?:\.\d+)?(?:-\d(?:\.\d+)?)?)\s*(cm|mm|HU)\b/gi, '$1$2');
        
        return result;
    }
    
    /**
     * SPECIALIZED range detection that handles the "five to ten" → "5-10" conversion
     * This runs AFTER number normalization but BEFORE measurement formatting
     * Now both sides are digits: "5 to 10" → "5-10"
     */
    convertNumberRanges(text) {
        if (!text) return text;
        
        let result = text;
        
        // Handle "5 to 10" → "5-10" (numbers already normalized)
        result = result.replace(/(\d+(?:\.\d+)?)\s+to\s+(\d+(?:\.\d+)?)/gi, '$1-$2');
        result = result.replace(/(\d+(?:\.\d+)?)\s+through\s+(\d+(?:\.\d+)?)/gi, '$1-$2');
        
        return result;
    }
    
    /**
     * Normalize punctuation commands
     * "period comma new line" → ". , \n"
     */
    normalizePunctuation(text) {
        if (!text) return text;
        
        let result = text;
        
        // Punctuation commands (word boundaries to avoid partial matches)
        result = result.replace(/\b(new paragraph|paragraph)\b/gi, '\n\n');
        result = result.replace(/\b(new line|line break)\b/gi, '\n');
        
        // NOTE: "period", "comma", "semicolon", and "colon" are handled by voice command system
        // Backend voice commands strip the word and insert the actual punctuation mark
        // This prevents duplication and avoids "colon" word (anatomical) being converted to ":"
        // Users must say "insert colon" or "semicolon" explicitly for punctuation
        result = result.replace(/\bquestion mark\b/gi, '?');
        result = result.replace(/\bexclamation mark\b/gi, '!');
        result = result.replace(/\bhyphen\b/gi, '-');
        result = result.replace(/\bdash\b/gi, '–');
        result = result.replace(/\bopen paren\b/gi, '(');
        result = result.replace(/\bclose paren\b/gi, ')');
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2: MEASUREMENTS & QUANTIFICATION
    // Handle all measurement formats after numbers are normalized
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * ROBUST Basic 1D measurements with unit-first normalization
     * "five to ten centimeters" → "5-10cm"
     * Fixed pipeline order: normalize units FIRST, then collapse ranges, then tighten spacing
     */
    convertBasicMeasurements(text) {
        if (!text) return text;
        
        let result = text;
        
        // Substage A: FIRST - Normalize ALL units to abbreviations globally (including plurals/variations)
        const unitMap = {
            // Length units with plural variations
            'millimeters': 'mm', 'millimeter': 'mm', 'mms': 'mm',
            'centimeters': 'cm', 'centimeter': 'cm', 'cms': 'cm',
            'meters': 'm', 'meter': 'm',
            'inches': 'in', 'inch': 'in',
            
            // Radiology-specific units
            'hounsfield units': 'HU', 'hounsfield unit': 'HU', 'hounsfield': 'HU',
            'degrees': '°', 'degree': '°',
            
            // Volume units with plural variations
            'milliliters': 'ml', 'milliliter': 'ml', 'mls': 'ml',
            'liters': 'L', 'liter': 'L',
            'cubic centimeters': 'cc', 'cubic centimeter': 'cc', 'ccs': 'cc',
            'centimeters cubed': 'cm³', 'centimeter cubed': 'cm³'
        };
        
        // Replace all long-form units globally
        for (const [longForm, abbr] of Object.entries(unitMap)) {
            const regex = new RegExp(`\\b${longForm}\\b`, 'gi');
            result = result.replace(regex, abbr);
        }
        
        // Substage B: SECOND - Collapse ranges with normalized units
        // Pattern 1: "5-10 cm" or "5 to 10 cm" (already has range connector)
        result = result.replace(/(\d+(?:\.\d+)?)\s*(?:-|to|through)\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|in|HU|°|ml|L|cc|cm³)\b/gi,
            (match, num1, num2, unit) => `${num1}-${num2}${unit}`
        );
        
        // Pattern 2: "5 cm to 10 cm" (repeated unit on both sides)
        result = result.replace(/(\d+(?:\.\d+)?)\s*(mm|cm|m|in|HU|°|ml|L|cc|cm³)\s*(?:to|through)\s*(\d+(?:\.\d+)?)\s*\2\b/gi,
            (match, num1, unit, num2) => `${num1}-${num2}${unit}`
        );
        
        // Substage C: THIRD - Remove spaces between numbers and units (final cleanup)
        result = result.replace(/(\d+(?:\.\d+)?)\s+(mm|cm|m|in|HU|°|ml|L|cc|cm³)\b/gi,
            (match, num, unit) => `${num}${unit}`
        );
        
        // Substage D: Modifiers
        result = result.replace(/(approximately|about|roughly|around)\s+(\d+(?:\.\d+)?)(mm|cm|m|in)\b/gi,
            (match, modifier, num, unit) => `~${num}${unit}`
        );
        result = result.replace(/(up to|less than|maximum|no more than)\s+(\d+(?:\.\d+)?)(mm|cm|m|in)\b/gi,
            (match, modifier, num, unit) => `≤${num}${unit}`
        );
        result = result.replace(/(at least|more than|minimum|greater than)\s+(\d+(?:\.\d+)?)(mm|cm|m|in)\b/gi,
            (match, modifier, num, unit) => `≥${num}${unit}`
        );
        
        return result;
    }
    
    /**
     * 2D and 3D measurements
     * "10 by 15 mm" → "10 x 15 mm", "5 by 6 by 7 cm" → "5 x 6 x 7 cm"
     */
    convert2D3DMeasurements(text) {
        if (!text) return text;
        
        let result = text;
        
        // 3D dimensions: "5 by 6 by 7 cm" → "5x6x7cm" (no spaces)
        result = result.replace(/(\d+(?:\.\d+)?)\s*by\s*(\d+(?:\.\d+)?)\s*by\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|in)\b/gi,
            (match, d1, d2, d3, unit) => `${d1}x${d2}x${d3}${unit}`
        );
        
        // 2D dimensions: "10 by 15 mm" → "10x15mm" (no spaces)
        result = result.replace(/(\d+(?:\.\d+)?)\s*by\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|in)\b/gi,
            (match, d1, d2, unit) => `${d1}x${d2}${unit}`
        );
        
        // Also handle existing "x" patterns with spaces: "2 x 3 mm" → "2x3mm"
        result = result.replace(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|in)\b/gi,
            (match, d1, d2, d3, unit) => `${d1}x${d2}x${d3}${unit}`
        );
        result = result.replace(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|in)\b/gi,
            (match, d1, d2, unit) => `${d1}x${d2}${unit}`
        );
        
        // Volume measurements: "55 cubic centimeters" → "55cm³"
        result = result.replace(/(\d+(?:\.\d+)?)\s*(cc|cm³|ml)\b/gi,
            (match, num, unit) => `${num}${unit}`
        );
        
        return result;
    }
    
    /**
     * Continuous scales (HU, signal intensity, percentages)
     * "forty five Hounsfield units" → "45 Hounsfield units"
     * "eighty percent stenosis" → "80% stenosis"
     */
    convertContinuousScales(text) {
        if (!text) return text;
        
        let result = text;
        
        // Numbers already normalized, just handle formatting
        
        // Hounsfield units formatting
        result = result.replace(/(\d+)\s*Hounsfield\s*units?\b/gi, '$1 HU');
        result = result.replace(/(\d+)\s*HU\b/gi, '$1 HU');
        
        // Percentage formatting: "80 percent" → "80%"
        result = result.replace(/(\d+(?:\.\d+)?)\s*percent\b/gi, '$1%');
        
        // Signal intensity (keep numbers with "signal intensity")
        result = result.replace(/signal\s*intensity\s*of\s*(\d+)/gi, 'signal intensity of $1');
        
        return result;
    }
    
    /**
     * Discrete scales (grades, scores)
     * "grade three" → "grade 3", "score five out of five" → "score 5/5"
     */
    convertDiscreteScales(text) {
        if (!text) return text;
        
        let result = text;
        
        // Numbers already normalized, format specific scales
        
        // Grading systems: "grade 3", "grade III" preservation
        result = result.replace(/grade\s+(\d+)/gi, 'grade $1');
        
        // Scoring systems: "score 5 out of 5" → "score 5/5"
        result = result.replace(/score\s+(\d+)\s+out\s+of\s+(\d+)/gi, 'score $1/$2');
        result = result.replace(/(\d+)\s+out\s+of\s+(\d+)/gi, '$1/$2');
        
        // PI-RADS, BI-RADS, etc.
        result = result.replace(/(PI-RADS|BI-RADS|TI-RADS)\s+score\s+(\d+)/gi, '$1 score $2');
        result = result.replace(/(PI-RADS|BI-RADS|TI-RADS)\s+(\d+)/gi, '$1 $2');
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3: ANATOMICAL & SPINE-SPECIFIC
    // Handle vertebrae, discs, and anatomical structures
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Single vertebral levels
     * "vertebral body L three" → "vertebral body L3"
     */
    formatSingleVertebrae(text) {
        if (!text) return text;
        
        let result = text;
        
        // Numbers already normalized, format spine labels
        // C1-C7, T1-T12, L1-L5, S1-S5
        result = result.replace(/\b([CTLS])\s*(\d{1,2})\b/gi, '$1$2');
        
        return result;
    }
    
    /**
     * Intervertebral disc spaces
     * "disc space L four L five" → "disc space L4-L5"
     * CRITICAL FIX: Handle Whisper auto-punctuation commas: "T12, L1" → "T12-L1"
     */
    formatDiscSpaces(text) {
        if (!text) return text;
        
        let result = text;
        
        // WHISPER AUTO-PUNCTUATION FIX: Handle comma-separated spinal levels
        // "T12, L1 disc" → "T12-L1 disc", "T12, L1 intervertebral" → "T12-L1 intervertebral"
        result = result.replace(/\b([CTLS]\d{1,2}),\s*([CTLS]\d{1,2})\s+(disc|intervertebral|level)/gi, '$1-$2 $3');
        result = result.replace(/\b([CTLS]\d{1,2}),\s*([CTLS]\d{1,2})\b/gi, '$1-$2');
        
        // Original patterns: space-separated levels
        result = result.replace(/\b([CTLS]\d{1,2})\s+([CTLS]\d{1,2})\s+disc/gi, '$1-$2 disc');
        result = result.replace(/disc\s+space\s+([CTLS]\d{1,2})\s+([CTLS]\d{1,2})/gi, 'disc space $1-$2');
        result = result.replace(/\b([CTLS]\d{1,2})\s*-?\s*([CTLS]\d{1,2})\s+disc/gi, '$1-$2 disc');
        
        return result;
    }
    
    /**
     * Normalize consecutive vertebral levels from comma to dash
     * "C1, C2" → "C1-C2", "L1, L2" → "L1-L2", "T12, L1" → "T12-L1"
     * Handles ALL consecutive spinal levels: C1-C7, T1-T12, L1-L5, S1-S5
     */
    normalizeConsecutiveVertebralLevels(text) {
        if (!text) return text;
        
        let result = text;
        
        // Helper function to check if two vertebral levels are consecutive
        const areConsecutive = (letter1, num1, letter2, num2) => {
            // Same letter, consecutive numbers
            if (letter1 === letter2 && parseInt(num2) === parseInt(num1) + 1) {
                return true;
            }
            // Transition levels: C7-T1, T12-L1, L5-S1
            if (letter1 === 'C' && num1 === '7' && letter2 === 'T' && num2 === '1') return true;
            if (letter1 === 'T' && num1 === '12' && letter2 === 'L' && num2 === '1') return true;
            if (letter1 === 'L' && num1 === '5' && letter2 === 'S' && num2 === '1') return true;
            return false;
        };
        
        // Normalize ALL comma-separated consecutive vertebral levels to dashes
        // This handles: "C1, C2", "T11, T12", "L4, L5", "T12, L1", etc.
        result = result.replace(/\b([CTLS])(\d{1,2}),\s*([CTLS])(\d{1,2})\b/gi, 
            (match, letter1, num1, letter2, num2) => {
                const L1 = letter1.toUpperCase();
                const L2 = letter2.toUpperCase();
                
                // If consecutive, convert to dash
                if (areConsecutive(L1, num1, L2, num2)) {
                    return `${L1}${num1}-${L2}${num2}`;
                }
                
                // Not consecutive, keep original format (without comma for clarity)
                return `${L1}${num1}, ${L2}${num2}`;
            }
        );
        
        return result;
    }
    
    /**
     * Vertebral level ranges
     * "vertebral levels T eight to L one" → "vertebral levels T8-L1"
     * CRITICAL FIX: Handle Whisper auto-punctuation commas
     */
    formatVertebralRanges(text) {
        if (!text) return text;
        
        let result = text;
        
        // WHISPER AUTO-PUNCTUATION FIX: Handle comma-separated vertebral levels
        // "vertebral levels T12, L1" → "vertebral levels T12-L1"
        result = result.replace(/(vertebral\s+levels?|levels?)\s+([CTLS]\d{1,2}),\s*([CTLS]\d{1,2})/gi, '$1 $2-$3');
        
        // Range notation: "C3 to C7" → "C3-C7"
        result = result.replace(/\b([CTLS]\d{1,2})\s+to\s+([CTLS]\d{1,2})/gi, '$1-$2');
        result = result.replace(/\b([CTLS]\d{1,2})\s+through\s+([CTLS]\d{1,2})/gi, '$1-$2');
        result = result.replace(/from\s+([CTLS]\d{1,2})\s+to\s+([CTLS]\d{1,2})/gi, 'from $1-$2');
        
        return result;
    }
    
    /**
     * Nerve roots
     * "the left C six nerve root" → "the left C6 nerve root"
     */
    formatNerveRoots(text) {
        if (!text) return text;
        
        let result = text;
        
        // Nerve root formatting (numbers already normalized)
        result = result.replace(/\b([CTLS])\s*(\d{1,2})\s+nerve\s+root/gi, '$1$2 nerve root');
        result = result.replace(/\b([CTLS])\s*(\d{1,2})\s+nerve/gi, '$1$2 nerve');
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 4: TEMPORAL
    // Handle dates, intervals, and time references
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Comparison intervals
     * "compared to the prior study from six months ago" → "compared to the prior study from 6 months ago"
     */
    convertComparisonIntervals(text) {
        if (!text) return text;
        
        let result = text;
        
        // Numbers already normalized, format time intervals
        result = result.replace(/(\d+)\s+(days?|weeks?|months?|years?)\s+ago/gi, '$1 $2 ago');
        result = result.replace(/(\d+)\s+(days?|weeks?|months?|years?)\s+prior/gi, '$1 $2 prior');
        
        // Hyphenate follow-up intervals: "6 month follow up" → "6-month follow-up"
        result = result.replace(/(\d+)\s+(day|week|month|year)\s+follow\s*up/gi, '$1-$2 follow-up');
        
        return result;
    }
    
    /**
     * Clock face positions
     * "a mass at the two o'clock position" → "a mass at the 2:00 position"
     */
    convertClockFacePositions(text) {
        if (!text) return text;
        
        let result = text;
        
        // Clock face with minutes: "2 thirty position" → "2:30 position"
        // Numbers already converted by normalizeNumbers: "two" → "2", "thirty" → "30"
        result = result.replace(/(\d{1,2})\s+(\d{2})\s+(position|breast|lesion)/gi, '$1:$2 $3');
        
        // Standard clock face: "2 o'clock" → "2 o'clock" (preserve readable format)
        result = result.replace(/(\d{1,2})\s*o'?clock/gi, '$1 o\'clock');
        
        // Range: "from 10 to 12 o'clock" → "from 10 o'clock to 12 o'clock"
        result = result.replace(/from\s+(\d{1,2})\s+o'clock\s+to\s+(\d{1,2})\s+o'clock/gi, 'from $1 o\'clock to $2 o\'clock');
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 5: MRI/IMAGING PROTOCOLS
    // Handle sequence naming and contrast phases
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Standardize sequence names
     * "T two weighted images" → "T2-weighted images"
     */
    standardizeSequenceNames(text) {
        if (!text) return text;
        
        let result = text;
        
        // Numbers already normalized: "T1", "T2"
        result = result.replace(/\bT\s*(\d)\s*weighted/gi, 'T$1-weighted');
        result = result.replace(/\bT\s*(\d)\b/gi, 'T$1');
        
        // Common sequences
        result = result.replace(/\bF\s*L\s*A\s*I\s*R\b/gi, 'FLAIR');
        result = result.replace(/\bD\s*W\s*I\b/gi, 'DWI');
        result = result.replace(/\bS\s*T\s*I\s*R\b/gi, 'STIR');
        result = result.replace(/\bA\s*D\s*C\b/gi, 'ADC');
        result = result.replace(/\bS\s*W\s*I\b/gi, 'SWI');
        
        // Abbreviate common sequences
        result = result.replace(/\bdiffusion weighted imaging\b/gi, 'DWI');
        result = result.replace(/\bgradient echo\b/gi, 'GRE');
        result = result.replace(/\bsusceptibility weighted imaging\b/gi, 'SWI');
        
        // Hyphenate multi-word sequences
        result = result.replace(/\bfluid attenuated inversion recovery\b/gi, 'fluid-attenuated inversion recovery');
        result = result.replace(/\bproton density weighted\b/gi, 'proton density-weighted');
        
        // Capitalize imaging modalities
        result = result.replace(/\bct\s+(scan|brain|chest|abdomen|pelvis|spine)/gi, 'CT $1');
        result = result.replace(/\bmri\s+(scan|brain|chest|abdomen|pelvis|spine)/gi, 'MRI $1');
        
        return result;
    }
    
    /**
     * Standardize contrast phases
     * "post contrast" → "post-contrast"
     */
    standardizeContrastPhases(text) {
        if (!text) return text;
        
        let result = text;
        
        // Hyphenate contrast phases
        result = result.replace(/\bpost\s+contrast\b/gi, 'post-contrast');
        result = result.replace(/\bpre\s+contrast\b/gi, 'pre-contrast');
        result = result.replace(/\bnon\s+contrast\b/gi, 'non-contrast');
        result = result.replace(/\bcontrast\s+enhanced\b/gi, 'contrast-enhanced');
        
        // Phases
        result = result.replace(/\barterial\s+phase\b/gi, 'arterial phase');
        result = result.replace(/\bvenous\s+phase\b/gi, 'venous phase');
        result = result.replace(/\bdelayed\s+phase\b/gi, 'delayed phase');
        result = result.replace(/\bportal\s+venous\s+phase\b/gi, 'portal venous phase');
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 6: CLINICAL HISTORY & DEMOGRAPHICS
    // Handle patient descriptors
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Format clinical descriptors
     * "a forty five year old female" → "a 45-year-old female"
     */
    formatClinicalDescriptors(text) {
        if (!text) return text;
        
        let result = text;
        
        // Numbers already normalized: "45 year old" → "45-year-old"
        result = result.replace(/(\d+)\s+year\s+old/gi, '$1-year-old');
        result = result.replace(/(\d+)\s+yo\b/gi, '$1-year-old');
        
        // Keep "diagnosed in 2018" as is (numbers already normalized)
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 7: SPECIALIZED RADIOLOGY LEXICON
    // Handle abbreviations and standardized phrases
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Apply radiology abbreviations
     * "differential diagnosis" → "DDx"
     */
    applyRadiologyAbbreviations(text) {
        if (!text) return text;
        
        let result = text;
        
        // Common radiology abbreviations
        result = result.replace(/\bdifferential\s+diagnosis\b/gi, 'DDx');
        result = result.replace(/\bno\s+evidence\s+of\b/gi, 'no evidence of');
        result = result.replace(/\bcannot\s+be\s+excluded\b/gi, 'cannot be excluded');
        
        return result;
    }
    
    /**
     * Standardize comparison phrases
     * "increased in size compared to prior" standardization
     */
    standardizeComparisons(text) {
        if (!text) return text;
        
        let result = text;
        
        // Standardize comparison phrases
        result = result.replace(/\bcompared\s+to\s+the\s+prior\b/gi, 'compared to prior');
        result = result.replace(/\bcompared\s+to\s+last\s+scan\b/gi, 'compared to prior');
        result = result.replace(/\bis\s+unchanged\b/gi, 'unchanged');
        result = result.replace(/\bremains\s+stable\b/gi, 'stable');
        
        return result;
    }
    
    /**
     * ═══════════════════════════════════════════════════════════════════════
     * COMPREHENSIVE RADIOLOGY VOICE PROCESSING PIPELINE SYSTEM
     * ═══════════════════════════════════════════════════════════════════════
     * 
     * Architecture: Modular 7-stage pipeline prevents cross-contamination
     * Each stage processes text independently in proper sequence
     */
    processText(text) {
        if (!text || typeof text !== 'string') return text;
        
        let result = text;
        
        // ═══ STAGE 0: ACRONYM CAPITALIZATION (runs FIRST before lowercasing) ═══
        result = this.capitalizeSpacedAcronyms(result);    // "M R I" → "MRI", "C T" → "CT"
        
        // ═══ STAGE 1: UNIVERSAL PRE-PROCESSING (runs first) ═══
        result = this.normalizeYears(result);              // "twenty twenty-five" → "2025" (MUST run BEFORE normalizeNumbers!)
        result = this.normalizeNumbers(result);            // "two point five" → "2.5", "twenty five" → "25"
        result = this.fixDecimalSpacing(result);           // "2 .5" → "2.5" (Vosk spacing fix)
        result = this.normalizePunctuation(result);        // "period comma" → ". ,"
        
        // ═══ STAGE 2: SPINE PROCESSING (before ranges!) ═══
        result = this.formatSpineLabels(result);           // "L 3 2 L 5" → "L3-L5" (handles "2" as "to")
        result = this.normalizeConsecutiveVertebralLevels(result); // "C1, C2" → "C1-C2" (Whisper comma fix)
        result = this.formatNerveRoots(result);            // "C 6 nerve" → "C6 nerve"
        result = this.correctAnatomicallyImpossibleLevels(result); // "T1-L1" → "T12-L1" (Whisper mishears fix)
        
        // ═══ STAGE 3: RANGES & MEASUREMENTS ═══
        result = this.convertNumberRanges(result);         // "5 to 10" → "5-10"
        result = this.convertBasicMeasurements(result);    // "5 cm", "2.5-8.3 mm"
        result = this.convert2D3DMeasurements(result);     // "10 x 15 mm"
        result = this.convertContinuousScales(result);     // "45 HU", "80% stenosis"
        result = this.convertDiscreteScales(result);       // "grade 3", "score 4/5"
        
        // ═══ STAGE 4: UNIT NORMALIZATION (after measurements) ═══
        result = this.normalizeUnits(result);              // "centimetres" → "cm", "hausfeld" → "HU"
        
        // ═══ STAGE 5: ANATOMICAL (non-spine) ═══
        
        // ═══ STAGE 6: TEMPORAL ═══
        result = this.normalizeOrdinals(result);           // "first July 2025" → "1 July 2025" (for date parsing)
        result = this.convertDates(result);                // "Jan 5 2024" → "15/01/2024" (DD/MM/YYYY)
        result = this.convertComparisonIntervals(result);  // "six months ago" → "6 months ago"
        result = this.convertClockFacePositions(result);   // "two o'clock" → "2:00"
        
        // ═══ STAGE 5: MRI/IMAGING PROTOCOLS ═══
        result = this.standardizeSequenceNames(result);    // "T two weighted" → "T2-weighted"
        result = this.standardizeContrastPhases(result);   // "post contrast" → "post-contrast"
        
        // ═══ STAGE 6: CLINICAL HISTORY & DEMOGRAPHICS ═══
        result = this.formatClinicalDescriptors(result);   // "45 year old" → "45-year-old"
        
        // ═══ STAGE 7: RADIOLOGY LEXICON ═══
        result = this.applyRadiologyAbbreviations(result); // "differential diagnosis" → "DDx"
        result = this.standardizeComparisons(result);      // "compared to prior" standardization
        
        // ═══ FINAL: Template commands & medical corrections ═══
        result = this.processTemplateCommands(result);
        result = this.correctMedicalTerms(result);
        
        return result;
    }

    /**
     * Add custom medical term correction
     * @param {string} incorrect - Incorrect term
     * @param {string} correct - Correct term
     */
    addCorrection(incorrect, correct) {
        this.medicalCorrections.set(incorrect.toLowerCase(), correct);
    }

    /**
     * Add custom template command alias
     * @param {string} canonical - Canonical template name
     * @param {string[]} aliases - Array of alternative names
     */
    addTemplateAlias(canonical, aliases) {
        this.templateCommands.set(canonical.toLowerCase(), aliases.map(a => a.toLowerCase()));
    }

    /**
     * Get all available template commands
     * @returns {string[]} - Array of canonical template names
     */
    getAvailableTemplates() {
        return Array.from(this.templateCommands.keys());
    }

    /**
     * Get medical term corrections stats
     * @returns {Object} - Statistics about corrections
     */
    getStats() {
        return {
            corrections: this.medicalCorrections.size,
            templates: this.templateCommands.size,
            abbreviations: this.abbreviations.size
        };
    }
}

// Export singleton instance
export const medicalTermsProcessor = new MedicalTermsProcessor();