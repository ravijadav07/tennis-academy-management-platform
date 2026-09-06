// src/utils/validators.js
// Shared validation utilities for all input forms across the project.
// Phone: Indian mobile numbers (10 digits, optional +91 prefix)
// Email: RFC 5322 simplified
// Name: Alphanumeric + spaces, minimum 2 characters

export const PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
export const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9\s.\-']{1,}$/;

export function sanitizePhone(value) {
  if (!value) return '';
  return value.replace(/[^\d+\-\s]/g, '');
}

export function validatePhone(value, required = true) {
  if (!value || !value.trim()) {
    return required ? 'Phone number is required' : '';
  }
  const raw = value.trim();
  if (/[a-zA-Z]/.test(raw)) {
    return 'Phone number cannot contain letters or alphabets';
  }
  const cleaned = raw.replace(/[\s\-]/g, '');
  if (!/^(\+91)?[0-9]+$/.test(cleaned)) {
    return 'Phone number can only contain numbers (0-9)';
  }
  const digitsOnly = cleaned.replace(/^\+91/, '');
  if (digitsOnly.length !== 10) {
    return `Phone number must be 10 digits (currently ${digitsOnly.length})`;
  }
  if (!/^[6-9]/.test(digitsOnly)) {
    return 'Mobile number must start with 6, 7, 8, or 9';
  }
  return '';
}

export function validateEmail(value, required = false) {
  if (!value || !value.trim()) {
    return required ? 'Email address is required' : '';
  }
  const val = value.trim();
  if (!val.includes('@')) {
    return 'Email address must contain an "@" symbol';
  }
  const parts = val.split('@');
  if (parts.length > 2 || !parts[1] || !parts[1].includes('.')) {
    return 'Enter a valid email domain (e.g. user@example.com)';
  }
  if (!EMAIL_REGEX.test(val)) {
    return 'Enter a valid email address (e.g. user@example.com)';
  }
  return '';
}

export function validateName(value, label = 'Name') {
  if (!value || !value.trim()) return `${label} is required`;
  if (value.trim().length < 2) return `${label} must be at least 2 characters`;
  if (!NAME_REGEX.test(value.trim())) return `${label} contains invalid characters`;
  return '';
}

export function validateRequired(value, label = 'Field') {
  if (!value || !value.trim()) return `${label} is required`;
  return '';
}