/**
 * Input sanitization & security validation utilities
 */

/**
 * Strips dangerous HTML tags, javascript:, script, iframe and onload handlers to prevent XSS
 */
export function sanitizeText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '') // strip all remaining HTML tags
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
}

/**
 * Validates file upload: type & size (max 5MB)
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté (${file.type || 'inconnu'}). Formats autorisés : JPG, PNG, WEBP.`,
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Le fichier est trop volumineux (${sizeInMb} Mo). Taille maximum autorisée : 5 Mo.`,
    };
  }

  return { valid: true };
}

/**
 * Validates international phone format
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Allow digits, spaces, plus sign, hyphens, min 6 digits
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 8 && digitsOnly.length <= 15;
}

/**
 * Validates standard email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
