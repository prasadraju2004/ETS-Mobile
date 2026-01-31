# SeatingScreen Debugging Guide

## Issues Found & Fixed

### 1. ❌ CRITICAL: Missing Backend Schema Fields

**File**: `backend/src/venue/venue.schema.ts`
**Issue**: The Venue schema was missing `mapDimensions` and `stagePosition` fields that SeatingScreen requires.

**Fixed**: Added two new classes:

```typescript
@Schema({ _id: false })
export class MapDimensions {
  @Prop({ required: true }) width: number;
  @Prop({ required: true }) height: number;
}

@Schema({ _id: false })
export class StagePosition {
  @Prop({ required: true }) x: number;
  @Prop({ required: true }) y: number;
}
```

And added them to the Venue class:

```typescript
@Prop({ type: MapDimensions })
mapDimensions?: MapDimensions;

@Prop({ type: StagePosition })
stagePosition?: StagePosition;
```

**Impact**: Without these fields, the SVG canvas dimensions were using defaults (2000x2000), and the stage wasn't rendering.

---

### 2. 🔍 Added Comprehensive Debug Logging

#### API Response Data Logging

**Location**: `SeatingScreen.js` - Initial load effect (~line 385)
Logs what the backend is actually returning:

```javascript
console.log("=== VENUE DATA ===");
console.log("Venue ID:", vData._id);
console.log("Map Dimensions:", vData.mapDimensions);
console.log("Stage Position:", vData.stagePosition);
console.log("Sections:", vData.sections?.length);
if (vData.sections && vData.sections.length > 0) {
  console.log("First section:", vData.sections[0]);
  console.log("First section seats:", vData.sections[0].seats?.length);
  if (vData.sections[0].seats && vData.sections[0].seats.length > 0) {
    console.log("First seat:", vData.sections[0].seats[0]);
  }
}

console.log("=== SEATS DATA ===");
console.log("Total seats:", seatsData.length);
if (seatsData.length > 0) {
  console.log("First seat:", seatsData[0]);
  console.log("Sample seats:", seatsData.slice(0, 3));
}
```

#### Rendered Seats Processing

**Location**: `SeatingScreen.js` - useMemo (~line 510)
Shows what seats are being rendered and catches coordinate issues:

```javascript
console.log("=== RENDERED SEATS ===");
console.log("Total rendered seats:", outputSeats.length);
if (outputSeats.length > 0) {
  console.log("Sample seats:", outputSeats.slice(0, 3));
  const seatsWithoutCoords = outputSeats.filter(
    (s) => s.x === undefined || s.y === undefined,
  );
  if (seatsWithoutCoords.length > 0) {
    console.warn(
      "⚠️ CRITICAL: Found seats without coordinates:",
      seatsWithoutCoords.length,
    );
    console.warn("Example:", seatsWithoutCoords[0]);
  }
}
```

#### Tap Detection Debugging

**Location**: `SeatingScreen.js` - onPanResponderRelease (~line 282)
Traces every step of the coordinate transformation:

```javascript
console.log("=== TAP DETECTION ===");
console.log("Touch screen:", { x: touchX, y: touchY });
console.log("Map layout:", mapLayout);
console.log("Offset:", { x: tx, y: ty });
console.log("Scale:", s);
console.log("World coords:", { x: worldX, y: worldY });
console.log("Available seats in seatsRef:", seatsRef.current?.length);
// ...
console.log("Closest seat:", closest?.key, "Distance:", Math.sqrt(minDist));
console.log(
  "Threshold:",
  TOUCH_THRESHOLD,
  "Will select:",
  closest && minDist < TOUCH_THRESHOLD ** 2,
);
```

#### Zoom/Pinch Detection

**Location**: `SeatingScreen.js` - onPanResponderMove (~line 247)
Tracks pinch gesture scaling:

```javascript
console.log("=== PINCH ZOOM ===");
console.log("Distance ratio:", factor);
console.log("New scale:", newScale);
```

#### SVG Layout Measurement

**Location**: `SeatingScreen.js` - View onLayout (~line 734)
Verifies the SVG container is properly measured:

```javascript
console.log("=== MAP LAYOUT ===");
console.log("Measured layout:", layout);
```

---

## How to Use These Logs

### Step 1: Check Backend Data

Open React Native debugger console and run the seating screen. Look for:

1. `=== VENUE DATA ===` - Should show mapDimensions with width/height
2. `=== SEATS DATA ===` - Should show seats with x, y, price, lockedBy fields

**If mapDimensions is missing or null**, you need to update the venue data in MongoDB with map dimensions.

### Step 2: Check Rendered Seats

Look for `=== RENDERED SEATS ===` section:

- Total should match or be close to backend seats count
- Sample seats should have x and y values
- ⚠️ If you see "CRITICAL: Found seats without coordinates", the issue is that `layoutSeat.x` or `layoutSeat.y` are undefined in the venue schema

### Step 3: Test Zoom

Try pinching with two fingers. Should see `=== PINCH ZOOM ===` logs with increasing/decreasing distance ratios and scale values.

### Step 4: Test Tap Detection

Tap on a seat. Should see:

```
=== TAP DETECTION ===
Touch screen: { x: 123, y: 456 }
Map layout: { x: 0, y: 100, width: 400, height: 700 }
Offset: { x: 50, y: 75 }
Scale: 0.85
World coords: { x: 85, y: 118 }
Available seats in seatsRef: 240
Closest seat: A-1-5 Distance: 12.5
Threshold: 40 Will select: true
```

If "Distance:" is much larger than 40 (the threshold), the coordinate transformation is off.

---

## Common Issues & Solutions

### Issue: Seats not visible

**Causes**:

1. `mapDimensions` not set → seats use default 2000x2000 viewport
2. `section.boundary` not set → sections not rendered
3. `section.seats` array is empty → no seats to render

**Fix**: Check backend data in MongoDB:

```bash
db.venues.findOne({_id: ObjectId("...")})
```

Verify:

- `mapDimensions.width` and `mapDimensions.height` are set
- `sections[0].seats` array has x, y values
- `sections[0].boundary` is an array of polygon points

### Issue: Taps not selecting seats (Distance is huge)

**Causes**:

1. `mapLayout` not measured properly (x/y offset wrong)
2. Scale not being set correctly
3. Coordinate formula assumes wrong transform order

**Check in logs**:

- Is `mapLayout` showing { x: 0, y: ... }?
- Is `Scale` showing ~0.85 initially?
- Is `World coords` in reasonable range (e.g., 0-2000)?

### Issue: Zoom not working

**Causes**:

1. Two-finger pinch not being detected
2. Animated.Value not updating AnimatedG
3. AnimatedG transform not using `useNativeDriver`

**Check in logs**:

- Do you see `=== PINCH ZOOM ===` logs when pinching?
- Does `New scale` change from 0.8-3.0?

---

## Detailed Code Explanation

### Coordinate Transformation Formula

The SeatingScreen uses this logic:

1. User taps at screen position (touchX, touchY)
2. Convert to relative to SVG container: `localX = touchX - mapLayout.x`
3. Apply inverse transform to get world coordinates:
   ```
   worldX = (localX - offsetX) / scale
   worldY = (localY - offsetY) / scale
   ```
4. Find closest seat in world space
5. If within TOUCH_THRESHOLD (40px), select it

### Refs for Performance

- `seatsRef`: Holds current seats array (updated via useEffect)
- `handlerRef`: Holds current handler function (updated via useEffect)
- `scaleRef`, `offsetRef`: Track current transform values

These are refs (not state) so gesture handlers don't trigger re-renders.

---

## Next Steps if Still Failing

1. **Venue data check**: Run this in backend:

```typescript
const venue = await this.venueModel.findById(venueId);
console.log("Venue structure:", JSON.stringify(venue, null, 2));
```

2. **Add more specific logs** to see exact seat coordinates:

```javascript
if (outputSeats.length > 0) {
  console.log("Seat coordinates:");
  outputSeats.slice(0, 5).forEach((s) => {
    console.log(`  ${s.key}: (${s.x}, ${s.y})`);
  });
}
```

3. **Test with hardcoded data** to isolate issues:

```javascript
const testVenue = {
  mapDimensions: { width: 1000, height: 800 },
  stagePosition: { x: 500, y: 100 },
  sections: [
    {
      id: "TEST",
      name: "Test Section",
      seats: [
        { row: "A", number: 1, x: 200, y: 300, type: "STANDARD" },
        { row: "A", number: 2, x: 250, y: 300, type: "STANDARD" },
      ],
    },
  ],
};
```
