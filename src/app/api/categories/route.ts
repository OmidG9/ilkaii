import { ok, route } from "@/lib/http";
import { getCategories } from "@/services/catalog";

export const runtime = "nodejs";

export const GET = route(async () => ok(await getCategories()));
