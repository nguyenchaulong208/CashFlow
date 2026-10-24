import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

function fail(message) {
  console.error(`Android release manifest: ${message}`);
  process.exit(1);
}

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const appConfigPath = join(
  workspaceRoot,
  "artifacts/money-flow-mobile/app.json",
);
const appConfig = JSON.parse(readFileSync(appConfigPath, "utf8")).expo;
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!eventPath) {
  fail(
    "GITHUB_EVENT_PATH is missing; run this script from a GitHub release event.",
  );
}

const event = JSON.parse(readFileSync(eventPath, "utf8"));
const release = event.release;
if (!release || release.draft || release.prerelease) {
  fail("only published, stable releases can update the public manifest.");
}

const expectedTag = `v${appConfig.version}`;
if (release.tag_name !== expectedTag) {
  fail(
    `tag ${release.tag_name} must match the app version tag ${expectedTag}.`,
  );
}

const apkAssets = (Array.isArray(release.assets) ? release.assets : []).filter(
  (asset) =>
    typeof asset?.name === "string" &&
    asset.name.toLowerCase().endsWith(".apk") &&
    typeof asset.browser_download_url === "string" &&
    asset.browser_download_url.startsWith("https://"),
);

if (apkAssets.length !== 1) {
  fail(
    `expected exactly one HTTPS APK asset on the release; found ${apkAssets.length}.`,
  );
}

const versionCode = appConfig.android?.versionCode;
const packageName = appConfig.android?.package;
if (!Number.isSafeInteger(versionCode) || versionCode < 1 || !packageName) {
  fail("Android package name or versionCode is missing from app.json.");
}

const releaseNotes =
  typeof release.body === "string" ? release.body.trim().slice(0, 1000) : "";
const manifest = {
  packageName,
  version: appConfig.version,
  versionCode,
  apkUrl: apkAssets[0].browser_download_url,
  ...(releaseNotes ? { releaseNotes } : {}),
};

const outputPath =
  process.env.ANDROID_RELEASE_MANIFEST_OUTPUT ||
  join(process.env.RUNNER_TEMP || tmpdir(), "android-release", "latest.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated Android update manifest at ${outputPath}`);
