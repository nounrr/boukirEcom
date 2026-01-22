# E‑commerce Remise Balance Payments

This document explains how the remise (loyalty) balance can be used during checkout.

It is intended for the frontend team implementing the checkout and order details screens.

---

## 1. Concepts & Fields

### 1.1 User remise balance

- Stored on the authenticated user (contacts) as:
  - `remise_balance: number` (decimal, 2 digits).
- Exposed by auth endpoints:
  - `POST /api/users/auth/login`
  - `GET /api/users/auth/me`

### 1.2 Order-level remise fields

On each ecommerce order:

- `total_amount: number`
  - Full order total **after** product promos and promo codes, but **before** applying remise.
- `remise_used_amount: number`
  - Amount (DH) of remise actually spent on this order.
  - Always `0` for guests or if remise not used.

Amount remaining to pay via the chosen payment method:

$$ amount\_to\_pay = total\_amount - remise\_used\_amount $$

---

## 2. Supported payment methods

Checkout still uses the same `payment_method` values:

- `cash_on_delivery`
- `card`

Remise balance is **not** a new `payment_method`. It’s an **additional partial payment** that reduces what remains to pay.

Example:

- `total_amount = 1000`
- `remise_used_amount = 300`
- `payment_method = "cash_on_delivery"`
- Amount to collect on delivery: `700`.

---

## 3. Checkout API

### 3.1 Endpoint

- `POST /api/ecommerce/orders`
- Auth:
  - Works for guests and authenticated users.
  - Remise usage is only available for authenticated users.

### 3.2 Relevant request fields

Existing fields (already in use):

- `payment_method: "cash_on_delivery" | "card"`
- Other checkout fields (customer, shipping, cart/items, promo_code, etc.)

New fields for remise usage:

- `use_remise_balance?: boolean | string`
  - If `true` (or string `'true'`), user wants to use remise.
- `remise_to_use?: number`
  - Optional amount (DH) the user wants to spend.
  - If omitted while `use_remise_balance` is true, backend will try to use the **maximum** possible.

Frontend note (recommended UX):

- Allow the user to choose how much remise to apply using **+ / − controls** with a numeric input field.
- Remise amount is **flexible** (no minimum, can be any value from 0 to max).
- Remaining amount to pay can be any value (no minimum constraint).
- If user sets remise amount to 0, auto-disable the remise checkbox.
- Provide a **Max** shortcut to set remise to the maximum allowed.

### 3.2.1 Remise-only flow (pay 100% with remise)

If the user’s remise covers the full order total:

- Frontend should allow selecting “use max” / “pay with remise”.
- Frontend may disable other payment method inputs and hide card details forms.
- Still send a valid `payment_method` (recommended default: `cash_on_delivery`) alongside `use_remise_balance: true`.
- Backend will compute `remise_used_amount` and `amount_to_pay` becomes `0`.

### 3.3 Backend rules (summary)

For authenticated users only:

- Everything runs inside a DB transaction.
- Backend computes the normal order total (`total_amount`).
- If remise was requested:
  - Reads/locks user remise balance.
  - Computes `remise_used_amount`:
    - `requested = remise_to_use` if provided and > 0, otherwise `requested = remise_balance`.
    - Clamps to `<= remise_balance` and `<= total_amount`.
    - Rounds to 2 decimals.
  - Performs a guarded update on the user balance.

For guests:

- Any remise-related request fields are ignored.
- `remise_used_amount` will always be `0`.

### 3.4 Success response

```json
{
  "message": "Commande créée avec succès",
  "order": {
    "id": 123,
    "order_number": "ORD-XXXX",
    "total_amount": 1000,
    "remise_used_amount": 300,
    "status": "pending",
    "payment_status": "pending",
    "payment_method": "cash_on_delivery",
    "items_count": 5
  }
}
```

Compute:

- `amount_to_pay = order.total_amount - order.remise_used_amount`

### 3.5 Error case: remise balance changed

If another session changed the user remise balance between page load and submit, backend may respond:

```json
{
  "message": "Solde de remise insuffisant ou mis à jour, veuillez réessayer.",
  "error_type": "REMISE_BALANCE_CHANGED"
}
```

Frontend suggestion:

- Re-fetch the user via `GET /api/users/auth/me`.
- Refresh displayed `remise_balance`.
- Ask the user to confirm again how much remise to use and resubmit.

---

## 4. Order listing & details

Orders now include `remise_used_amount`.

Frontend can display:

- `total_amount`
- `remise_used_amount`
- `amount_to_pay = total_amount - remise_used_amount`
- `payment_method`
