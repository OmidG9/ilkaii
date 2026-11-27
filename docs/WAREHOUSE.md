# Warehouse & Inventory Module

این سند ماژول انبارداری و موجودی پنل مدیریت را توصیف می‌کند: مدل داده، گردش‌کارها، API، دسترسی‌ها و محدودیت‌های شناخته‌شده.

## 1. Scope

ماژول انبار روی موجودی **در سطح تنوع (سایز/رنگ)** کار می‌کند و شامل این بخش‌هاست:

- نمای کلی ارزش و سلامت موجودی (ارزش خرید، ارزش فروش، کالای راکد، کم‌موجود، ناموجود)
- دفتر گردش موجودی با مانده پس از هر حرکت
- تنظیم سریع موجودی با دلیل (شارژ، تنظیم، بازگشت، ضایعات)
- تنظیم گروهی موجودی برای چند تنوع انتخاب‌شده (تنظیم مطلق یا افزایش/کاهش)
- مشخصات انبار هر تنوع: بارکد، قفسه/محل نگهداری، بهای خرید، آستانه هشدار، تأمین‌کننده پیش‌فرض
- تأمین‌کنندگان و زمان تحویل
- سفارش خرید با چرخه پیش‌نویس → ثبت → ورود بخشی → دریافت کامل / لغو
- رسید انبار تراکنشی با به‌روزرسانی بهای میانگین موزون
- انبارگردانی با اسنپ‌شات موجودی، ثبت شمارش صفحه‌به‌صفحه و اعمال مغایرت در پایان
- پیشنهاد خرید مجدد بر پایه فروش ۳۰ روز و زمان تحویل
- خروجی CSV موجودی

خارج از دامنه (عمداً پیاده‌سازی نشده): چند انبار هم‌زمان، انتقال بین انبارها، بارکدخوان سخت‌افزاری، Excel/ERP و قیمت‌گذاری لایه‌ای.

## 2. Data model

### ProductVariant

| Field | Purpose |
| --- | --- |
| `barcode` | بارکد یکتا برای جستجو/اسکن |
| `location` | قفسه یا محل نگهداری |
| `costPrice` | بهای خرید واحد برای ارزش‌گذاری و میانگین موزون |
| `supplierId` | تأمین‌کننده پیش‌فرض (اختیاری) |
| `stock` | موجودی قابل فروش همان تنوع |
| `lowStockThreshold` | آستانه هشدار همین تنوع |

### InventoryMovement

| Field | Purpose |
| --- | --- |
| `quantity` | دلتای علامت‌دار اعمال‌شده |
| `balanceAfter` | موجودی تنوع بعد از اعمال حرکت (ردیف‌های قدیمی `null`) |
| `reason` | `SALE`, `RESTOCK`, `ADJUSTMENT`, `RETURN`, `CANCELLATION`, `PURCHASE`, `STOCKTAKE`, `DAMAGE` |
| `unitCost` | بهای واحد برای حرکات خرید |
| `referenceType` / `referenceId` | سند مرجع: `ORDER`, `PURCHASE_ORDER`, `STOCKTAKE`, `RETURN_REQUEST`, `BULK_ADJUSTMENT`, `ADJUSTMENT` |
| `userId` | کاربر عامل |

همه نوشتن‌های موجودی از `src/services/inventory-ledger.ts` عبور می‌کنند تا `balanceAfter` هرگز جا نیفتد.

### Supplier

نام یکتا، شخص رابط، تلفن، ایمیل، آدرس، یادداشت، `leadTimeDays` و `isActive`.

### PurchaseOrder / PurchaseOrderItem

- شماره یکتا `PO-YYYYMMDD-XXXXXX`
- وضعیت: `DRAFT`, `ORDERED`, `PARTIAL`, `RECEIVED`, `CANCELLED`
- مبالغ: جمع اقلام، تخفیف تأمین‌کننده، هزینه حمل، مبلغ نهایی
- هر قلم: تنوع، تعداد سفارش، تعداد دریافت‌شده، بهای واحد، یادداشت

### Stocktake / StocktakeItem

- شماره یکتا `ST-YYYYMMDD-XXXXXX`
- وضعیت: `DRAFT`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- هر قلم: موجودی سیستم در زمان شروع، تعداد شمارش‌شده، مغایرت

## 3. Workflows

### 3.1 Manual adjustment

1. ادمین با مجوز `inventory.manage`/`inventory.write` از صفحه موجودی مقدار مثبت یا منفی و دلیل را ثبت می‌کند.
2. سرویس در یک تراکنش، موجودی را با شرط برابری مقدار قبلی به‌روز می‌کند (جلوگیری از lost update).
3. یک `InventoryMovement` با `balanceAfter` و کاربر ثبت می‌شود.
4. شمارنده‌های `totalStock`/`availableStock` محصول بازمحاسبه می‌شوند.
5. اقدام در `AuditLog` ثبت می‌شود.

### 3.2 Purchase order

1. **DRAFT**: قابل ویرایش و حذف/لغو. اقلام و بهای خرید ثبت می‌شوند.
2. **ORDERED**: پس از «ثبت سفارش» قفل می‌شود؛ فقط دریافت یا لغو (اگر دریافتی نداشته باشد) مجاز است.
3. **PARTIAL / RECEIVED**: هنگام رسید انبار:
   - موجودی تنوع افزایش می‌یابد.
   - حرکت `PURCHASE` با `unitCost` و `balanceAfter` ثبت می‌شود.
   - بهای خرید تنوع به میانگین موزون تبدیل می‌شود:
     `newCost = (stockBefore × oldCost + receivedQty × unitCost) ÷ (stockBefore + receivedQty)`
   - وضعیت سفارش بر اساس دریافت کامل همه اقلام تعیین می‌شود.
   - شمارنده‌های محصول در همان تراکنش بازمحاسبه می‌شوند.
4. دریافت بیش از باقی‌مانده یا دریافت هم‌زمان تکراری با خطای 409 رد می‌شود.

### 3.3 Stocktake

1. دامنه انتخاب می‌شود: همه کالاها، فقط کم‌موجودها یا یک دسته‌بندی (حداکثر ۳۰۰۰ تنوع).
2. موجودی سیستم هر تنوع در `expectedQuantity` اسنپ‌شات می‌شود.
3. شمارش‌ها صفحه‌به‌صفحه ذخیره می‌شوند اما موجودی را تغییر نمی‌دهند.
4. در «تکمیل»:
   - مغایرت هر قلم = شمارش − موجودی سیستم
   - همان مغایرت به موجودی **فعلی** اضافه می‌شود (نه بازنویسی مطلق) تا فروش‌های هم‌زمان از بین نروند.
   - اگر نتیجه منفی شود، به صفر محدود می‌شود و دلتای واقعی ثبت می‌گردد.
   - حرکت `STOCKTAKE` با مرجع سند ثبت می‌شود.
5. انبارگردانی تکمیل‌شده قابل ویرایش نیست؛ برای اصلاح بعدی سند جدید بسازید.

### 3.4 Reorder suggestions

برای هر تنوع با `stock <= lowStockThreshold`:

```
dailySales = soldLast30Days / 30
target = ceil(dailySales × (leadTimeDays + 14)) + lowStockThreshold
suggested = max(1, target − stock)
```

این عدد پیشنهادی است و سفارش خودکار ایجاد نمی‌کند.

## 4. Pages

| Path | Purpose |
| --- | --- |
| `/admin/inventory` | KPIها، نمودار گردش/ارزش، فهرست و تنظیم سریع موجودی، پیشنهاد خرید، کالای راکد |
| `/admin/inventory/movements` | دفتر گردش با فیلتر دلیل/سند/جستجو |
| `/admin/inventory/suppliers` | CRUD تأمین‌کنندگان |
| `/admin/inventory/purchase-orders` | فهرست سفارش‌های خرید |
| `/admin/inventory/purchase-orders/new` | ساخت پیش‌نویس سفارش با اقلام چندگانه |
| `/admin/inventory/purchase-orders/[id]` | جزئیات، ثبت، لغو و رسید انبار |
| `/admin/inventory/purchase-orders/[id]/edit` | ویرایش پیش‌نویس سفارش |
| `/admin/inventory/stocktakes` | فهرست انبارگردانی‌ها |
| `/admin/inventory/stocktakes/new` | شروع شمارش با دامنه مشخص |
| `/admin/inventory/stocktakes/[id]` | ثبت شمارش، تکمیل و لغو |

## 5. API

| Method & path | Permission |
| --- | --- |
| `POST /api/admin/inventory` | `inventory.manage` یا `inventory.write` |
| `POST /api/admin/inventory/bulk` | همان |
| `PATCH /api/admin/inventory/variants/[variantId]` | همان |
| `GET /api/admin/inventory/export` | همان یا `reports.view` |
| `POST /api/admin/suppliers`, `PATCH/DELETE /api/admin/suppliers/[id]` | همان |
| `POST /api/admin/purchase-orders`, `PATCH /api/admin/purchase-orders/[id]` | همان |
| `POST /api/admin/purchase-orders/[id]/status` | همان |
| `POST /api/admin/purchase-orders/[id]/receive` | همان |
| `POST /api/admin/stocktakes`, `PATCH /api/admin/stocktakes/[id]` | همان |
| `POST /api/admin/stocktakes/[id]/complete` | همان |
| `POST /api/admin/stocktakes/[id]/status` | همان |

همهٔ routeها `assertSameOrigin`، Zod validation، بدنه حداکثر ۶۴KB، خطاهای استاندارد و audit log دارند.

## 6. Migration

`prisma/migrations/20261127160000_warehouse_inventory/migration.sql` اضافه می‌کند:

- جدول‌های `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `Stocktake`, `StocktakeItem`
- ستون‌های `ProductVariant.barcode/costPrice/location/supplierId`
- ستون‌های `InventoryMovement.balanceAfter/unitCost/referenceType/referenceId`
- مقادیر جدید enum دلیل موجودی

```bash
npx prisma migrate deploy
npx prisma generate
```

ستون‌های جدید nullable هستند؛ داده‌های موجود حفظ می‌شوند. ردیف‌های قدیمی دفتر، `balanceAfter = NULL` دارند و در UI با «—» نمایش داده می‌شوند.

## 7. Operational notes & next steps

- بارکد را یکتا نگه دارید؛ جستجوی SKU/بارکد در فهرست و انبارگردانی استفاده می‌شود.
- برای ارزش‌گذاری دقیق، `costPrice` را هنگام رسید خرید یا ویرایش تنوع تکمیل کنید.
- پیشنهاد خرید به `leadTimeDays` تأمین‌کننده پیش‌فرض تنوع وابسته است.
- چند انبار هم‌زمان نیازمند جدول `Warehouse` و موجودی به تفکیک انبار است؛ ساختار فعلی عمداً تک‌انباره است.
- اتصال بارکدخوان سخت‌افزاری فقط نیازمند فوکوس روی فیلد جستجو/SKU است؛ API تغییر نمی‌خواهد.
- برای حجم بالای اقلام، خروجی CSV تا ۵۰۰۰ تنوع در هر درخواست پشتیبانی می‌شود.

## 8. Verification

| Check | Result |
| --- | --- |
| `npm run type-check` | passes |
| `npm run lint` | no warnings/errors |
| `npm test` | 72/72 passing (including 9 warehouse schema tests) |
| `npm run build` | succeeds, all warehouse routes compiled |
| Live service smoke | supplier → purchase order → partial/full receive → weighted cost → category stocktake → completion → cleanup passed |
| Live HTTP smoke | supplier, purchase order, receive, stocktake, variant settings, CSV export through authenticated APIs passed |
| Live UI smoke | inventory pages, draft-PO edit page, global search results, dashboard inventory card and authenticated admin pages → 200 |
