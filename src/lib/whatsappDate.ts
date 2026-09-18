/**
 * Pure date & title formatting helpers for WhatsApp messages.
 * Safe to import in both Client and Server components.
 */

/**
 * Formats a bill date according to the user's year preference.
 * - includeYear = true: "19 Aug 2026"
 * - includeYear = false: "19 Aug"
 */
export function formatSplitDate(
  date: Date | string | null | undefined,
  includeYear: boolean = false
): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

/**
 * Appends the split date to the bill title on the right side,
 * ensuring no duplicate date string is appended if the title already contains the date.
 * E.g., "Veg Thali" -> "Veg Thali 19 Aug 2026" (or "Veg Thali 19 Aug")
 * E.g., "Misal Pav/ Cold Coffee 17 Aug" -> remains "Misal Pav/ Cold Coffee 17 Aug"
 */
export function formatSplitTitleWithDate(
  rawTitle: string,
  date: Date | string | null | undefined,
  includeYear: boolean = false
): string {
  const title = (rawTitle || "Bill").trim();
  const dateStr = formatSplitDate(date, includeYear);
  if (!dateStr) return title;

  const shortDateStr = formatSplitDate(date, false);
  const lowerTitle = title.toLowerCase();

  // If title already has the date (full or short), avoid duplicate
  const hasDateAlready =
    lowerTitle.includes(dateStr.toLowerCase()) ||
    (shortDateStr && lowerTitle.includes(shortDateStr.toLowerCase()));

  if (hasDateAlready) {
    return title;
  }

  return `${title} ${dateStr}`;
}
