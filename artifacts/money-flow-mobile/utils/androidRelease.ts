import Constants from "expo-constants";

const ANDROID_PACKAGE_NAME = "com.dongtien.moneyflow";
const DEFAULT_MANIFEST_URL =
  "https://github.com/nguyenchaulong208/CashFlow/releases/latest/download/latest.json";

export interface AndroidReleaseManifest {
  packageName: string;
  version: string;
  versionCode: number;
  apkUrl: string;
  releaseNotes?: string;
}

export type AndroidReleaseCheck =
  | { status: "current" }
  | { status: "available"; release: AndroidReleaseManifest };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function checkAndroidRelease(): Promise<AndroidReleaseCheck> {
  const manifestUrl =
    process.env.EXPO_PUBLIC_ANDROID_RELEASE_MANIFEST_URL?.trim() ||
    DEFAULT_MANIFEST_URL;
  if (!isHttpsUrl(manifestUrl)) {
    throw new Error("Địa chỉ manifest phải dùng HTTPS.");
  }

  const response = await fetch(manifestUrl, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Máy chủ cập nhật trả về lỗi ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error("Thông tin bản cập nhật không hợp lệ.");
  }

  const { packageName, version, versionCode, apkUrl, releaseNotes } = payload;
  if (
    packageName !== ANDROID_PACKAGE_NAME ||
    typeof version !== "string" ||
    version.length > 32 ||
    !Number.isSafeInteger(versionCode) ||
    (versionCode as number) < 1 ||
    !isHttpsUrl(apkUrl) ||
    (releaseNotes !== undefined &&
      (typeof releaseNotes !== "string" || releaseNotes.length > 1000))
  ) {
    throw new Error("Manifest không hợp lệ hoặc không dành cho ứng dụng này.");
  }

  const installedVersionCode = Constants.expoConfig?.android?.versionCode ?? 1;
  if ((versionCode as number) <= installedVersionCode) {
    return { status: "current" };
  }

  return {
    status: "available",
    release: {
      packageName,
      version,
      versionCode: versionCode as number,
      apkUrl,
      ...(typeof releaseNotes === "string" ? { releaseNotes } : {}),
    },
  };
}
