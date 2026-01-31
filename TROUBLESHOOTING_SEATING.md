# Seating Screen Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Cannot connect to server" Error

**Symptoms:**

- Error message: "Cannot connect to server. Check your network and API URL."
- Loading screen shows briefly then error appears

**Solutions:**

1. **Restart Metro Bundler with Cache Clear**

   ```bash
   # Stop current Metro (Ctrl+C in terminal)
   npx expo start -c
   ```

   > After changing `.env`, you MUST restart Metro to load the new environment variables!

2. **Verify API URL in `.env`**

   ```env
   # Open .env file and check:
   EXPO_PUBLIC_API_URL=http://YOUR_IP:5000
   ```

3. **Find Your Current IP Address**

   **Windows:**

   ```bash
   ipconfig
   ```

   Look for "IPv4 Address" (e.g., 192.168.1.100)

   **Mac/Linux:**

   ```bash
   ifconfig
   # or
   hostname -I
   ```

4. **Verify Backend is Running**
   - Make sure your backend server is running
   - Test in browser: `http://YOUR_IP:5000/events` should show a response

5. **Check Same Network**
   - Your phone/emulator and computer must be on the same WiFi network
   - Disable VPN if active

### Issue 2: "No venue found for this event"

**Symptoms:**

- Error message: "No venue found for this event"
- Event loads but venue is missing

**Solutions:**

1. **Check Event Data Structure**

   Event must have one of these:

   ```javascript
   {
     _id: "...",
     venueId: "venue_id_here",  // Option 1: venueId field
     // OR
     venue: {                    // Option 2: populated venue
       _id: "venue_id_here"
     }
   }
   ```

2. **Verify in Backend**

   ```bash
   # Test event endpoint
   curl http://YOUR_IP:5000/events/EVENT_ID
   ```

   Should return event with `venueId` or `venue._id`

3. **Check Database**
   - Ensure event document has `venueId` field
   - Verify the venue exists in the venues collection

### Issue 3: Event Doesn't Navigate to Seating Screen

**Symptoms:**

- Clicking "Book Tickets" shows alert instead of opening seating screen
- Alert: "General admission tickets - Coming soon!"

**Solutions:**

1. **Check Event Seating Type**

   Event must have:

   ```javascript
   {
     seatingType: "SEATED",  // or "ALLOCATED"
     venue: { /* venue data */ }  // or venueId
   }
   ```

2. **Update Event in Database**
   ```javascript
   // MongoDB example
   db.events.updateOne(
     { _id: ObjectId("EVENT_ID") },
     {
       $set: {
         seatingType: "SEATED",
         venueId: ObjectId("VENUE_ID"),
       },
     },
   );
   ```

### Issue 4: Seats Not Appearing

**Symptoms:**

- Seating screen loads but no seats visible
- Only stage/sections show

**Solutions:**

1. **Check Venue Structure**

   Venue must have sections with seats:

   ```javascript
   {
     name: "Arena",
     sections: [
       {
         sectionId: "z1",
         name: "Premium",
         color: "#F43F5E",
         boundary: [
           { x: 100, y: 100 },
           { x: 200, y: 100 },
           // ... more points
         ],
         seats: [
           {
             row: "A",
             seatNumber: 1,
             position: { x: 150, y: 120 }
           },
           // ... more seats
         ]
       }
     ],
     mapDimensions: { width: 700, height: 550 },
     stagePosition: { x: 350, y: 50 }
   }
   ```

2. **Check Seats Collection**

   ```bash
   # Verify seats exist for the event
   curl http://YOUR_IP:5000/seats/event/EVENT_ID
   ```

3. **Verify Seat Matching**
   - Seats in seats collection must match venue section seats
   - Match by: `sectionId-row-seatNumber`

### Issue 5: Authentication Errors

**Symptoms:**

- Can't select seats
- "Login Required" alert appears

**Solutions:**

1. **Verify User is Logged In**
   - Check AuthContext has user data
   - User must have `_id` field

2. **Check Customer Endpoint**

   ```bash
   curl http://YOUR_IP:5000/customers/user/USER_ID
   ```

   Should return customer data

3. **Create Customer if Missing**
   - Ensure user has corresponding customer record
   - Customer should have same userId

## Debugging Steps

### Step 1: Check Console Logs

Open React Native debugger and look for:

```
=== Loading Seating Data ===
Event passed: { _id: "...", ... }
Fetching event data for ID: ...
Event data received: { ... }
Fetching venue data for ID: ...
Venue data received: { ... }
Fetching seats for event ID: ...
Seats data received: { ... }
=== Seating Data Loaded Successfully ===
```

### Step 2: Check API URL

In console, look for:

```
API URL: http://YOUR_IP:5000
```

If it shows `http://localhost:5000`, your `.env` isn't loaded:

1. Restart Metro with `npx expo start -c`
2. Verify `.env` file exists in project root

### Step 3: Test Backend Endpoints

Test each endpoint manually:

```bash
# 1. Get event
curl http://YOUR_IP:5000/events/EVENT_ID

# 2. Get venue
curl http://YOUR_IP:5000/venue/VENUE_ID

# 3. Get seats
curl http://YOUR_IP:5000/seats/event/EVENT_ID

# 4. Get customer (if logged in)
curl http://YOUR_IP:5000/customers/user/USER_ID
```

### Step 4: Check Network Tab

Use network inspector to see actual requests:

1. Open React Native Debugger
2. Go to Network tab
3. Navigate to seating screen
4. Check requests and responses

## Quick Fix Checklist

- [ ] Restarted Metro with `npx expo start -c`
- [ ] Updated `.env` with correct IP address
- [ ] Backend server is running on specified port
- [ ] Phone/emulator on same network as computer
- [ ] Event has `venueId` or `venue._id`
- [ ] Event has `seatingType: "SEATED"`
- [ ] Venue exists in database
- [ ] Venue has sections with seats
- [ ] Seats collection has data for event
- [ ] User is logged in (if selecting seats)

## Error Messages Reference

| Error Message                | Likely Cause              | Solution                    |
| ---------------------------- | ------------------------- | --------------------------- |
| "Cannot connect to server"   | Network/API URL issue     | Check `.env`, restart Metro |
| "No venue found"             | Event missing venueId     | Update event in database    |
| "Failed to load seating map" | Generic error             | Check console logs          |
| "Login Required"             | User not authenticated    | Login first                 |
| "This seat is not available" | Seat status not AVAILABLE | Refresh or choose another   |

## Still Having Issues?

1. **Share Console Logs**
   - Copy the console output showing the error
   - Include all logs from "=== Loading Seating Data ===" section

2. **Test Event Data**

   ```javascript
   // In EventDetailsScreen, add:
   console.log("Event being passed to Seating:", event);
   ```

3. **Verify Backend Response**
   - Use Postman/curl to test endpoints
   - Share the actual responses

4. **Check Environment**
   ```javascript
   // In SeatingScreen, add at top:
   console.log("ENV API URL:", process.env.EXPO_PUBLIC_API_URL);
   ```

## Example Working Configuration

**`.env`**

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
```

**Event**

```json
{
  "_id": "67a1b2c3d4e5f6",
  "name": "Movie Premiere",
  "seatingType": "SEATED",
  "venueId": "67a1b2c3d4e5f7",
  "zonePricing": {
    "z1": 150,
    "z2": 100
  }
}
```

**Venue**

```json
{
  "_id": "67a1b2c3d4e5f7",
  "name": "Arena Stage 1",
  "sections": [...],
  "mapDimensions": { "width": 700, "height": 550 },
  "stagePosition": { "x": 350, "y": 50 }
}
```
