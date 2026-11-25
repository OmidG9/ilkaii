import { NextRequest } from "next/server";
import { ok, parseBody, route } from "@/lib/http";
import { trackOrder } from "@/services/account";
import { z } from "zod";
import { normalizeIranianPhone } from "@/lib/persian";

export const runtime = "nodejs";

const schema = z.object({
  orderNumber: z.string().min(6).max(40),
  phone: z.string().refine((v) => normalizeIranianPhone(v) !== null, "شماره موبایل نامعتبر است"),
});

export const POST = route(async (request: NextRequest) => {
  const input = await parseBody(request, schema);
  return ok(await trackOrder(input.orderNumber, normalizeIranianPhone(input.phone)!));
});
