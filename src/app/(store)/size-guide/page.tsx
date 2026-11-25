import type { Metadata } from "next";
import { getSizeGuides } from "@/services/catalog";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card } from "@/components/ui/display";

export const metadata: Metadata = { title: "راهنمای سایز" };
export const dynamic = "force-dynamic";

const fallback = `| سایز | دور سینه (cm) | دور کمر (cm) | دور باسن (cm) |
| --- | --- | --- | --- |
| XS | 80 | 60 | 86 |
| S | 84 | 64 | 90 |
| M | 88 | 68 | 94 |
| L | 94 | 74 | 100 |
| XL | 100 | 80 | 106 |`;

function renderTable(content: string) {
  const rows = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const cells = rows.map((row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
  const [header, ...body] = cells;
  return (
    <div className="table-wrap">
      <table className="table-luxury">
        {header ? <thead><tr>{header.map((cell, i) => <th key={i}>{cell}</th>)}</tr></thead> : null}
        <tbody>
          {body.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export default async function SizeGuidePage() {
  const [guides, site] = await Promise.all([getSizeGuides(), getSiteConfig()]);
  return (
    <div className="container-luxury max-w-4xl py-12">
      <Breadcrumbs items={[{ label: "راهنمای سایز" }]} />
      <h1 className="text-4xl font-semibold">راهنمای سایز</h1>
      <p className="mt-4 text-sm leading-7 text-ink/65">
        اندازهها بر سانتی متر است. در صورت قرارگیری بین دو سایز، سایز بزرگتر را انتخاب کنید.
      </p>
      <div className="mt-10 space-y-8">
        {site.features.sizeGuide && guides.length
          ? guides.map((guide) => (
              <section key={guide.id}>
                <h2 className="mb-4 text-xl font-semibold">{guide.name}</h2>
                {renderTable(guide.content)}
              </section>
            ))
          : (
            <Card className="p-5">
              <h2 className="mb-4 text-xl font-semibold">جدول عمومی</h2>
              {renderTable(fallback)}
            </Card>
          )}
      </div>
    </div>
  );
}
