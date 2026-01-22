/**
 * Validation rules and utilities for form inputs
 */

export const ValidationRules = {
  order: {
    customerName: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/,
      message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    phone: {
      required: true,
      pattern: /^\+?1?\d{9,15}$/,
      message: 'Please enter a valid phone number'
    },
    address: {
      required: true,
      minLength: 10,
      maxLength: 200,
      message: 'Address must be 10-200 characters'
    },
    items: {
      required: true,
      minItems: 1,
      maxItems: 50,
      message: 'Order must contain 1-50 items'
    },
    total: {
      required: true,
      min: 0.01,
      max: 10000,
      message: 'Order total must be between $0.01 and $10,000'
    }
  },
  
  payment: {
    cardNumber: {
      required: true,
      pattern: /^\d{13,19}$/,
      message: 'Please enter a valid card number'
    },
    cvv: {
      required: true,
      pattern: /^\d{3,4}$/,
      message: 'CVV must be 3-4 digits'
    },
    expiryDate: {
      required: true,
      pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
      message: 'Expiry date must be in MM/YY format'
    }
  }
};

export function validateField(fieldName, value, rules) {
  const errors = [];

  if (!rules) return errors;

  // Required check
  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(rules.message || `${fieldName} is required`);
    return errors;
  }

  // Skip other validations if not required and empty
  if (!value && !rules.required) return errors;

  const stringValue = value.toString();

  // Length checks
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(rules.message || `${fieldName} must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(rules.message || `${fieldName} must be no more than ${rules.maxLength} characters`);
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push(rules.message || `${fieldName} format is invalid`);
  }

  // Number range checks
  if (rules.min !== undefined && Number(value) < rules.min) {
    errors.push(rules.message || `${fieldName} must be at least ${rules.min}`);
  }

  if (rules.max !== undefined && Number(value) > rules.max) {
    errors.push(rules.message || `${fieldName} must be no more than ${rules.max}`);
  }

  // Array checks
  if (rules.minItems && Array.isArray(value) && value.length < rules.minItems) {
    errors.push(rules.message || `Must have at least ${rules.minItems} items`);
  }

  if (rules.maxItems && Array.isArray(value) && value.length > rules.maxItems) {
    errors.push(rules.message || `Must have no more than ${rules.maxItems} items`);
  }

  return errors;
}

export function validateForm(data, rulesSet) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, fieldValue] of Object.entries(data)) {
    const fieldRules = rulesSet[fieldName];
    if (!fieldRules) continue;

    const fieldErrors = validateField(fieldName, fieldValue, fieldRules);
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
    }
  }

  return { isValid, errors };
}

export function sanitizeFormData(data) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Trim whitespace and sanitize
      sanitized[key] = value.trim().replace(/[<>]/g, '');
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? item.trim().replace(/[<>]/g, '') : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
