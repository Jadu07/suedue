export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

export function formatMoney(paise: number): string {
  const rupees = toRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function addMoney(a: number, b: number): number {
  return a + b; // Assuming inputs are in paise and integers
}

export function subtractMoney(a: number, b: number): number {
  return a - b;
}

export function validateMoney(paise: number): boolean {
  return Number.isInteger(paise) && paise >= 0;
}
