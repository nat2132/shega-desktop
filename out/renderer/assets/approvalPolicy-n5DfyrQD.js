import { c as createLucideIcon } from "./index-wvHtiMql.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ShoppingBag = createLucideIcon("ShoppingBag", [
  ["path", { d: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z", key: "hou9p0" }],
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M16 10a4 4 0 0 1-8 0", key: "1ltviw" }]
]);
const VOID_REASONS = [
  { value: "wrong_item", label: "Wrong item sold" },
  { value: "wrong_quantity", label: "Wrong quantity" },
  { value: "wrong_price", label: "Wrong price applied" },
  { value: "duplicate_sale", label: "Duplicate / double-charge" },
  { value: "customer_request", label: "Customer request" },
  { value: "payment_error", label: "Payment error" },
  { value: "fraud_suspected", label: "Fraud suspected" },
  { value: "other", label: "Other" }
];
const RETURN_REASONS = [
  { value: "defective", label: "Defective / damaged" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "wrong_qty", label: "Wrong quantity" },
  { value: "exchange", label: "Exchange / swap" },
  { value: "customer_request", label: "Customer request" },
  { value: "expired", label: "Expired product" },
  { value: "other", label: "Other" }
];
const OVERRIDE_REASONS = [
  { value: "customer_discount", label: "Customer loyalty discount" },
  { value: "damaged_discount", label: "Damaged / display item" },
  { value: "price_match", label: "Price match" },
  { value: "clearance", label: "Clearance / promotion" },
  { value: "manager_decision", label: "Manager decision" },
  { value: "error_correction", label: "Pricing error correction" },
  { value: "other", label: "Other" }
];
const DEFAULT_DISCOUNT_CAPS = {
  owner: null,
  manager: null,
  cashier: 10,
  inventory: 10,
  accountant: 10,
  reports: 10,
  warehouse: 10
};
function getDiscountCap(role) {
  if (!role) return DEFAULT_DISCOUNT_CAPS.cashier;
  const cap = DEFAULT_DISCOUNT_CAPS[role];
  return cap === void 0 ? DEFAULT_DISCOUNT_CAPS.cashier : cap;
}
export {
  OVERRIDE_REASONS as O,
  RETURN_REASONS as R,
  ShoppingBag as S,
  VOID_REASONS as V,
  getDiscountCap as g
};
