import type { Metadata } from "next";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { listUserReviews } from "@/services/account";
import { Card, SectionTitle } from "@/components/ui/display";
import { formatJalali } from "@/lib/persian";

export const metadata: Metadata = { title: "نظرات من", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const user = await requirePageUser();
  const reviews = await listUserReviews(user.id);
  return (
    <section>
      <SectionTitle title="نظرات من" subtitle="نظرات پس از تأیید مدیر نمایش داده میشوند" />
      {reviews.length ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/product/${review.product.slug}`} className="text-sm font-semibold hover:text-primary">{review.product.name}</Link>
                <span className="text-xs text-ink/50">{formatJalali(review.createdAt)}</span>
              </div>
              <p className="mt-2 text-xs text-primary">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
              {review.title ? <p className="mt-2 text-sm font-medium">{review.title}</p> : null}
              <p className="mt-1 text-sm leading-6 text-ink/65">{review.comment}</p>
              <p className="mt-2 text-xs text-ink/45">{review.isApproved ? "تأیید شده" : "در انتظار تأیید"}</p>
            </Card>
          ))}
        </div>
      ) : <Card className="p-8 text-center text-sm text-ink/55">نظری ثبت نکردهاید.</Card>}
    </section>
  );
}
