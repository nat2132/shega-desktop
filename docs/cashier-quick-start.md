# Shega POS — Cashier Quick Start Guide

## Overview
Shega POS is an offline-first point-of-sale system for retail shops. This guide covers the essential daily workflows for cashiers.

---

## 1. Starting Your Shift

### Login
1. Launch Shega POS on the register terminal
2. Enter your **username** and **4-digit PIN**
3. Click **Access Terminal** or press **Enter**

> **Note**: After 5 failed PIN attempts, the account locks for 30 minutes. Contact your manager if locked out.

### Opening the Register
1. From the Dashboard, click **Register** (or press `F2` from any screen)
2. Verify the **opening float** amount matches the cash drawer
3. Click **Open Shift** to begin

---

## 2. Processing a Sale

### Using the Register Screen
The Register screen (`/register`) is optimized for fast checkout:

| Area | Purpose |
|------|---------|
| **Product Grid** (left) | Tap items to add to cart |
| **Search Bar** (top) | Type name/SKU/barcode or scan |
| **Category Tabs** | Filter by Beverages, Snacks, etc. |
| **Cart Rail** (right) | Shows current items, quantities, totals |

### Adding Items
- **Tap** any product tile → adds 1 to cart
- **Scan barcode** → auto-adds item (cursor in search bar)
- **Type in search** → filters products in real-time
- **Keyboard shortcuts**:
  - `F2` — Focus search bar
  - `Enter` (in search) — Scan barcode/add first match

### Adjusting the Cart
- **Qty steppers** (±) — Increase/decrease quantity
- **Discount field** — Enter line discount amount
- **Remove (X)** — Remove line from cart

### Payment
| Shortcut | Method |
|----------|--------|
| `F4` | Cash |
| `F5` | Card |
| `F6` | Mobile Money |

**Cash Payment Flow**:
1. Press `F4` or click **Pay Cash**
2. Enter **cash tendered** (e.g., customer gives 500 for 375 total)
3. System shows **change due** automatically
4. Click **Complete Sale** → prints receipt, opens drawer

---

## 3. Common Operations

### Void a Sale
1. Go to **Sales** → find the sale
2. Click **Void** (requires `sales.void` permission)
3. Select **reason** from dropdown
4. Manager PIN required for voids above threshold

### Return/Refund
1. Open **Sales** → **Sale Detail**
2. Click **Return** → select items to return
3. Choose refund method (original payment preferred)
4. Enter **reason** → process

### Apply Discount
- **Line discount**: Enter amount in cart row
- **Bulk discount**: Settings → Price Adjustments (manager only)

---

## 4. End of Shift (Z-Report)

### Closing the Register
1. From Register screen, click **Close Shift**
2. **Count physical cash** in drawer
3. Enter **counted amount** → system calculates variance
4. Review **Z-Report** summary:
   - Total sales (cash/card/mobile)
   - Void/return summary
   - Cash variance
4. Click **Confirm Close** → prints Z-report

> **Important**: Variance > 50 ETB requires manager sign-off.

---

## 5. Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Account locked"** | Wait 30 min or ask manager to unlock |
| **Barcode not scanning** | Check scanner connection; type SKU manually |
| **Receipt not printing** | Check printer power/USB; Settings → Printer |
| **Drawer won't open** | Check RJ11 cable; Settings → Cash Drawer |
| **Sync pending badge** | Tap sync icon in header to force sync |
| **Negative stock error** | Item out of stock; check inventory or adjust |

---

## 6. Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| `F2` | Focus search / scan barcode |
| `F4` | Pay Cash |
| `F5` | Pay Card |
| `F6` | Pay Mobile |
| `Esc` | Close payment modal / cancel |
| `Enter` | Confirm / add scanned item |
| `Tab` | Navigate between fields |

---

## 7. Language & Display

- **Language**: Settings → Translation (English, Amharic, Oromo, Tigrinya)
- **Theme**: Header → Moon/Sun icon (Light/Dark/Midnight/Emerald)
- **Calendar**: Settings → Ethiopian / Gregorian
- **Time**: Settings → Device / Ethiopian time system

---

## 8. Getting Help

- **In-app**: Settings → Help → Tutorials
- **Manager**: Contact for permissions, void approvals, shift issues
- **Support**: support@shega.app / +251-XXX-XXXX

---

*Shega POS v1.0 — Offline-first, multi-language, ERCA-compliant*