# Android APK releases

Replit does not currently build Android APKs for Expo projects. This repository
is prepared for an APK release build on a machine or CI runner with the Android
SDK installed; it does not contain a signed APK or a release signing key.

## Stable identity and data

- Android application ID: `com.dongtien.moneyflow`. Keep it unchanged after
  distributing the first APK.
- The finance store remains at `@dong-tien/finance-v1`. Do not rename this key
  or clear app storage as part of an upgrade.
- Increment both `expo.version` and `expo.android.versionCode` in `app.json`
  for each release. `versionCode` must always increase.
- Every release must use the same Android signing certificate. Keep the
  keystore and its passwords in a secure secret manager; never commit them.
- Users must install the new APK over the existing app. Uninstalling the app
  or clearing its storage removes locally saved finance data.

The app now stops before opening finance screens or writing an empty dataset if
it cannot read saved data. It offers a retry instead, so a read/parse failure
does not silently replace the user's stored data.

## Build a signed APK outside Replit

1. Install the repository's dependencies with `pnpm install --frozen-lockfile`.
2. From the repository root, generate the native Android project:

   ```sh
   pnpm --filter @workspace/money-flow-mobile exec expo prebuild --platform android
   ```

3. Open `artifacts/money-flow-mobile/android` in Android Studio, then use
   **Build > Generate Signed Bundle / APK > APK**. Create the keystore once and
   securely back it up. Use that same keystore for every future APK.
4. Install the signed APK on a test device over the existing installation
   before distributing it. Confirm its finance data is still present.

The generated `android/` directory is ignored by Git. Keep the source of truth
in `app.json`; regenerate the native project after changing Expo config.

## Configure online APK checks

The Android Settings screen checks a public HTTPS JSON manifest. Set
`EXPO_PUBLIC_ANDROID_RELEASE_MANIFEST_URL` at build time to its stable URL. The
manifest and APK can be hosted on any HTTPS service that permits public reads.
The manifest format is:

```json
{
  "packageName": "com.dongtien.moneyflow",
  "version": "1.0.1",
  "versionCode": 2,
  "apkUrl": "https://downloads.example.com/dong-tien-1.0.1.apk",
  "releaseNotes": "Cải thiện độ ổn định."
}
```

Publish the APK first, then update the manifest to point to it. The app checks
that the manifest is HTTPS, matches this application ID, and advertises a higher
`versionCode` before opening the download link. Android handles installation and
requires the user to confirm it; if prompted, they must allow APK installation
from the browser they used to download it.

Until a public manifest URL and signed APK are hosted and configured at build
time, the update button will report that updates are not configured.
