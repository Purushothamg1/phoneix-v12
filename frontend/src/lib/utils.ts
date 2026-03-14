export function formatCurrency(amount: number | string, symbol?: string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return `${symbol || '₹'}0.00`;
  // Try to read currency symbol from localStorage settings cache
  const sym = symbol || (typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('phoneix_settings') || '{}').currency_symbol || '₹'
    : '₹');
  return `${sym}${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const STATUS_COLORS: Record<string, string> = {
  PAID:               'badge-green',
  UNPAID:             'badge-red',
  PARTIAL:            'badge-yellow',
  CANCELLED:          'badge-gray',
  RECEIVED:           'badge-blue',
  DIAGNOSING:         'badge-yellow',
  WAITING_FOR_PARTS:  'badge-yellow',
  IN_REPAIR:          'badge-blue',
  READY:              'badge-green',
  DELIVERED:          'badge-gray',
};

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: string; details?: string[]; message?: string } } };
    if (axiosError.response?.data?.details?.length) {
      return axiosError.response.data.details.join('. ');
    }
    if (axiosError.response?.data?.error) return axiosError.response.data.error;
    if (axiosError.response?.data?.message) return axiosError.response.data.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

/** Returns true if the value is a non-empty string */
export function isNonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Formats a phone number for wa.me — strips all non-digits */
export function toWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
