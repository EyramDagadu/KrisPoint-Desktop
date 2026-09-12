/**
 * KrisPoint Toast Notification System
 * Professional toast notifications that match the app's design
 * SECURITY: Uses textContent to prevent XSS attacks
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', or 'warning'
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
export function showToast(message, type = 'success', duration = 5000) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `kp-toast kp-toast-${type}`;
  
  // Get icon based on type
  let icon = '✅'; // default
  if (type === 'error') icon = '❌';
  else if (type === 'info') icon = 'ℹ️';
  else if (type === 'warning') icon = '⚠️';
  
  // Create content container
  const content = document.createElement('div');
  content.className = 'kp-toast-content';
  
  // Create message span with textContent (prevents XSS)
  const messageSpan = document.createElement('span');
  messageSpan.className = 'kp-toast-message';
  messageSpan.textContent = `${icon} ${message}`; // Use textContent to prevent HTML injection
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'kp-toast-close';
  closeButton.textContent = '×';
  closeButton.onclick = () => toast.remove();
  
  // Assemble toast
  content.appendChild(messageSpan);
  content.appendChild(closeButton);
  toast.appendChild(content);
  
  // Add to body
  document.body.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}

/**
 * Show a success toast
 * @param {string} message - The success message
 */
export function toastSuccess(message) {
  showToast(message, 'success');
}

/**
 * Show an error toast
 * @param {string} message - The error message
 */
export function toastError(message) {
  showToast(message, 'error');
}

/**
 * Show an info toast
 * @param {string} message - The info message
 */
export function toastInfo(message) {
  showToast(message, 'info');
}

/**
 * Show a warning toast
 * @param {string} message - The warning message
 */
export function toastWarning(message) {
  showToast(message, 'warning');
}
