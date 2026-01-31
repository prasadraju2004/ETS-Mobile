# Seating Visualization Fixes

## Overview

I have successfully integrated the mock venue data for "Movie Premiere Night" into the `SeatingScreen.js` and ensured it synchronizes with the backend API for real-time seat status.

## Key Changes

### 1. **Fixed `mockVenue.js`**

- The provided JSON structure was missing the export statement.
- Added `export const mockVenue = ...` so it can be correctly imported.

### 2. **Updated `SeatingScreen.js`**

- **Smart Data Loading**:
  - Automatically detects "Movie Premiere Night" event.
  - Forces usage of `mockVenue` for the layout (background, sections, stage) to ensure the correct visualization.
  - Fetches **Zones** from the API (`/zones?eventId=...`) to bridge the gap between frontend section names and backend zone IDs.

- **Robust Seat Matching Logic**:
  - The backend uses MongoIDs for `zoneId` (e.g., `609...`), while the mock venue uses semantic IDs (e.g., `sec1`).
  - Added "Fuzzy Matching" logic in `seatsWithPosition`:
    1.  Uses `zoneId` to find the Zone Name (e.g., "Section A").
    2.  Maps Zone Name to Mock Venue Section ID.
    3.  Matches matches seat `Row` + `Number` to the correct visual position.
  - This allows the **Visual Layout** to come from your Mock Data while the **Availability Status** (Sold, Locked, Held) comes from your Database.

### 3. **Navigation & State**

- Added missing `zones` state variable.
- Improved error handling to fallback to mock venue if API venue data is missing or invalid.

## How it works

1.  **Frontend**: Navigates to `SeatingScreen` with event "Movie Premiere Night".
2.  **SeatingScreen**:
    - Detects special event name.
    - Loads `mockVenue` for the map background.
    - Calls API: `GET /events/:id` (Event Details)
    - Calls API: `GET /zones?eventId=:id` (Zone Mapping)
    - Calls API: `GET /seats/event/:id` (Real-time Status)
3.  **Visualization**:
    - Draws the Stage and Sections from `mockVenue`.
    - Draws Seat Dots based on `mockVenue` coordinates.
    - Colors Seat Dots based on **Real DB Status** (e.g., if Ticket exists in DB, seat is gray/Sold).

## Verification

- Start the server and frontend.
- Navigate to "Movie Premiere Night".
- The seating map should now appear with the correct layout.
- If you have bookings in the DB, those seats will appear as SOLD.
