import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { listWishlist } from "@/services/account";
import { WishlistView } from "@/components/wishlist-view";
import { SectionTitle } from "@/components/ui/display";

export const metadata: Metadata = { title: "علاقهمندیها", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requirePageUser();
  const items = await listWishlist(user.id);
  return (
    <section>
      <SectionTitle title="علاقهمندیها" />
      <WishlistView items={items} />
    </section>
  );
}
