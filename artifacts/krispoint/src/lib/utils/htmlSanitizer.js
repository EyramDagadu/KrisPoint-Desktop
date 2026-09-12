// HTML Sanitization utility for medical template content
// Ensures safe HTML by allowing only specific formatting tags

/**
 * Configuration for allowed HTML elements and attributes
 */
const ALLOWED_TAGS = {
  // Text formatting
  'b': [],
  'strong': [],
  'i': [],
  'em': [],
  'u': [],
  
  // Lists
  'ul': [],
  'ol': [],
  'li': [],
  
  // Structure
  'p': [],
  'div': [],
  'br': [],
  
  // Line breaks and spacing
  'span': ['style'],
  
  // Tables - needed for structured data in templates and reports
  'table': ['style', 'class'],
  'thead': [],
  'tbody': [],
  'tr': [],
  'th': ['style', 'colspan', 'rowspan'],
  'td': ['style', 'colspan', 'rowspan']
};

const ALLOWED_ATTRIBUTES = [
  'style', 'class', 'colspan', 'rowspan'
];

/**
 * Sanitize HTML content by removing disallowed tags and attributes
 * @param {string} html - Raw HTML content
 * @returns {string} - Sanitized HTML content
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Server-side rendering guard
  if (typeof document === 'undefined') {
    // Fallback for SSR - basic sanitization by stripping all tags except allowed ones
    const allowedTagPattern = /<\/?(?:b|strong|i|em|u|ul|ol|li|p|div|br|span|table|thead|tbody|tr|th|td)(?:\s[^>]*)?>?/gi;
    return html.replace(/<[^>]+>/g, (match) => {
      return allowedTagPattern.test(match) ? match : '';
    });
  }

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Recursively clean the DOM tree
  sanitizeElement(tempDiv);

  return tempDiv.innerHTML;
}

/**
 * Recursively sanitize DOM elements
 * @param {Element} element - DOM element to sanitize
 */
function sanitizeElement(element) {
  // Get all child nodes (includes text nodes and elements)
  const children = Array.from(element.childNodes);
  
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      // Keep text nodes as-is
      continue;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tagName = child.tagName.toLowerCase();
      
      if (ALLOWED_TAGS.hasOwnProperty(tagName)) {
        // Tag is allowed, clean its attributes based on tag-specific allowed list
        cleanAttributes(child, ALLOWED_TAGS[tagName]);
        // Recursively sanitize children
        sanitizeElement(child);
      } else {
        // Tag not allowed, replace with its content
        const textContent = child.textContent || '';
        const textNode = document.createTextNode(textContent);
        element.replaceChild(textNode, child);
      }
    } else {
      // Remove other node types (comments, etc.)
      element.removeChild(child);
    }
  }
}

/**
 * Remove disallowed attributes from an element
 * @param {Element} element - DOM element to clean
 * @param {string[]} tagAllowedAttrs - Attributes allowed for this specific tag
 */
function cleanAttributes(element, tagAllowedAttrs = []) {
  const attributes = Array.from(element.attributes);
  
  for (const attr of attributes) {
    if (!tagAllowedAttrs.includes(attr.name) && !ALLOWED_ATTRIBUTES.includes(attr.name)) {
      element.removeAttribute(attr.name);
    }
  }
}

/**
 * Convert plain text to HTML with basic formatting
 * @param {string} text - Plain text content
 * @returns {string} - HTML with line breaks converted
 */
export function textToHTML(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

/**
 * Convert HTML to plain text with structure preservation
 * @param {string} html - HTML content
 * @returns {string} - Plain text content
 */
export function htmlToText(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Server-side rendering guard
  if (typeof document === 'undefined') {
    // Fallback for SSR - basic tag stripping
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Process specific elements for better structure
  const listItems = tempDiv.querySelectorAll('li');
  listItems.forEach(li => {
    li.textContent = '- ' + li.textContent + '\n';
  });
  
  const breaks = tempDiv.querySelectorAll('br');
  breaks.forEach(br => {
    br.replaceWith('\n');
  });
  
  const paragraphs = tempDiv.querySelectorAll('p, div');
  paragraphs.forEach(p => {
    p.textContent = p.textContent + '\n\n';
  });
  
  return (tempDiv.textContent || tempDiv.innerText || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Check if content contains HTML formatting
 * @param {string} content - Content to check
 * @returns {boolean} - True if content contains HTML tags
 */
export function hasHTMLFormatting(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  return /<[^>]+>/.test(content);
}