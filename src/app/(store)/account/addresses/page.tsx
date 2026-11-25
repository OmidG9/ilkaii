import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { listAddresses } from "@/services/account";
import { AddressManager } from "@/components/address-manager";
import { SectionTitle } from "@/components/ui/display";

export const metadata: Metadata = { title: "آدرسهای من", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await requirePageUser();
  const addresses = await listAddresses(user.id);
  return (
    <section>
      <SectionTitle title="آدرسهای من" subtitle="آدرسهای ذخیرهشده هنگام تسویه حساب قابل انتخاباند" />
      <AddressManager addresses={addresses} />
    </section>
  );
}
