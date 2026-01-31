# Quick Fix: "No event provided" Error

## The Problem

The error "No event provided" appears because the event being passed to SeatingScreen either:

1. **Doesn't exist** (is undefined/null)
2. **Doesn't have an `_id` field**
3. **Is using mock data** instead of real backend data

## What To Do Now

### Step 1: Reload Your App

After the code changes, reload your app:

- **Shake device** → Press "Reload"
- Or press **`r`** in the Metro bundler terminal

### Step 2: Navigate to Event Details

1. Go to the **Explore/Events screen**
2. Click on **any event** to open Event Details

### Step 3: Check Console Logs

Before clicking "Book Tickets", check the console. You should see what event data you have.

### Step 4: Click "Book Tickets"

You'll now see detailed logs:

```
=== Book Tickets Pressed ===
Event data: { ... }
Event._id: undefined  ← THIS IS THE ISSUE!
Event.seatingType: undefined
Event.venue: undefined
Is seated event: false
Not navigating - showing alert
```

## Root Cause

Looking at `EventDetailsScreen.js` line 24-38, it's using **mock data**:

```javascript
const event = route?.params?.event || {
  // This is MOCK data - no _id!
  title: "City Marathon 2026",
  likes: 9813,
  // ... etc
  // ← Missing _id, seatingType, venue!
};
```

## Solutions

### Solution 1: Use Real Backend Data (Recommended)

**Navigate from a screen that fetches real events:**

The event needs to come from your backend with these fields:

```javascript
{
  _id: "67a1b2c3d4e5f6",          // ← Required!
  name: "Movie Premiere",
  seatingType: "SEATED",           // ← Required!
  venueId: "67a1b2c3d4e5f7",      // ← Required!
  venue: { _id: "..." },           // OR populated venue
  // ... other fields
}
```

**How to get real data:**

1. Make sure you have an **ExploreScreen** or **EventsListScreen** that fetches events from backend:

   ```javascript
   const response = await client.get("/events");
   const events = response.data;
   ```

2. Navigate to EventDetailsScreen with the real event:
   ```javascript
   navigation.navigate("EventDetails", { event: realEvent });
   ```

### Solution 2: Temporary Mock Data Fix

**For testing only**, update the mock data in `EventDetailsScreen.js`:

```javascript
const event = route?.params?.event || {
  _id: "test-event-123", // ← Add this
  name: "Movie Premiere Night", // Changed from 'title'
  seatingType: "SEATED", // ← Add this
  venueId: "test-venue-456", // ← Add this
  venue: { _id: "test-venue-456" }, // ← Add this
  image:
    "https://images.unsplash.com/photo-1459749411177-2a25413f3120?q=80&w=2070&auto=format&fit=crop",
  likes: 9813,
  date: "Jan 12, 11:00 AM",
  location: "City Roads, Delhi",
  description: "Experience an unforgettable event...",
  type: "Sports",
  tag: "SELLING FAST",
  price: "From $45",
  status: "Open",
  statusColor: "#10B981",
};
```

**⚠️ Warning:** This is just for testing! In production, you need real backend data.

## What The Logs Will Show

### If Event Has No \_id:

```
=== Book Tickets Pressed ===
Event data: { title: "...", likes: 9813, ... }
Event._id: undefined  ← Problem here!
Event.seatingType: undefined
Not navigating - showing alert
```

### If Event Has \_id But No seatingType:

```
=== Book Tickets Pressed ===
Event data: { _id: "...", title: "..." }
Event._id: "67a1b2c3d4e5f6" ✓
Event.seatingType: undefined  ← Problem here!
Is seated event: false
Not navigating - showing alert
```

### When Everything Is Correct:

```
=== Book Tickets Pressed ===
Event data: { _id: "...", seatingType: "SEATED", venue: {...} }
Event._id: "67a1b2c3d4e5f6" ✓
Event.seatingType: "SEATED" ✓
Event.venue: { _id: "..." } ✓
Is seated event: true ✓
Navigating to Seating screen with event: {...}

=== SeatingScreen Mounted ===
Route params: { event: { _id: "...", ... } }
Event received: { _id: "...", ... }
Event._id: "67a1b2c3d4e5f6" ✓
useEffect triggered, checking event: {...}
=== Loading Seating Data ===
```

## Check Your Backend

Make sure your backend has:

1. **Events with proper fields:**

   ```bash
   curl http://192.168.0.103:5000/events
   ```

   Should return:

   ```json
   [
     {
       "_id": "67a1b2c3d4e5f6",
       "name": "Movie Premiere",
       "seatingType": "SEATED",
       "venueId": "67a1b2c3d4e5f7"
     }
   ]
   ```

2. **Venue exists:**

   ```bash
   curl http://192.168.0.103:5000/venue/67a1b2c3d4e5f7
   ```

3. **Seats exist for event:**
   ```bash
   curl http://192.168.0.103:5000/seats/event/67a1b2c3d4e5f6
   ```

## Summary

**The issue:** Mock data in EventDetailsScreen doesn't have `_id`, `seatingType`, or `venue` fields.

**The fix:** Either:

1. ✅ **Fetch real events from backend** (proper solution)
2. 🔧 **Add missing fields to mock data** (temporary test)

**Next step:** Reload app and check console logs to see exactly what data you have!
