import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse, PaginatedResponse } from "@/types";

// ====================================
// API RESPONSE HELPERS
// ====================================
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode },
  );
}

export function errorResponse(
  error: string,
  statusCode = 400,
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: statusCode },
  );
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

// ====================================
// ERROR HANDLING
// ====================================
export function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join(".");
    return `${path}: ${issue.message}`;
  });
  return issues.join(", ");
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(
  error: unknown,
): NextResponse<ApiResponse<null>> {
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode);
  }

  if (error instanceof ZodError) {
    return errorResponse(formatZodError(error), 400);
  }

  if (error instanceof Error) {
    console.error("API Error:", error);
    return errorResponse("Internal server error", 500);
  }

  console.error("Unknown error:", error);
  return errorResponse("Internal server error", 500);
}

// ====================================
// PAGINATION HELPERS
// ====================================
export function calculateSkip(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * pageSize;
}

export function validatePagination(
  page: number,
  pageSize: number,
): { page: number; pageSize: number } {
  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), 100), // Max 100 per page
  };
}

// ====================================
// STOCK MANAGEMENT HELPERS
// ====================================
export function calculateAvailableStock(
  totalStock: number,
  reservedStock: number,
): number {
  return Math.max(0, totalStock - reservedStock);
}

export function canReserveStock(
  availableStock: number,
  requestedQuantity: number,
): boolean {
  return availableStock >= requestedQuantity;
}

// ====================================
// ORDER CALCULATION HELPERS
// ====================================
export const TAX_RATE = 0.09; // 9% tax
export const SHIPPING_COST = 50; // Fixed shipping

export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

export function calculateOrderTotals(subtotal: number) {
  const taxAmount = calculateTax(subtotal);
  const shippingCost = SHIPPING_COST;
  const totalAmount = subtotal + taxAmount + shippingCost;

  return {
    subtotal,
    taxAmount,
    shippingCost,
    totalAmount,
  };
}

// ====================================
// PRICE CALCULATION
// ====================================
export function getDisplayPrice(basePrice: number, salePrice?: number): number {
  return salePrice && salePrice > 0 ? salePrice : basePrice;
}

export function calculateDiscount(
  basePrice: number,
  salePrice: number,
): number {
  if (salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
}

// ====================================
// ORDER NUMBER GENERATION
// ====================================
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `ORD-${timestamp.slice(-6)}-${random}`;
}

// ====================================
// SLUG GENERATION
// ====================================
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}

// ====================================
// DATE HELPERS
// ====================================
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getEstimatedDeliveryDate(days = 7): Date {
  return addDays(new Date(), days);
}

// ====================================
// SECURITY HELPERS
// ====================================
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export function maskPhone(phone: string): string {
  const cleaned = sanitizePhone(phone);
  return `****${cleaned.slice(-4)}`;
}

// ====================================
// VALIDATION HELPERS
// ====================================
export function isValidCUID(id: string): boolean {
  return /^c[^\s-]{8,}$/.test(id);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
