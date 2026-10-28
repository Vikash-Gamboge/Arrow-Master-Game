# Google AdMob Android Integration Guide
**Game**: Arrow Master : Puzzle Escape  
**Developer**: Vikash Gamboge  
**Support Email**: vikashtopofficial@gmail.com  
**Rewarded Ad Unit ID**: `ca-app-pub-1210044624609081/7094400616`

---

## 1. Runtime Architecture Overview
This project is built using **React 19 + TypeScript + Vite**. In the web browser / preview environment:
- Native Android Google Mobile Ads SDK (`play-services-ads`) cannot run directly inside standard desktop web browsers.
- The game includes native bridge support (`window.AndroidAdBridge`, `window.admob`, and Capacitor AdMob plugin) so that once packaged for Android, real AdMob ads load and display automatically.
- In preview/web mode, the UI gracefully informs the player and protects gameplay without throwing errors or displaying technical ad unit IDs.

---

## 2. Packaging for Android with Capacitor & Official AdMob SDK

To build and package this project into a native Android `.apk` / `.aab` with Google Mobile Ads SDK:

### Step 1: Install Capacitor and AdMob Plugin
In your terminal, run:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor-community/admob
npx cap init "Arrow Master : Puzzle Escape" com.vikashgamboge.arrowmaster --web-dir dist
```

### Step 2: Build the Web Assets
```bash
npm run build
npx cap add android
npx cap sync
```

### Step 3: Configure AdMob Application ID in `AndroidManifest.xml`
Open `android/app/src/main/AndroidManifest.xml` and add your **AdMob App ID** inside the `<application>` tag:
```xml
<manifest ...>
    <application ...>
        <!-- Replace ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy with your real AdMob Application ID -->
        <!-- Note: Do NOT use the Ad Unit ID here. App ID has a '~' tilde separator. -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-1210044624609081~XXXXXXXXXX"/>
    </application>
</manifest>
```

### Step 4: Verify Rewarded Ad Unit ID
In `src/game/admobConfig.ts`, your real Rewarded Ad Unit ID is already configured:
```typescript
export const REWARDED_AD_UNIT_ID = 'ca-app-pub-1210044624609081/7094400616';
```

### Step 5: Test on Device or Android Emulator
Run:
```bash
npx cap open android
```
- In Android Studio, select your physical Android device or emulator.
- Use Google's official test ad unit during initial testing to avoid invalid traffic flags on your AdMob account:
  - Test Rewarded ID: `ca-app-pub-3940256099942544/5224354917`
- Once verified, deploy with your real Rewarded Ad Unit ID `ca-app-pub-1210044624609081/7094400616`.
- Verify the OnUserEarnedReward callback awards exactly +1 extra life and resumes gameplay with the remaining arrows intact.
