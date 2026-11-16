export type CardBrand = 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Card';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateMonthlyPayment(
  vehiclePrice: number,
  downPayment: number,
  termMonths: number,
  aprPercent: number,
  mode: 'finance' | 'lease'
): number {
  const principal = Math.max(0, vehiclePrice - downPayment);
  if (mode === 'lease') {
    const residualValue = vehiclePrice * 0.56;
    const depreciation = Math.max(0, principal - residualValue);
    const moneyFactor = aprPercent / 2400;
    const monthlyDepreciation = depreciation / termMonths;
    const monthlyFinanceCharge = (principal + residualValue) * moneyFactor;
    return Math.round(monthlyDepreciation + monthlyFinanceCharge);
  }
  const monthlyRate = aprPercent / 100 / 12;
  if (monthlyRate === 0) return Math.round(principal / termMonths);
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return Math.round((principal * (monthlyRate * factor)) / (factor - 1));
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function detectCardBrand(raw: string): CardBrand {
  const digits = raw.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  return 'Card';
}

export function passesLuhnCheck(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateExpiry(formatted: string): boolean {
  const match = formatted.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month, 0, 23, 59, 59);
  return expDate >= now;
}

export function generateTransactionReference(): string {
  const token =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
      : Math.random().toString(36).slice(2, 12).toUpperCase();
  return `VLC-${token}`;
}
