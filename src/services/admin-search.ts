import { prisma } from "@/lib/db";
import { toToman } from "@/lib/money";
import { purchaseOrderStatusLabels } from "@/lib/labels";

export interface AdminSearchGroup {
  title: string;
  href: string;
  items: Array<{ id: string; title: string; subtitle?: string; href: string }>;
}

export async function adminGlobalSearch(query: string, permissions: readonly string[]): Promise<AdminSearchGroup[]> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return [];
  const canProducts = permissions.includes("products.view") || permissions.includes("product.read");
  const canOrders = permissions.includes("orders.view") || permissions.includes("order.read");
  const canCustomers = permissions.includes("customers.view") || permissions.includes("customer.read");
  const canCms = permissions.includes("cms.manage");
  const canInventory = permissions.includes("inventory.manage") || permissions.includes("inventory.write");

  const [products, orders, customers, pages, posts, variants, suppliers, purchaseOrders] = await Promise.all([
    canProducts
      ? prisma.product.findMany({
          where: { isDeleted: false, OR: [{ name: { contains: q } }, { sku: { contains: q } }, { slug: { contains: q } }] },
          take: 6,
          orderBy: { updatedAt: "desc" },
          select: { id: true, name: true, sku: true, basePrice: true, _count: { select: { variants: true } } },
        })
      : [],
    canOrders
      ? prisma.order.findMany({
          where: { OR: [{ orderNumber: { contains: q } }, { recipientName: { contains: q } }, { recipientPhone: { contains: q } }, { user: { phone: { contains: q } } }] },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        })
      : [],
    canCustomers
      ? prisma.user.findMany({
          where: { OR: [{ phone: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }] },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: { id: true, phone: true, firstName: true, lastName: true, role: true, _count: { select: { orders: true } } },
        })
      : [],
    canCms
      ? prisma.cmsPage.findMany({ where: { OR: [{ title: { contains: q } }, { slug: { contains: q } }] }, take: 5, select: { id: true, title: true, slug: true, status: true } })
      : [],
    canCms
      ? prisma.blogPost.findMany({ where: { OR: [{ title: { contains: q } }, { slug: { contains: q } }] }, take: 5, select: { id: true, title: true, slug: true, status: true } })
      : [],
    canInventory
      ? prisma.productVariant.findMany({
          where: {
            OR: [
              { sku: { contains: q } },
              { barcode: { contains: q } },
              { location: { contains: q } },
              { product: { name: { contains: q } } },
            ],
          },
          take: 6,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true, sku: true, barcode: true, location: true, size: true, color: true, stock: true,
            product: { select: { id: true, name: true } },
          },
        })
      : [],
    canInventory
      ? prisma.supplier.findMany({
          where: { OR: [{ name: { contains: q } }, { contactName: { contains: q } }, { phone: { contains: q } }] },
          take: 5,
          orderBy: { name: "asc" },
          select: { id: true, name: true, contactName: true, phone: true, isActive: true },
        })
      : [],
    canInventory
      ? prisma.purchaseOrder.findMany({
          where: { OR: [{ number: { contains: q } }, { supplier: { name: { contains: q } } }] },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, number: true, status: true, totalAmount: true, supplier: { select: { name: true } } },
        })
      : [],
  ]);

  const groups: AdminSearchGroup[] = [];
  if (products.length) groups.push({
    title: "محصولات", href: "/admin/products",
    items: products.map((product) => ({ id: product.id, title: product.name, subtitle: `${product.sku} — ${product._count.variants} تنوع — ${toToman(product.basePrice)} تومان`, href: `/admin/products/${product.id}` })),
  });
  if (orders.length) groups.push({
    title: "سفارش‌ها", href: "/admin/orders",
    items: orders.map((order) => ({ id: order.id, title: order.orderNumber, subtitle: `${toToman(order.totalAmount)} تومان`, href: `/admin/orders/${order.id}` })),
  });
  if (customers.length) groups.push({
    title: "مشتریان", href: "/admin/customers",
    items: customers.map((user) => ({
      id: user.id,
      title: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.phone,
      subtitle: `${user.phone} — ${user._count.orders} سفارش`,
      href: `/admin/customers/${user.id}`,
    })),
  });
  if (pages.length) groups.push({
    title: "صفحات", href: "/admin/cms/pages",
    items: pages.map((page) => ({ id: page.id, title: page.title, subtitle: `/${page.slug}`, href: `/admin/cms/pages` })),
  });
  if (posts.length) groups.push({
    title: "وبلاگ", href: "/admin/cms/blog",
    items: posts.map((post) => ({ id: post.id, title: post.title, subtitle: `/${post.slug}`, href: `/admin/cms/blog` })),
  });
  if (variants.length) groups.push({
    title: "موجودی و تنوع‌ها", href: "/admin/inventory",
    items: variants.map((variant) => ({
      id: variant.id,
      title: `${variant.product.name} — ${variant.size}${variant.color ? ` / ${variant.color}` : ""}`,
      subtitle: `${variant.sku}${variant.barcode ? ` — بارکد ${variant.barcode}` : ""}${variant.location ? ` — قفسه ${variant.location}` : ""} — موجودی ${variant.stock}`,
      href: `/admin/inventory?q=${encodeURIComponent(variant.sku)}`,
    })),
  });
  if (suppliers.length) groups.push({
    title: "تأمین‌کنندگان", href: "/admin/inventory/suppliers",
    items: suppliers.map((supplier) => ({
      id: supplier.id,
      title: supplier.name,
      subtitle: [supplier.contactName, supplier.phone, supplier.isActive ? "فعال" : "غیرفعال"].filter(Boolean).join(" — "),
      href: "/admin/inventory/suppliers",
    })),
  });
  if (purchaseOrders.length) groups.push({
    title: "سفارش‌های خرید", href: "/admin/inventory/purchase-orders",
    items: purchaseOrders.map((order) => ({
      id: order.id,
      title: order.number,
      subtitle: `${order.supplier.name} — ${toToman(order.totalAmount)} تومان — ${purchaseOrderStatusLabels[order.status]}`,
      href: `/admin/inventory/purchase-orders/${order.id}`,
    })),
  });
  return groups;
}
