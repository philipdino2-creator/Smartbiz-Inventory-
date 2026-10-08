import { formatCurrency } from './calculations.ts';

export interface PhoneNormalizationResult {
  isValid: boolean;
  normalizedNumber: string; // E.g. "2348148483687"
  displayPhone: string; // E.g. "+234 814 848 3687"
  error?: string;
}

/**
 * Safely normalize Nigerian mobile numbers for WhatsApp click-to-chat
 * Supports:
 * - 080xxxxxxxx / 070... / 090... / 081... / 091... (11 digits local)
 * - 23480xxxxxxxx (13 digits with country code)
 * - +23480xxxxxxxx (international with leading plus)
 * Returns normalized E.164 without plus: "2348012345678"
 */
export function normalizeNigerianPhone(phone?: string | null): PhoneNormalizationResult {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      normalizedNumber: '',
      displayPhone: '',
      error: 'Customer phone number is missing.',
    };
  }

  // Strip all whitespace, hyphens, brackets, dots
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Remove leading '+' if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle local prefix 0 (e.g. 08012345678 -> 2348012345678)
  // Nigerian prefixes: 070, 080, 081, 090, 091 (11 digits)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.substring(1);
  }

  // Check if starts with Nigerian country code 234
  if (cleaned.startsWith('234')) {
    // Valid Nigerian numbers are 13 digits total (234 + 10 digits)
    if (cleaned.length === 13 && /^\d+$/.test(cleaned)) {
      const part1 = cleaned.substring(0, 3); // 234
      const part2 = cleaned.substring(3, 6); // 814
      const part3 = cleaned.substring(6, 9); // 848
      const part4 = cleaned.substring(9); // 3687
      return {
        isValid: true,
        normalizedNumber: cleaned,
        displayPhone: `+${part1} ${part2} ${part3} ${part4}`,
      };
    }
  }

  // General fallback for valid phone digits (10 to 15 digits)
  if (/^\d{10,15}$/.test(cleaned)) {
    return {
      isValid: true,
      normalizedNumber: cleaned,
      displayPhone: `+${cleaned}`,
    };
  }

  return {
    isValid: false,
    normalizedNumber: '',
    displayPhone: phone.trim(),
    error: 'Invalid phone number format. Please provide a valid Nigerian phone number (e.g. 08012345678 or +2348012345678).',
  };
}

export type ReminderTone = 'friendly' | 'due' | 'overdue';

export interface WhatsAppReminderOptions {
  customerName: string;
  outstandingBalance: number;
  currencySymbol?: string;
  invoiceNumber?: string;
  dueDate?: string;
  tone?: ReminderTone;
  businessName: string;
  businessTagline?: string;
  businessPhone?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    paymentInstructions?: string;
    includeBankDetails?: boolean;
  };
}

/**
 * Generate a professional, respectful WhatsApp payment reminder message
 * adhering directly to Smartcore's business guidelines and tone
 */
export function generateWhatsAppReminderMessage(options: WhatsAppReminderOptions): string {
  const {
    customerName,
    outstandingBalance,
    currencySymbol = '₦',
    invoiceNumber,
    dueDate,
    tone = 'friendly',
    businessName,
    businessTagline = '',
    businessPhone,
    bankDetails,
  } = options;

  const formattedBalance = formatCurrency(outstandingBalance, currencySymbol);
  const cleanCustomerName = customerName.split(' ')[0] || customerName;

  let body = '';

  if (tone === 'friendly') {
    // Structure:
    // Hello [Customer],
    // This is a friendly reminder from Smartcore ICT Centre regarding your outstanding balance.
    // Invoice: INV-000125
    // Outstanding Balance: ₦25,000
    // [Optional Bank Details]
    // Thank you for your patronage.
    // Smartcore ICT Centre
    // Learn. Create. Innovate.
    body = `Hello ${cleanCustomerName},

This is a friendly reminder from ${businessName} regarding your outstanding balance.${invoiceNumber ? `\n\nInvoice: ${invoiceNumber}` : ''}

Outstanding Balance: ${formattedBalance}${dueDate ? `\nPayment Due Date: ${dueDate}` : ''}`;
  } else if (tone === 'due') {
    body = `Hello ${cleanCustomerName},

This is a polite payment due reminder from ${businessName} regarding your account balance.${invoiceNumber ? `\n\nInvoice: ${invoiceNumber}` : ''}

Outstanding Balance: ${formattedBalance}${dueDate ? `\nPayment Due Date: ${dueDate}` : ''}

Kindly arrange settlement of this balance at your convenience. If you have already made this payment, please share your confirmation receipt for prompt reconciliation.`;
  } else {
    // overdue
    body = `Hello ${cleanCustomerName},

We hope you are well. We are following up from ${businessName} regarding your outstanding balance, which is currently overdue.${invoiceNumber ? `\n\nInvoice: ${invoiceNumber}` : ''}

Outstanding Balance: ${formattedBalance}${dueDate ? `\nDue Date was: ${dueDate}` : ''}

Please let us know when we can expect this settlement or send your transfer details if already processed. We appreciate your prompt attention.`;
  }

  // Optional Bank Payment Details
  let bankSection = '';
  if (
    bankDetails?.includeBankDetails &&
    bankDetails.bankName &&
    bankDetails.accountNumber
  ) {
    bankSection = `\n\nPayment Details:
Bank Name: ${bankDetails.bankName}
Account Name: ${bankDetails.accountName || businessName}
Account Number: ${bankDetails.accountNumber}${bankDetails.paymentInstructions ? `\nInstructions: ${bankDetails.paymentInstructions}` : ''}`;
  }

  const closing = `\n\nThank you for your patronage.\n\n${businessName}${businessTagline ? `\n${businessTagline}` : ''}${businessPhone ? `\nPhone: ${businessPhone}` : ''}`;

  return `${body}${bankSection}${closing}`;
}

/**
 * Generate full WhatsApp web / mobile click-to-chat URL
 */
export function buildWhatsAppUrl(
  phone: string,
  message: string
): { url: string; isValid: boolean; error?: string } {
  const normalized = normalizeNigerianPhone(phone);
  if (!normalized.isValid) {
    return {
      url: '',
      isValid: false,
      error: normalized.error || 'Customer phone number is missing.',
    };
  }

  const encodedMessage = encodeURIComponent(message);
  return {
    url: `https://wa.me/${normalized.normalizedNumber}?text=${encodedMessage}`,
    isValid: true,
  };
}
