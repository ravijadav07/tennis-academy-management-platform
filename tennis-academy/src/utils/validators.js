// src/utils/validators.js
// Shared validation utilities for all input forms across the project.
// Phone: Indian mobile numbers (10 digits, optional +91 prefix)
// Email: RFC 5322 simplified
// Name: Alphanumeric + spaces, minimum 2 characters

export const PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
export const NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9\s.\-']{1,}$/;

export function validatePhone(value) {
  if (!value || !value.trim()) return 'Phone number is required';
  const cleaned = value.replace(/[\s\-]/g, '');
  if (!PHONE_REGEX.test(cleaned)) return 'Enter a valid 10-digit Indian mobile number';
  return '';
}

export function validateEmail(value) {
  if (!value || !value.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address';
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