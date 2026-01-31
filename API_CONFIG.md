# API Configuration Guide

## Quick Setup

### 1. Configure API URL

The API URL is now centralized in the `.env` file. You only need to update it in **one place** when you change networks!

**File:** `.env`

```env
EXPO_PUBLIC_API_URL=http://10.0.10.116:5000
```

### 2. Finding Your IP Address

#### Windows

```bash
ipconfig
```

Look for "IPv4 Address" under your active network adapter.

#### Mac/Linux

```bash
ifconfig
# or
ip addr show
```

#### Android Emulator

Use the special IP that maps to your host machine:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
```

### 3. Physical Device (Phone/Tablet)

Use your computer's LAN IP address (both devices must be on the same network):

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
```

### 4. Apply Changes

After updating `.env`:

```bash
# Stop the metro bundler (Ctrl+C)
# Clear cache and restart
npx expo start -c
```

## How It Works

### Before ❌

API URL was hardcoded in every file:

```javascript
const API_URL = "http://10.0.10.116:5000"; // Had to change everywhere!
```

### After ✅

API URL is centralized in `.env`:

**`.env`** (not committed to git)

```env
EXPO_PUBLIC_API_URL=http://10.0.10.116:5000
```

**`client.js`** (automatically uses .env)

```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL;
```

All API calls now use the centralized URL!

## Usage in Code

### Using the API Client (Recommended)

```javascript
import { client } from "../api/client";

// GET request
const response = await client.get("/events");

// POST request
const response = await client.post("/auth/login", {
  email: "user@example.com",
  password: "password123",
});
```

### Direct Usage

```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL;
console.log("Backend URL:", API_URL);
```

## Troubleshooting

### Issue: "Network Error" or "Cannot connect"

1. **Check your IP address**
   - Make sure the IP in `.env` matches your computer's current IP
   - Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

2. **Check same network**
   - Your phone and computer must be on the same WiFi network

3. **Check backend is running**
   - Make sure your backend server is running on port 5000
   - Visit the URL in your browser to verify

4. **Clear Expo cache**
   ```bash
   npx expo start -c
   ```

### Issue: Changes not reflecting

If you change the `.env` file, you MUST restart the Metro bundler:

```bash
# Stop with Ctrl+C
npx expo start -c
```

## Environment Variables in Expo

Note: In Expo, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in your React Native code.

✅ **Correct:** `EXPO_PUBLIC_API_URL`  
❌ **Wrong:** `API_URL` or `REACT_APP_API_URL`

## Files

| File                | Purpose                        | Committed to Git? |
| ------------------- | ------------------------------ | ----------------- |
| `.env`              | Your actual configuration      | ❌ No (ignored)   |
| `.env.example`      | Template for other developers  | ✅ Yes            |
| `src/api/client.js` | Axios client using the env var | ✅ Yes            |

## Common Configurations

### Development on Android Emulator

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
```

### Development on Physical Device (LAN)

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000
```

### Production (when deployed)

```env
EXPO_PUBLIC_API_URL=https://api.yourapp.com
```

## Summary

- ✅ **One place** to update: `.env` file
- ✅ API URL automatically used everywhere via `client` import
- ✅ No more searching through files when changing networks
- ✅ Clear cache and restart to apply changes

**Need to change networks?**

1. Update `EXPO_PUBLIC_API_URL` in `.env`
2. Restart Metro bundler with `npx expo start -c`
3. Done! 🎉
