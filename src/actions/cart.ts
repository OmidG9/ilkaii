"use server";

import { cartService } from "@/services";
import { cartRepo } from "@/lib/repositories";
import type { AddToCart } from "@/lib/validators";

export async function addToCartAction(userId: string, payload: AddToCart) {
  try {
    const item = await cartService.addToCart(
      userId,
      payload.productId,
      payload.quantity,
      payload.variantId,
    );
    return { success: true, data: item };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add item";
    return { success: false, error: message };
  }
}

export async function removeFromCartAction(userId: string, cartItemId: string) {
  try {
    await cartService.removeFromCart(userId, cartItemId);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove item";
    return { success: false, error: message };
  }
}

export async function updateCartAction(
  userId: string,
  cartItemId: string,
  quantity: number,
) {
  try {
    const item = await cartService.updateCart(userId, cartItemId, quantity);
    return { success: true, data: item };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update cart";
    return { success: false, error: message };
  }
}

export async function getCartSummaryAction(userId: string) {
  try {
    const summary = await cartService.getCartSummary(userId);
    return { success: true, data: summary };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch cart";
    return { success: false, error: message };
  }
}

export async function clearCartAction(userId: string) {
  try {
    await cartRepo.clearCart(userId);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to clear cart";
    return { success: false, error: message };
  }
}
