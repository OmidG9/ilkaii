/**
 * Currency and Price Formatting Utilities
 * Format prices in Iranian Toman currency
 */

// Constants for currency formatting
export const CURRENCY = {
  SYMBOL: "تومان",
  CODE: "IRR",
  NAME: "تومان ایران",
} as const;

/**
 * Format a price value to Persian Toman currency
 * @param price - Price in Toman (not Rial)
 * @param showSymbol - Whether to show the currency symbol
 * @returns Formatted price string with Persian numerals
 * @example
 * formatPrice(1500000) => "۱٬۵۰۰٬۰۰۰ تومان"
 * formatPrice(1500000, false) => "۱٬۵۰۰٬۰۰۰"
 */
export function formatPrice(
  price: number | string,
  showSymbol: boolean = true,
): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return "۰ تومان";
  }

  // Format the number with thousands separator
  const formatted = new Intl.NumberFormat("fa-IR", {
    style: "currency",
    currency: "IRR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);

  // The above format returns something like "۱٬۵۰۰٬۰۰۰ ریال"
  // We need to replace "ریال" with "تومان"
  if (showSymbol) {
    return formatted.replace("ریال", "تومان");
  }

  // Remove currency symbol if not needed
  return formatted.replace("ریال", "").trim();
}

/**
 * Format price with Persian numerals only (no thousands separator)
 * @param price - Price in Toman
 * @returns Price string with Persian numerals
 * @example
 * formatPriceSimple(1500000) => "۱۵۰۰۰۰۰"
 */
export function formatPriceSimple(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return "۰";
  }

  return convertToPersianNumbers(numPrice.toString());
}

/**
 * Convert English numerals to Persian numerals
 * @param str - String containing English numerals
 * @returns String with Persian numerals
 * @example
 * convertToPersianNumbers("123") => "۱۲۳"
 */
export function convertToPersianNumbers(str: string): string {
  const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  let result = str.toString();
  for (let i = 0; i < 10; i++) {
    result = result.replace(
      new RegExp(englishNumbers[i], "g"),
      persianNumbers[i],
    );
  }
  return result;
}

/**
 * Convert Persian numerals to English numerals
 * @param str - String containing Persian numerals
 * @returns String with English numerals
 * @example
 * convertToEnglishNumbers("۱۲۳") => "123"
 */
export function convertToEnglishNumbers(str: string): string {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  let result = str.toString();

  // Convert Persian numerals
  for (let i = 0; i < 10; i++) {
    result = result.replace(
      new RegExp(persianNumbers[i], "g"),
      englishNumbers[i],
    );
  }

  // Convert Arabic numerals
  for (let i = 0; i < 10; i++) {
    result = result.replace(
      new RegExp(arabicNumbers[i], "g"),
      englishNumbers[i],
    );
  }

  return result;
}

/**
 * Format price range (from and to prices)
 * @param from - Starting price in Toman
 * @param to - Ending price in Toman
 * @returns Formatted price range string
 * @example
 * formatPriceRange(100000, 500000) => "۱۰۰٬۰۰۰ تا ۵۰۰٬۰۰۰ تومان"
 */
export function formatPriceRange(
  from: number | string,
  to: number | string,
): string {
  const fromPrice = formatPrice(from, false);
  const toPrice = formatPrice(to, false);
  return `${fromPrice} تا ${toPrice} تومان`;
}

/**
 * Calculate discount percentage
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Discount percentage
 * @example
 * calculateDiscount(1000000, 800000) => 20
 */
export function calculateDiscount(
  originalPrice: number,
  discountedPrice: number,
): number {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Format discount display
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price
 * @returns Formatted discount string with Persian numerals
 * @example
 * formatDiscount(1000000, 800000) => "۲۰٪ تخفیف"
 */
export function formatDiscount(
  originalPrice: number,
  discountedPrice: number,
): string {
  const discount = calculateDiscount(originalPrice, discountedPrice);
  return `${convertToPersianNumbers(discount.toString())}٪ تخفیف`;
}

/**
 * Parse price from user input
 * @param input - User input (can contain Persian or English numerals)
 * @returns Parsed number
 * @example
 * parsePrice("۱۵۰۰۰۰۰") => 1500000
 * parsePrice("1500000") => 1500000
 */
export function parsePrice(input: string): number {
  const englishInput = convertToEnglishNumbers(input.replace(/,/g, ""));
  return parseFloat(englishInput) || 0;
}

export default {
  CURRENCY,
  formatPrice,
  formatPriceSimple,
  convertToPersianNumbers,
  convertToEnglishNumbers,
  formatPriceRange,
  calculateDiscount,
  formatDiscount,
  parsePrice,
};
