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

## Publish APKs through this GitHub repository

The app checks this stable public manifest URL by default:

`https://github.com/nguyenchaulong208/CashFlow/releases/latest/download/latest.json`

To host updates elsewhere, override it with
`EXPO_PUBLIC_ANDROID_RELEASE_MANIFEST_URL` at build time.

To publish a release:

1. Update `expo.version` and increase `expo.android.versionCode` in `app.json`.
2. Build and sign the APK outside Replit with the same keystore used for all
   previous releases.
3. In GitHub, create a **stable** Release whose tag matches the app version,
   such as `v1.0.1`. Attach exactly one signed `.apk` file before publishing it.
4. Publish the Release. The workflow
   `.github/workflows/publish-android-release-manifest.yml` creates and attaches
   `latest.json` automatically. It reads the package name, version and
   `versionCode` from `app.json`, and the APK download URL and release notes
   from the GitHub Release.

The generated manifest has this format:

```json
{
  "packageName": "com.dongtien.moneyflow",
  "version": "1.0.1",
  "versionCode": 2,
  "apkUrl": "https://github.com/nguyenchaulong208/CashFlow/releases/download/v1.0.1/dong-tien-1.0.1.apk",
  "releaseNotes": "Cải thiện độ ổn định."
}
```

The manifest URL starts working after the first stable Release publishes and the
workflow attaches `latest.json`. The app checks that the manifest is HTTPS,
matches this application ID, and advertises a higher `versionCode` before
opening the APK download link. Android handles installation and requires the
user to confirm it; if prompted, they must allow APK installation from the
browser they used to download it.

The GitHub repository and its Releases must remain public so installed apps can
download the manifest and APK without signing in.
