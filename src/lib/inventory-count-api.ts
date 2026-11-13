import { API_CONFIG } from './api-config';
export interface InventoryCountProduct { product_id: number; variant_id: number | null; entity_key: string; designation: string; variant_name: string | null; reference: string; image_url: string | null; kind: 'product' | 'variant'; }
export interface InventoryCountSession { id: number; title: string; }
export interface InventoryCountSubmission { name: string; product_id: number; variant_id: number | null; quantity: string; request_key: string; }
export class InventoryCountError extends Error { constructor(message: string, public status: number) { super(message); } }
async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
 const response = await fetch(`${API_CONFIG.BASE_URL}/api/inventory-count/public/${encodeURIComponent(token)}${path}`, { ...init, cache: 'no-store', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json', ...init.headers } });
 const body = await response.json().catch(() => ({}));
 if (!response.ok) throw new InventoryCountError(body.message || 'Connexion impossible. Réessayez.', response.status);
 return body as T;
}
export const readInventoryCountSession = (token: string, signal?: AbortSignal) => request<{ session: InventoryCountSession }>(token, '', { signal });
export const searchInventoryCountProducts = (token: string, q: string, page = 1, signal?: AbortSignal) => request<{ items: InventoryCountProduct[]; pagination: { page: number; limit: number; total: number } }>(token, `/products?q=${encodeURIComponent(q)}&page=${page}`, { signal });
export const submitInventoryCount = (token: string, body: InventoryCountSubmission) => request<{ ok: true; id: number; quantity: number; replayed: boolean }>(token, '/entries', { method: 'POST', body: JSON.stringify(body) });
