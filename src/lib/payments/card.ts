/**
 * Module d'Intégration Cartes Bancaires (Visa, Mastercard, etc.)
 * Conforme aux exigences de sécurité PCI-DSS
 */

export interface CardValidationResult {
  isValid: boolean;
  cardType: 'visa' | 'mastercard' | 'amex' | 'unknown';
  formattedNumber: string;
  error?: string;
}

export function detectCardType(number: string): 'visa' | 'mastercard' | 'amex' | 'unknown' {
  const clean = number.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  return 'unknown';
}

export function validateCardNumber(number: string): CardValidationResult {
  const clean = number.replace(/\D/g, '');
  const cardType = detectCardType(clean);

  if (clean.length < 13 || clean.length > 19) {
    return {
      isValid: false,
      cardType,
      formattedNumber: formatCardNumber(clean),
      error: 'Numéro de carte incomplet'
    };
  }

  // Luhn algorithm check
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const isValid = sum % 10 === 0;

  return {
    isValid,
    cardType,
    formattedNumber: formatCardNumber(clean),
    error: isValid ? undefined : 'Numéro de carte bancaire invalide'
  };
}

export function formatCardNumber(number: string): string {
  const clean = number.replace(/\D/g, '').substring(0, 16);
  const parts = clean.match(/.{1,4}/g);
  return parts ? parts.join(' ') : clean;
}

export function validateExpiry(expiry: string): boolean {
  const clean = expiry.replace(/\s+/g, '');
  const match = clean.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(`20${match[2]}`, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (month < 1 || month > 12) return false;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export function validateCvc(cvc: string, cardType: 'visa' | 'mastercard' | 'amex' | 'unknown'): boolean {
  const clean = cvc.replace(/\D/g, '');
  const expectedLength = cardType === 'amex' ? 4 : 3;
  return clean.length === expectedLength;
}
