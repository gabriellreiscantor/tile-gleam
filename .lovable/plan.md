# Ads Implementation Plan: Banner + Rewarded Ads

## Overview
Implement a bottom banner ad (always visible) + rewarded ads for continue functionality, using the `@capacitor-community/admob` plugin. The system includes a development placeholder banner and full AdMob integration for production.

## Selected Option
**Banner inferior + anuncios recompensados**: Fixed banner at bottom + optional rewarded ads for game continues.

---

## Phase 3A: Ad Configuration & Service

### Step 1: Create Ad Configuration File
**File: `src/lib/adConfig.ts`**

Create a centralized configuration for all ad unit IDs:
- iOS banner/rewarded unit IDs
- Android banner/rewarded unit IDs
- Test ad unit IDs from Google for development
- Flag to toggle between test/production ads

### Step 2: Create Ad Service
**File: `src/lib/adService.ts`**

Create a service layer to manage ads:
- `initializeAds()` - Initialize AdMob with personalization settings
- `showBanner()` - Show bottom banner ad
- `hideBanner()` - Hide banner ad
- `showRewardedAd()` - Show rewarded ad and return promise with reward
- `preloadRewardedAd()` - Preload rewarded ad for faster display
- Platform detection (web shows placeholder, native shows real ads)

---

## Phase 3B: Banner Ad Placeholder Component

### Step 3: Create BannerAd Component
**File: `src/components/game/BannerAd.tsx`**

Create a component that:
- Displays a placeholder banner in web/dev mode (320x50 standard size)
- Reserves space at bottom with safe-area handling
- Has subtle styling matching the game aesthetic
- Shows "Ad" indicator in dev mode

### Step 4: Create SafeAreaProvider
**File: `src/components/game/SafeAreaProvider.tsx`**

Create a context to provide safe-area dimensions:
- Uses `env(safe-area-inset-*)` CSS values
- Provides bottom padding for banner + safe area
- Works on both iOS notch devices and Android

---

## Phase 3C: Layout Integration

### Step 5: Update Index Page Layout
**File: `src/pages/Index.tsx`**

Modify layout to:
- Wrap game in SafeAreaProvider
- Add BannerAd at the bottom (fixed position)
- Ensure game content doesn't overlap banner

### Step 6: Update BlockBlastGame Layout
**File: `src/components/game/BlockBlastGame.tsx`**

Adjust the game container:
- Add bottom padding to account for banner height
- Ensure PieceTray doesn't overlap banner
- Pass banner height to child components if needed

---

## Phase 3D: Rewarded Ad Integration

### Step 7: Update ContinueModal for Real Ads
**File: `src/components/game/ContinueModal.tsx`**

Modify the "Watch Ad" button to:
- Call `showRewardedAd()` from adService
- Handle ad load/show states (loading spinner)
- Handle ad completion (grant continue)
- Handle ad failure (show error, offer retry)
- Handle user closed ad early (no reward)

### Step 8: Update BlockBlastGame handleContinueAd
**File: `src/components/game/BlockBlastGame.tsx`**

Update the `handleContinueAd` function to:
- Integrate with actual rewarded ad flow
- Wait for ad completion before granting continue
- Handle ad errors gracefully

---

## Phase 3E: Privacy Integration

### Step 9: Wire Privacy Preferences to Ads
**File: `src/lib/adService.ts`**

Connect privacy settings:
- Read `personalizedAds` from settings
- Pass to AdMob initialization (GDPR/ATT compliance)
- Request non-personalized ads if disabled

---

## File Structure Summary

```
src/
  lib/
    adConfig.ts         (NEW) - Ad unit IDs configuration
    adService.ts        (NEW) - Ad management service
  components/
    game/
      BannerAd.tsx      (NEW) - Banner ad placeholder/component
      SafeAreaProvider.tsx (NEW) - Safe area context
      ContinueModal.tsx (EDIT) - Add real rewarded ad flow
      BlockBlastGame.tsx (EDIT) - Layout adjustments
  pages/
    Index.tsx           (EDIT) - Add banner to layout
```

---

## Dependencies to Add

For production Capacitor app:
```bash
npm install @capacitor-community/admob
npx cap sync
```

For web development, no additional dependencies needed (placeholder mode).

---

## Implementation Details

### Banner Placeholder (Dev Mode)
- Fixed 50px height at bottom
- Background: semi-transparent with border
- Text: "Advertisement" centered
- Respects safe-area-inset-bottom

### Banner Ad Position
- Position: `BOTTOM_CENTER`
- Size: `ADAPTIVE_BANNER` (responsive width)
- Margin: safe-area-inset-bottom

### Rewarded Ad Flow
1. User taps "Watch Ad to Continue"
2. Show loading state on button
3. Load rewarded ad if not preloaded
4. Show rewarded ad
5. Wait for `rewarded.reward` event
6. Grant continue and resume game
7. Preload next rewarded ad in background

### Error Handling
- No internet: Show "Ad unavailable" message
- Ad failed to load: Offer retry or skip
- User closed early: No reward, button resets
- Ad unavailable: Hide ad option, show paid only

---

## Testing Checklist
- [ ] Banner shows at bottom on web (placeholder)
- [ ] Game content doesn't overlap banner
- [ ] Safe area respected on iOS devices
- [ ] "Watch Ad" button shows loading state
- [ ] Continue granted after ad completion
- [ ] Error states handled gracefully
- [ ] Privacy preferences respected

---

## Critical Files for Implementation
- `src/lib/adConfig.ts` - Central configuration for all ad unit IDs
- `src/lib/adService.ts` - Core ad management logic
- `src/components/game/BannerAd.tsx` - Visual banner component
- `src/components/game/BlockBlastGame.tsx` - Layout integration
- `src/components/game/ContinueModal.tsx` - Rewarded ad trigger
