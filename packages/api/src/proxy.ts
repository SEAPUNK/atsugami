import crypto from "node:crypto";
import basex from "base-x";
import { PROXY_SECRET } from "./constants";

const CUSTOM_BASE64_ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
const customBase64 = basex(CUSTOM_BASE64_ALPHABET);
const secret = Buffer.from(PROXY_SECRET, "hex");

export function fileProxyUrl(url: string, save: boolean = false): string {
  const [encodedUrl, encodedIv] = encryptUrl(url);
  const params = new URLSearchParams();
  let proxyUrl = `proxy/${encodedUrl}/${encodedIv}`;
  if (save) {
    params.set("save", "1");
  }
  return `${proxyUrl}?${params.toString()}`;
}

export function encryptUrl(url: string): [string, string] {
  const iv = crypto.randomBytes(16);
  const encodedIv = customBase64.encode(iv);
  const cipher = crypto.createCipheriv("aes-256-cbc", secret, iv);
  const encodedUrl = customBase64.encode(
    Buffer.concat([cipher.update(url, "utf8"), cipher.final()]),
  );
  return [encodedUrl, encodedIv];
}

export function decryptUrl(encodedUrl: string, encodedIv: string): string {
  const iv = Buffer.from(customBase64.decode(encodedIv));
  const encryptedUrl = Buffer.from(customBase64.decode(encodedUrl));
  const decipher = crypto.createDecipheriv("aes-256-cbc", secret, iv);
  return [
    decipher.update(encryptedUrl, undefined, "utf8"),
    decipher.final("utf8"),
  ].join("");
}
