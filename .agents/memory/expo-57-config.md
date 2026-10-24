---
name: Expo SDK 57 config
description: Compatibility note for splash-screen configuration in the current Expo SDK.
---

For this project on Expo SDK 57, configure the splash screen through the `expo-splash-screen` config plugin instead of the legacy top-level `expo.splash` property.

**Why:** Expo Doctor rejects the legacy property under this SDK's app config schema.

**How to apply:** If changing the splash screen, edit the static `app.json` plugin options and rerun Expo Doctor.
