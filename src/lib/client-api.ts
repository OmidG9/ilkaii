async function request<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message ?? "عملیات ناموفق بود");
  return payload.data as T;
}

export const api = {
  post: <T>(url: string, body: unknown) => request<T>(url, "POST", body),
  patch: <T>(url: string, body?: unknown) => request<T>(url, "PATCH", body),
  delete: <T>(url: string) => request<T>(url, "DELETE"),
};
