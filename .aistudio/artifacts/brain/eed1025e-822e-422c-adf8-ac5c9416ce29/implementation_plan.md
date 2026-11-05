# Implementation Summary: Spare Parts Price Quiz & Inventory Suite

## 1. Catalog – Currency Formulas
- **Manual Yuan (RMB) Exchange Rate**: Replaced the automatic formula with a manual user input in the Catalog Formulas bar (`1 USD = [ 7.23 ] RMB` + "Save Rate" button).
- **Dynamic Conversion**: Changing the rate immediately recalculates all 584+ products' Yuan prices (`p.yuan = ((p.d / 3.67) * manualRate)`) and persists the rate to `localStorage` and Google Sheets sync.
- **Automatic Dirham**: Kept Dirham-to-USD conversion automatic (`1 USD = 3.67 AED`) as specified.

## 2. Quiz System
- **Quiz Modes for "Price D / USD + / Sale"**:
  - **Multiple Choice**: Generates options displaying all 3 prices formatted (`X D · $Y · $Z`).
  - **Type Price**: Manual inputs for Dirham (D), USD+, and Sales $ with tolerance checking and validation.
  - **True / False**: Evaluates a candidate 3-price card against database records.
  - **Any Quiz Mode**: Dynamically randomizes question types (MCQ, Type, and True/False) per question throughout the session.
- **Question Count Options**:
  - Selectable counts: `10`, `20`, `30`, `100`, and `Custom` (with numeric input).
  - Clear `Question X of Y` progress indicator with a progress bar.
  - Prominent `Next Question ➔` button when answering, auto-advance fallback, and final score/accuracy summary.
- **Non-Deterministic Question Shuffling**:
  - Implemented Fisher-Yates shuffling (`shuffleArray`) selecting questions randomly from across the entire catalog (first, middle, last, any position) on every quiz start.
- **Speed Timer**:
  - Selectable options: `Off`, `20s`, `25s`, `30s`.
  - Countdown display with low-time warning sounds; timeout automatically handles unanswered items and lets the quiz continue.

## 3. Price Tracker – Simplified Page
- Simplified into three sections:
  1. **New Products**: Newly added products with product name, catalog category, price, and date.
  2. **Price Increase**: Products whose price went up, displaying Product Name, Previous Price, New Price, Price Difference (+D and %), and Date of change.
  3. **Price Decrease**: Products whose price went down, displaying Product Name, Previous Price, New Price, Price Difference (-D and %), and Date of change.
- Removed unrelated cards and sections.

## 4. Register Company – Company Product History
- **Register Company Profile**:
  - Fields: Company Name, Contact Person, Phone Number, WhatsApp Number, Address / Market Location, Notes & Terms, Registration Date.
  - Quick actions for phone calls, WhatsApp chat (`https://wa.me/...`), and clipboard copying.
- **Product Sourcing Assignment**:
  - Select company from registered supplier list when creating or editing products. Assignment is preserved across edits.
- **"View Products" Company Drilldown**:
  - Dedicated "View Products" button on each company card.
  - Displays all products sourced from that company: Product Name, Brand, Model, Part Type (Category), Product ID, Purchase Price (Price D & USD+), Currency (AED & USD), Quantity, and Purchase Date.
- **Company Product Filters**:
  - Search by Product Name or Model.
  - Filter by Brand, Model, Part Type, and Purchase Date with real-time filtered totals.
- **Export & Print**:
  - **PDF Export**: Generates a landscape A4 report with company header, contact details, full products table, total product count, and total quantity purchased.
  - **Print Report**: Direct in-app printing via `window.print()`.
