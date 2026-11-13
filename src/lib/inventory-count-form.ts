import type { InventoryCountSubmission } from './inventory-count-api';

export function normalizeCountName(value: string): string {
  const name = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error('Indiquez votre nom complet, entre 2 et 100 caractères.');
  }
  return name;
}

export function normalizeCountQuantity(value: string): string {
  const quantity = value.trim().replace(',', '.');
  if (!/^\d{1,9}(?:\.\d{1,3})?$/.test(quantity) || Number(quantity) > 999999999.999) {
    throw new Error('Indiquez une quantité positive ou nulle, avec 3 décimales maximum.');
  }
  return quantity;
}

export type CountIntent = { fingerprint: string; requestKey: string };
export function countIntentFor(
  previous: CountIntent | null,
  payload: Omit<InventoryCountSubmission, 'request_key'>,
  generateKey: () => string = () => crypto.randomUUID(),
): CountIntent {
  const fingerprint = JSON.stringify([payload.name, payload.product_id, payload.variant_id, payload.quantity]);
  return previous?.fingerprint === fingerprint ? previous : { fingerprint, requestKey: generateKey() };
}
