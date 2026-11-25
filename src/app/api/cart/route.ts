import { ok, route } from "@/lib/http";
import { getCartView } from "@/services/cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => ok(await getCartView()));
