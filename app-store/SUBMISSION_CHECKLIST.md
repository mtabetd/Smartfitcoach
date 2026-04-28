# SmartFitCoach — App Store Submission Checklist

## Prerequisites (one-time setup)

- [ ] Apple Developer Account active ($99/year) — developer.apple.com
- [ ] Mac with Xcode 15+ installed
- [ ] CocoaPods installed: `sudo gem install cocoapods`

---

## Step 1 — First build on Mac

```bash
# On your Mac, clone the repo then:
npm install
npm run cap:build:ios   # builds + opens Xcode
```

In Xcode:
- Set Team: Signing & Capabilities → Team → select your Apple Developer account
- Bundle ID: com.smartfitcoach.app (already set)
- Version: 1.0.0 / Build: 1

---

## Step 2 — Update App Store Connect

1. Go to appstoreconnect.apple.com
2. Create new App → iOS
3. Fill in from `metadata.json`:
   - Name, Bundle ID, SKU
   - Primary/secondary categories
   - Age rating (4+)

---

## Step 3 — Screenshots (REQUIRED before submission)

Run the app in Xcode Simulator for these devices:
- iPhone 16 Pro Max (6.9") — 1320×2868px
- iPhone 14 Plus (6.5") — 1284×2778px

Capture 5 screens each (use Cmd+S in Simulator):
1. Today dashboard (nutrition + workout)
2. Nutrition plan generation
3. Sport program
4. AI coach conversation
5. Progress history / gamification

---

## Step 4 — Privacy Manifest (already done ✓)

`ios/App/App/PrivacyInfo.xcprivacy` is already configured.

---

## Step 5 — Fill in remaining placeholders

Before submitting, update these files:
- `app/privacy-policy.html` line 28: add company address
- `app/privacy-policy-en.html` line 35: add company address
- `app/cgu.html` line 91: add company address
- `app/cgu-en.html` line 97: add company address
- `app-store/metadata.json`: fill teamId, appleId, review demo password

---

## Step 6 — Archive & Upload

In Xcode:
1. Product → Archive
2. Distribute App → App Store Connect → Upload
3. Wait for processing (~15 minutes)

---

## Step 7 — Submit for Review

In App Store Connect:
- Add build to version
- Paste description from `metadata.json` (FR + EN)
- Upload screenshots
- Add privacy policy URL
- Fill review notes and demo account
- Submit for review (typically 24-48h)

---

## Known review risks & how to handle them

| Risk | Mitigation |
|------|-----------|
| Guideline 5.1.1 (medical data) | Medical disclaimer shown in app + in CGU |
| Age rating for health content | Set to 4+ with "Frequent Medical Info" flag |
| Demo account needed | Use review@smartfitcoach.com |
| Capacitor/WebView app | Note in review notes that it's a legitimate PWA+Capacitor hybrid |
| Privacy policy missing | Already deployed at netlify URL |

---

## What's already done ✓

- [x] `@capacitor/ios` installed and iOS project generated
- [x] `ios/` folder with Xcode project structure
- [x] App icon 1024×1024 (RGB, no alpha)
- [x] Splash screens 2732×2732 (×3)
- [x] `Info.plist` with all privacy usage descriptions
- [x] `PrivacyInfo.xcprivacy` (required since May 2024)
- [x] `capacitor.config.json` updated with iOS config
- [x] Privacy Policy FR + EN deployed
- [x] CGU FR + EN deployed
- [x] App Store metadata prepared (`metadata.json`)
