import { createHash, createHmac } from "crypto";

type CosMethod = "GET" | "PUT";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is missing.`);
  return value;
}

function sha1(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

function hmacSha1(key: string, value: string) {
  return createHmac("sha1", key).update(value).digest("hex");
}

function encodeObjectKey(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`))
    .join("/");
}

export function createCosPresignedUrl(method: CosMethod, objectKey: string, expiresInSeconds: number) {
  const secretId = requiredEnv("TENCENT_COS_SECRET_ID");
  const secretKey = requiredEnv("TENCENT_COS_SECRET_KEY");
  const bucket = requiredEnv("TENCENT_COS_BUCKET");
  const region = requiredEnv("TENCENT_COS_REGION");
  const host = `${bucket}.cos.${region}.myqcloud.com`;
  const path = `/${encodeObjectKey(objectKey)}`;
  const now = Math.floor(Date.now() / 1000) - 5;
  const keyTime = `${now};${now + expiresInSeconds}`;
  const headerList = "host";
  const httpString = `${method.toLowerCase()}\n${path}\n\nhost=${host}\n`;
  const stringToSign = `sha1\n${keyTime}\n${sha1(httpString)}\n`;
  const signKey = hmacSha1(secretKey, keyTime);
  const signature = hmacSha1(signKey, stringToSign);

  const query = new URLSearchParams({
    "q-sign-algorithm": "sha1",
    "q-ak": secretId,
    "q-sign-time": keyTime,
    "q-key-time": keyTime,
    "q-header-list": headerList,
    "q-url-param-list": "",
    "q-signature": signature
  });

  return `https://${host}${path}?${query.toString()}`;
}

export function cosIsConfigured() {
  return Boolean(
    process.env.TENCENT_COS_SECRET_ID &&
    process.env.TENCENT_COS_SECRET_KEY &&
    process.env.TENCENT_COS_BUCKET &&
    process.env.TENCENT_COS_REGION
  );
}

