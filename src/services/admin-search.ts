import { prisma } from "@/lib/db";
import { toToman } from "@/lib/money";

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

  const [products, orders, customers, pages, posts] = await Promise.all([
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
  return groups;
}
