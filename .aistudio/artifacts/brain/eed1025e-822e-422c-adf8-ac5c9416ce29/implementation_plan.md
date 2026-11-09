# Complete Suite Google Sheets Sync & Data Restoration Architecture

A unified data synchronization and restoration pipeline connecting the Spare Parts Price Quiz & Inventory Suite to Google Sheets via a zero-auth Google Apps Script Web App. Provides a complete Data Dictionary README, multi-sheet backup, and 2-way restoration across all 5 app collections.

---

## User Review & Confirmed Decisions

> [!IMPORTANT]
> The following technical choices were confirmed through your interactive inputs:
> - **Connection Method**: Google Apps Script Web App (Webhook URL) — no Google account OAuth popup or token expiration, 100% reliable within any browser.
> - **Data Scope**: Complete Suite — Spare Parts Catalog (with new Air/Sea and Dubai/China attributes), Register Companies (Suppliers), Price Tracker history, Photos Hub, and Compatible LCDs.

---

## 1. Complete Data Dictionary & Restoration Spec (README)

Here is the exact schema and data fields that will be stored, backed up, and restored in your Google Spreadsheet:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 GOOGLE SPREADSHEET (COMPLETE SUITE)                                 │
├──────────────────┬──────────────────────┬──────────────────────┬─────────────────┬──────────────────┤
│ Tab 1:           │ Tab 2:               │ Tab 3:               │ Tab 4:          │ Tab 5:           │
│ ALL PRODUCT      │ Register Companies   │ Price Tracker        │ Photos Hub      │ Compatible LCDs  │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┼──────────────────┤
│ 1. Product Name  │ 1. Company Name      │ 1. Date              │ 1. Product Name │ 1. Screen Model  │
│ 2. Category      │ 2. Contact Person    │ 2. Product Name      │ 2. Photo URL    │ 2. Compatible    │
│ 3. Price D (AED) │ 3. Phone Number      │ 3. Category          │ 3. Description  │    Phones (Fits) │
│ 4. Yuan ¥ (RMB)  │ 4. WhatsApp Number   │ 4. Movement Type     │ 4. Date Added   │ 3. Notes         │
│ 5. USD+ (Cost)   │ 5. Address / Location│ 5. Old Price D (AED) │                 │                  │
│ 6. Sales $       │ 6. Notes             │ 6. New Price D (AED) │                 │                  │
│ 7. Supplier Co.  │ 7. Registered Date   │ 7. Price Delta (AED) │                 │                  │
│ 8. Shipment      │ 8. Total Products    │ 8. Change %          │                 │                  │
│    (Air / Sea)   │                      │ 9. Supplier Company  │                 │                  │
│ 9. Origin        │                      │                      │                 │                  │
│    (Dubai/China) │                      │                      │                 │                  │
│ 10. Date Added   │                      │                      │                 │                  │
└──────────────────┴──────────────────────┴──────────────────────┴─────────────────┴──────────────────┘
```

### Detailed Field Definitions:

#### Sheet 1: `ALL PRODUCT` (585+ Catalog Spare Parts)
1. **Product Name**: String (e.g. `LCD IPHONE 11 PRO MAX`, `FLEX CHARGER A05`, `BATTERY 13 PRO MAX`).
2. **Category (Brand _Part Type)**: String (e.g. `iPhone / LCD`, `SAMSUNG / BATTERY`, `INFINIX / FLEX CHARGER`).
3. **Price D**: Number (AED Dirham purchase price).
4. **Yuan ¥**: Number (China RMB purchase price, using manual exchange rate formula).
5. **USD+**: Number (Calculated USD Cost including customs/shipping expense rate).
6. **Sales $**: Number (Target selling price in USD).
7. **Company / Supplier**: String (Supplier from which the part was acquired).
8. **Shipment**: String (`By Air` [Diyaarad] or `By Sea` [Markab]).
9. **Origin**: String (`Dubai` or `China`).
10. **Date Added**: ISO Date string (e.g. `2026-11-06`).

#### Sheet 2: `Register Companies` (Supplier Directory)
1. **Company Name**: Primary Identifier (e.g. `Al-Baraka Dubai`, `Guangzhou Screen King`).
2. **Contact Person**: Contact representative name.
3. **Phone Number**: Primary telephone for orders.
4. **WhatsApp Number**: Direct WhatsApp link for purchase verification.
5. **Address / Location**: City/Market location (e.g. `Deira, Dubai` or `Shenzhen, China`).
6. **Notes**: Terms, delivery speeds, warranties.
7. **Registration Date**: Date company was first added.
8. **Total Products**: Count of spare parts linked to this company.

#### Sheet 3: `Price Tracker` (Price Audit Trail)
1. **Date**: Timestamp of recorded price change.
2. **Product Name**: Target spare part name.
3. **Category**: Part category.
4. **Movement Type**: `New Product`, `Price Increase` (Kor u kacay), or `Price Decrease` (Hoos u dhacay).
5. **Old Price D**: Previous price in Dirhams (0 for new arrivals).
6. **New Price D**: Current updated price in Dirhams.
7. **Price Delta (D)**: Difference in Dirhams (+/-).
8. **Percentage Change**: Percentage delta (%).
9. **Supplier Company**: Company name associated with the price change.

#### Sheet 4: `Photos` & Sheet 5: `Compatible LCDs`
- Storing high-resolution photo reference links, descriptions, and verified LCD cross-compatibility matrices.

---

## 2. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SPARE PARTS REACT APP                           │
│                                                                        │
│  ┌────────────────┐   ┌─────────────────┐   ┌──────────────────────┐   │
│  │ Catalog View   │   │ Register Co.    │   │ Price Tracker View   │   │
│  │ (585+ Items)   │   │ (Suppliers)     │   │ (Price Movements)    │   │
│  └───────┬────────┘   └────────┬────────┘   └──────────┬───────────┘   │
│          │                     │                       │               │
│          ▼                     ▼                       ▼               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     googleSheetsService.ts                       │  │
│  │  - Backup Complete Suite (Payload includes all 5 collections)    │  │
│  │  - Restore Complete Suite (Fetches and validates all 5 sheets)   │  │
│  │  - Incremental Auto-Sync (Append row on new item / supplier)     │  │
│  │  - Non-destructive matching (Preserves duplicate names with      │  │
│  │    different companies)                                          │  │
│  └─────────────────────────────┬────────────────────────────────────┘  │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │ HTTP POST / GET (JSON text/plain)
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    GOOGLE APPS SCRIPT (Code.gs)                        │
│                                                                        │
│  ┌─────────────────────────┐            ┌───────────────────────────┐  │
│  │ doPost(e)               │            │ doGet(e)                  │  │
│  │ - 'backup_complete'     │            │ - 'restore_complete'      │  │
│  │ - 'add_product'         │            │ - 'restore_catalog'       │  │
│  │ - 'add_company'         │            │ - 'get_all'               │  │
│  └───────────┬─────────────┘            └─────────────┬─────────────┘  │
│              │                                        │                │
│              ▼                                        ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Google Spreadsheet Tabs                      │  │
│  │  [ALL PRODUCT] [Register Companies] [Price Tracker] [Photos]... │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Steps

1. **Update `googleSheetsService.ts`**:
   - Enhance `getAppsScriptCode()` to:
     - Generate all 5 sheets automatically with headers if they do not exist.
     - Implement `action === 'backup_complete'`: receives `{ catalog, companies, priceChanges, photos, compat }` and writes all tabs cleanly with proper column formatting.
     - Implement `action === 'restore_complete'`: reads all 5 tabs and returns a unified JSON object with all entities.
     - Implement `action === 'add_company'`: appends new registered company directly to `Register Companies` sheet.
   - Add frontend service functions:
     - `backupCompleteSuite(url, data)`: Backs up all 5 collections in one request.
     - `restoreCompleteSuite(url)`: Fetches all collections from Google Sheets, verifies schemas, and reconstructs local database.

2. **In-App Data README & Restoration Modal (`GoogleSheetsModal.tsx`)**:
   - Add a dedicated **"Data Dictionary & Restore README"** tab inside the Google Sheets modal.
   - Display a clean, scannable table of all 10 columns for `ALL PRODUCT`, 8 columns for `Register Companies`, and 9 columns for `Price Tracker`.
   - Add a prominent **"🔄 Restore Complete Suite from Google Sheet"** button with confirmation modal and preview count (e.g. "Found 585 products, 12 companies, 45 price movements in your Google Sheet").
   - Add a 1-click **"🚀 Backup Complete Suite to Google Sheet"** button with a real-time progress indicator.

3. **Verification**:
   - Run `compile_applet` and `lint_applet` to confirm zero syntax or typing errors.
   - Verify non-destructive company and shipment handling.
