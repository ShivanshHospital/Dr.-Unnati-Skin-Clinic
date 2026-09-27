import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InvoiceType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees with Indian digit grouping (e.g., ₹1,23,456.00)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
  
  return `₹${formatted}`;
}

/**
 * Converts a numeric amount to Indian Rupee Words (e.g., Rupees One Lakh Twenty-Five Thousand Only)
 */
export function numberToWordsINR(amount: number): string {
  const roundedAmount = Math.round(amount);
  if (roundedAmount === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teenDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num < 10) return singleDigits[num];
    if (num < 20) return teenDigits[num - 10];
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${tensDigits[tens]} ${singleDigits[ones]}`.trim();
  }

  function convertThreeDigits(num: number): string {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let str = '';
    if (hundred > 0) {
      str += `${singleDigits[hundred]} Hundred `;
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str.trim();
  }

  let num = roundedAmount;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  const remaining = num;

  let result = '';

  if (crore > 0) {
    result += `${convertThreeDigits(crore)} Crore `;
  }
  if (lakh > 0) {
    result += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand > 0) {
    result += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (remaining > 0) {
    result += `${convertThreeDigits(remaining)} `;
  }

  return `Rupees ${result.trim()} Only`;
}

/**
 * Format ISO date string into readable format (e.g., 26 Sep 2026, 04:30 PM)
 */
export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Calculates days until batch expiry from today
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 9999;
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateUHID(count: number): string {
  const numStr = (count + 1).toString().padStart(5, '0');
  return `UNT-${numStr}`;
}

export function generateInvoiceNo(type: InvoiceType, count: number, customPrefix?: string, fy = '2526'): string {
  let defaultPrefix = 'OPD';
  if (type === 'PROCEDURE') defaultPrefix = 'PRC';
  if (type === 'MEDICINE') defaultPrefix = 'MED';

  const prefix = customPrefix || defaultPrefix;
  const numStr = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${fy}-${numStr}`;
}
