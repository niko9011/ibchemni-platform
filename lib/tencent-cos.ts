import COS from "cos-nodejs-sdk-v5";

type CosMethod = "GET" | "PUT";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is missing.`);
  return value;
}

export function createCosPresignedUrl(method: CosMethod, objectKey: string, expiresInSeconds: number) {
  const secretId = requiredEnv("TENCENT_COS_SECRET_ID");
  const secretKey = requiredEnv("TENCENT_COS_SECRET_KEY");
  const bucket = requiredEnv("TENCENT_COS_BUCKET");
  const region = requiredEnv("TENCENT_COS_REGION");
  const cos = new COS({ SecretId: secretId, SecretKey: secretKey });

  return cos.getObjectUrl({
    Bucket: bucket,
    Region: region,
    Key: objectKey,
    Method: method,
    Sign: true,
    Protocol: "https:",
    Expires: expiresInSeconds
  });
}

export function cosIsConfigured() {
  return Boolean(
    process.env.TENCENT_COS_SECRET_ID &&
    process.env.TENCENT_COS_SECRET_KEY &&
    process.env.TENCENT_COS_BUCKET &&
    process.env.TENCENT_COS_REGION
  );
}
