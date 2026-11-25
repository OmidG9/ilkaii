import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { CART_COOKIE } from "@/lib/constants";
import { Errors } from "@/lib/errors";
import { effectivePrice, toToman } from "@/lib/money";
import type { CartAdd, CartUpdate } from "@/services/types";

interface Scope { userId: string | null; guestToken: string | null }

async function scope(): Promise<Scope> {
  const user = await getSessionUser();
  if (user) return { userId: user.id, guestToken: null };
  const guestToken = (await cookies()).get(CART_COOKIE)?.value ?? null;
  return { userId: null, guestToken };
}

async function ensureCart(s: Scope) {
  if (s.userId) {
    return prisma.cart.upsert({
      where: { userId: s.userId },
      update: {},
      create: { userId: s.userId },
    });
  }
  if (!s.guestToken) throw Errors.badRequest("شناسه سبد خرید یافت نشد");
  return prisma.cart.upsert({
    where: { guestToken: s.guestToken },
    update: {},
    create: { guestToken: s.guestToken },
  });
}

export function createGuestToken(): string {
  return randomBytes(24).toString("hex");
}

export interface CartView {
  id: string | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    slug: string;
    image: string | null;
    variantId: string | null;
    size: string | null;
    color: string | null;
    unitPrice: number;
    lineTotal: number;
    quantity: number;
    stock: number;
    available: boolean;
  }[];
  subtotal: number;
  itemCount: number;
}

export async function getCartView(): Promise<CartView> {
  const s = await scope();
  if (!s.userId && !s.guestToken) return { id: null, items: [], subtotal: 0, itemCount: 0 };
  const cart = await prisma.cart.findFirst({
    where: s.userId ? { userId: s.userId } : { guestToken: s.guestToken },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, basePrice: true, salePrice: true, status: true, isDeleted: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
          variant: { select: { id: true, size: true, color: true, stock: true, isAvailable: true, price: true } },
        },
      },
    },
  });
  if (!cart) return { id: null, items: [], subtotal: 0, itemCount: 0 };

  let subtotal = 0;
  const items = cart.items.map((item) => {
    const base = toToman(item.product.basePrice);
    const sale = item.product.salePrice ? toToman(item.product.salePrice) : null;
    const unitPrice = effectivePrice(base, sale, item.variant?.price ? toToman(item.variant.price) : null);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    return {
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      variantId: item.variantId,
      size: item.variant?.size ?? null,
      color: item.variant?.color ?? null,
      unitPrice,
      lineTotal,
      quantity: item.quantity,
      stock: item.variant?.stock ?? 0,
      available: !item.product.isDeleted && item.product.status === "ACTIVE" &&
        (!item.variant || (item.variant.isAvailable && item.variant.stock >= item.quantity)),
    };
  });
  return { id: cart.id, items, subtotal, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
}

async function resolveAdd(input: CartAdd) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, isDeleted: false, status: "ACTIVE" },
    include: { variants: { select: { id: true, stock: true, isAvailable: true } } },
  });
  if (!product) throw Errors.notFound("محصول یافت نشد");
  if (input.variantId) {
    const variant = product.variants.find((v) => v.id === input.variantId);
    if (!variant) throw Errors.badRequest("تنوع انتخاب شده متعلق به این محصول نیست");
    if (!variant.isAvailable || variant.stock < input.quantity) throw Errors.conflict("موجودی کافی نیست");
  } else if (product.variants.length > 0) {
    throw Errors.badRequest("لطفاً سایز و رنگ محصول را انتخاب کنید");
  }
  return product;
}

export async function addToCart(input: CartAdd): Promise<CartView> {
  const s = await scope();
  await resolveAdd(input);
  const cart = await ensureCart(s);
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: input.productId, variantId: input.variantId ?? null },
    select: { id: true, quantity: true },
  });
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: input.quantity } },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
        quantity: input.quantity,
      },
    });
  }
  return getCartView();
}

export async function updateCartItem(itemId: string, input: CartUpdate): Promise<CartView> {
  const s = await scope();
  if (!s.userId && !s.guestToken) throw Errors.unauthorized();
  const cart = await prisma.cart.findFirst({
    where: s.userId ? { userId: s.userId } : { guestToken: s.guestToken },
    select: { id: true },
  });
  if (!cart) throw Errors.notFound("سبد خرید یافت نشد");
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id }, include: { variant: true } });
  if (!item) throw Errors.notFound("آیتم یافت نشد");
  if (item.variant && (item.variant.stock < input.quantity || !item.variant.isAvailable)) {
    throw Errors.conflict("موجودی کافی نیست");
  }
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } });
  return getCartView();
}

export async function removeCartItem(itemId: string): Promise<CartView> {
  const s = await scope();
  if (!s.userId && !s.guestToken) throw Errors.unauthorized();
  const cart = await prisma.cart.findFirst({
    where: s.userId ? { userId: s.userId } : { guestToken: s.guestToken },
    select: { id: true },
  });
  if (!cart) throw Errors.notFound("سبد خرید یافت نشد");
  const deleted = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  if (!deleted.count) throw Errors.notFound("آیتم یافت نشد");
  return getCartView();
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

/** Merge a guest cart into the customer cart at login, capped by live stock. */
export async function mergeGuestCart(guestToken: string | null, userId: string) {
  if (!guestToken) return;
  const guest = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: { include: { variant: { select: { stock: true, isAvailable: true } } } } },
  });
  if (!guest || !guest.items.length) return;

  await prisma.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({
      where: { userId }, update: {}, create: { userId },
    });
    for (const item of guest.items) {
      const cap = item.variant ? (item.variant.isAvailable ? item.variant.stock : 0) : 20;
      const quantity = Math.min(item.quantity, cap);
      if (quantity <= 0) continue;
      const existing = await tx.cartItem.findFirst({
        where: { cartId: userCart.id, productId: item.productId, variantId: item.variantId },
        select: { id: true, quantity: true },
      });
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + quantity, cap) },
        });
      } else {
        await tx.cartItem.create({
          data: { cartId: userCart.id, productId: item.productId, variantId: item.variantId, quantity },
        });
      }
    }
    await tx.cart.delete({ where: { id: guest.id } });
  });
}
