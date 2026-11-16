# FuelRadarUK ⛽🇬🇧

**UK Petrol & Diesel Price Finder and Forecourt Map**

FuelRadarUK is a Next.js 14 web application that compares retail petrol (E10, E5) and diesel (B7, SDV) prices across UK forecourts.

## Current state of the data (read this first)

**The prices are not live.** `data/uk_stations.json` is a snapshot, taken on 16 November 2026 at 11:27 UTC, of retailer feeds published under the CMA interim fuel price scheme, which closed on 1 May 2026. It holds 854 stations, mainly Asda (782) and Applegreen (65). It is not an official Fuel Finder dataset and it carries no Open Government Licence.

The importer (`npm run update-fuel`) has been migrated to the Government's **Fuel Finder** API but has never been run, because no credentials have been obtained yet.

Provenance is declared in the metadata of `data/uk_stations.json`:

- `source`: label shown next to every station and in the footer.
- `isLiveSource`: `false` for this snapshot. While it is `false`, every page shows a "Prices are not live" notice.
- `snapshotDate`: date of the snapshot, used in that notice.

When the importer runs successfully it writes `source: "Fuel Finder"` and `isLiveSource: true`, and the interface changes by itself (the notice disappears).

The averages shown are the **average across the stations in our dataset**, not a UK-wide average. With this snapshot they are biased towards Asda.

---

## 1. Background & Fuel Finder Transition

In 2026, the temporary CMA retailer JSON feeds (which required individual scraping of supermarket endpoints) were officially superseded by the UK Government's statutory **Fuel Finder** service. Under UK law, petrol filling stations across England, Scotland, Wales, and Northern Ireland are legally required to report retail pump price changes within 30 minutes.

The importer is written to connect to Fuel Finder via (not yet run against the live service):
- **REST API:** OAuth 2.0 Client Credentials flow (`/api/v1/pfs` & `/api/v1/pfs/fuel-prices`).
- **Bulk CSV Feed:** Official twice-daily published CSV extracts.

---

## 2. Obtaining Fuel Finder API Credentials

1. Visit the official UK Government guidance page:
   [Access Fuel Prices via API or Email (GOV.UK)](https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email)
2. Follow the link to the **Fuel Finder Developer Portal** (`https://www.fuel-finder.service.gov.uk`).
3. Sign in using your **GOV.UK One Login**.
4. Register your application in the developer console to obtain your:
   - `client_id`
   - `client_secret`

---

## 3. Configuration & Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```ini
# Fuel Finder OAuth 2.0 Credentials
FUEL_FINDER_CLIENT_ID=your_client_id_here
FUEL_FINDER_CLIENT_SECRET=your_client_secret_here
FUEL_FINDER_ENVIRONMENT=production # or "test"

# Optional Alternative: Ingest from bulk CSV
# FUEL_FINDER_CSV_PATH=./data/fuel_finder.csv
# FUEL_FINDER_CSV_URL=https://...
```

> **Security Note:** `.env` is listed in `.gitignore` and must never be committed to source control.

---

## 4. Running the Importer Script

### Option A: Via Fuel Finder REST API (Default)
When `FUEL_FINDER_CLIENT_ID` and `FUEL_FINDER_CLIENT_SECRET` are set in `.env`:

```bash
npm run update-fuel
```

### Option B: Via Official CSV Extract
You can pass the path or URL to the official CSV file using the `--csv` flag:

```bash
npm run update-fuel -- --csv ./data/fuel_finder_latest.csv
# Or remote URL:
npm run update-fuel -- --csv https://example.com/fuel_finder_export.csv
```

### Features of the Importer Engine:
- **Strict Price Validation:** Accepts only prices strictly between **100.0p and 250.0p** per litre.
- **Expiration Policy:** Prices older than **48 hours** are flagged as expired and discarded.
- **UK Bounding Box Check:** Rejects missing coordinates, `(0, 0)`, and points outside mainland UK & NI boundaries.
- **Record Discard Logging:** Reports counts of discarded records categorized by reason (missing ID, out-of-bounds coordinates, no valid unexpired prices).
- **20% Drop Protection (Safety Guard):** If the new station count drops by more than 20% compared to the existing dataset, the update aborts automatically to protect against data loss.
- **Atomic Writes:** Writes to `data/uk_stations.json.tmp` first and renames atomically upon complete validation.
- **Computed National Averages:** Dynamically computes mean fuel prices across all active stations and stores them in file metadata.

---

## 5. Scheduling Automatic Ingestion (Cron / Automation)

To keep prices updated with the 30-minute statutory reporting window, schedule the script to run every 30 to 60 minutes.

### Linux / macOS (Crontab)
Open your crontab editor:

```bash
crontab -e
```

Add an entry to run every 30 minutes:

```bash
*/30 * * * * cd /path/to/uk-petrostation && /usr/bin/npm run update-fuel >> /var/log/fuelradar-sync.log 2>&1
```

### Windows (Task Scheduler via PowerShell)
Create a scheduled task running every 30 minutes:

```powershell
$action = New-ScheduledTaskAction -Execute "npm.cmd" -Argument "run update-fuel" -WorkingDirectory "C:\Users\Usuario\Desktop\pruebas\uk-petrostation"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName "FuelRadarUK-Sync" -Action $action -Trigger $trigger
```

---

## 6. Running Unit Tests

The test suite runs **100% offline without any network access**, using fixtures to verify validation rules, coordinate boundaries, expiration, safety guards, and CSV parsing:

```bash
npm test
```

Expected output:
```text
TAP version 13
# Subtest: 1. Price Validation (100 - 250 pence/litre)
  ...
# Subtest: 2. Coordinates Validation & UK Bounding Box
  ...
# Subtest: 3. Price Expiration (> 48 hours)
  ...
# Subtest: 4. Record Normalization & Incomplete Record Discarding
  ...
# Subtest: 5. Station Count Drop Threshold Protection (>20%)
  ...
# Subtest: 6. Calculation of National Averages
  ...
# Subtest: 7. Official CSV Parsing with Fixture Data
  ...
# tests 20
# suites 7
# pass 20
# fail 0
```

---

## 7. Development & Production Build

```bash
# Run local development server
npm run dev

# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 8. Licencing & Attribution

- **Fuel Price & Forecourt Data:** the current snapshot comes from retailer feeds of the CMA interim fuel price scheme (closed 1 May 2026). Data imported with the importer comes from the official UK Fuel Finder service (*The Motor Fuel Price (Open Data) Regulations 2025*) under the **Open Government Licence v3.0**.
- **Map Tiles:** © [CARTO](https://carto.com/) © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

## 9. Advertising

Ad blocks (`src/components/AdSlot.tsx`) are only rendered when `NEXT_PUBLIC_ADSENSE_CLIENT` is set (see `.env.example`). Without it, no ad placeholder is shown.
