export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it has 10 digits, assume India and add 91
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // If it has 12 digits and starts with 91, add +
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  
  // Return with + prefix as fallback if it's already got a country code
  return digits ? `+${digits}` : phone;
}
