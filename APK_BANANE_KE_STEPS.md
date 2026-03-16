# 🚀 Mantra Meter — APK Banane ke Steps

## Pehle Ye Tools Hone Chahiye
- ✅ Node.js (v18+) — nodejs.org se download karein
- ✅ Android Studio — aapke paas already hai
- ✅ VS Code — aapke paas already hai
- ✅ JDK 17 — Android Studio ke saath aata hai

---

## Step 1: Project Folder Open Karo (VS Code)

1. VS Code mein **File → Open Folder** click karo
2. Is folder ko select karo (jahan ye file hai)
3. Top menu → **Terminal → New Terminal**

---

## Step 2: Dependencies Install Karo

Terminal mein ye command chalao:
```
npm install
```
Ye 2-3 minute lagega. Wait karo.

---

## Step 3: Capacitor Android Setup Karo

```
npx cap add android
```

---

## Step 4: Build + Sync Karo

```
npm run build
npx cap sync android
```

---

## Step 5: Android Studio mein Open Karo

```
npx cap open android
```

Android Studio khul jayega.

---

## Step 6: Firebase Setup (ZAROORI — Google Login ke liye)

1. https://console.firebase.google.com par jao
2. Apna **mantra-meter** project open karo
3. Left menu → **Project Settings** (gear icon)
4. **"Add app"** → Android icon click karo
5. Package name mein: `com.mantrameter.app`
6. App nickname: `Mantra Meter`
7. **Register app** click karo
8. **google-services.json** download karo
9. Is file ko `android/app/` folder mein paste karo

---

## Step 7: Notification Icon banana (ZAROORI)

Android notification icon white PNG hona chahiye:

1. https://romannurik.github.io/AndroidAssetStudio/icons-notification.html par jao
2. Apna icon upload karo (icon-192.png use karo)
3. Download karo
4. Files ko `android/app/src/main/res/` mein paste karo:
   - `drawable/ic_notification.png`
   - `drawable-hdpi/ic_notification.png`
   - `drawable-xhdpi/ic_notification.png`
   - `drawable-xxhdpi/ic_notification.png`

---

## Step 8: Debug APK Build Karo

Android Studio mein:
1. Wait karo jab tak Gradle sync complete ho (neeche loading bar dekhte raho)
2. **Build → Build APK(s)** click karo
3. APK ready hogi: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Ye file apne phone mein copy karo aur install karo

---

## Step 9: Release APK (Play Store ke liye)

Android Studio mein:
1. **Build → Generate Signed Bundle/APK**
2. **APK** select karo
3. **Create new keystore** click karo (pehli baar)
4. Details bharo aur save karo
5. Build karo
6. APK: `android/app/release/app-release.apk`

---

## ⚠️ Zaroori Notes

### Google Login Issue Ho To:
- Firebase Console → Authentication → Sign-in method → Google → Enable karo
- SHA-1 fingerprint add karo:
  ```
  cd android
  ./gradlew signingReport
  ```
  SHA-1 copy karo aur Firebase Console mein add karo

### Notifications Kaam Nahi Kar Rahi:
- Android 13+ par: First run par permission popup aayega — Allow karo
- Settings → Apps → Mantra Meter → Notifications → Enable karo

---

*Koi problem aaye to support se poochho! 🙏*
