export const PROXY_SECRET = process.env.PROXY_SECRET!;
if (PROXY_SECRET == null || PROXY_SECRET.length !== 64) {
  throw new Error(
    "Invalid PROXY_SECRET! See .env file on how to generate one.",
  );
}
