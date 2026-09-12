// src/lib/utils/formatters.js
// Professional formatting utilities for medical terminology

/**
 * Format modality values for professional display
 * @param {string} modality - Raw modality value (e.g. 'ct', 'mri')
 * @returns {string} - Formatted modality (e.g. 'CT', 'MRI')
 */
export function formatModality(modality) {
  if (!modality) return '';
  
  const modalityMap = {
    'ct': 'CT',
    'mri': 'MRI',
    'xray': 'X-Ray',
    'us': 'Ultrasound',
    'mg': 'Mammography',
    'fl': 'Fluoroscopy',
    'nm': 'Nuclear Medicine'
  };
  
  return modalityMap[modality.toLowerCase()] || capitalizeFirstLetter(modality);
}

/**
 * Format body part/region values for professional display
 * @param {string} bodyPart - Raw body part value (e.g. 'head', 'chest')
 * @returns {string} - Formatted body part (e.g. 'Head', 'Chest')
 */
export function formatBodyPart(bodyPart) {
  if (!bodyPart) return '';
  
  const bodyPartMap = {
    'head': 'Head',
    'neck': 'Neck',
    'chest': 'Chest',
    'abdomen': 'Abdomen',
    'spine': 'Spine',
    'angio': 'Angiography',
    'cardiac': 'Cardiac',
    'extremity': 'Extremity',
    'brain': 'Brain',
    'msk': 'MSK',
    'body': 'Body',
    'breast': 'Breast',
    'abdominal': 'Abdominal',
    'pelvic': 'Pelvic',
    'vascular': 'Vascular',
    'small': 'Small Parts',
    'screening': 'Screening',
    'diagnostic': 'Diagnostic',
    'gi': 'GI Series',
    'gu': 'GU Studies',
    'bone': 'Bone Scan'
  };
  
  return bodyPartMap[bodyPart.toLowerCase()] || capitalizeFirstLetter(bodyPart);
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}