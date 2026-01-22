/**
 * Security utilities for input sanitization and validation
 */

export class SecurityUtils {
  static getCSRFToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content || '';
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove dangerous characters and scripts
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  static sanitizeHTML(html) {
    if (typeof html !== 'string') return html;
    
    // Remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }

  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  static validatePhone(phone) {
    // Remove formatting characters
    const cleaned = phone.replace(/[\s()-]/g, '');
    const re = /^\+?1?\d{9,15}$/;
    return re.test(cleaned);
  }

  static validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static generateRandomString(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
