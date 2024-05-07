import "./constants";
import { Elysia } from "elysia";
import assert from "node:assert";
import { basename } from "node:path";
import { PostsListRequest, PostsGetParams, ProxyParams } from "./types";
import * as SafebooruOrg from "./adapters/safebooru.org";
import { decryptUrl } from "./proxy";

const SelectedAdapter = SafebooruOrg;
const hostname = "127.0.0.1";
const port = 55601;
const app = new Elysia();

app.post("/posts/list", async (ctx) => {
  const postsListRequest = PostsListRequest.parse(ctx.body);
  return await SelectedAdapter.postsList(postsListRequest);
});

app.get("/posts/get/:id", async (ctx) => {
  const params = PostsGetParams.parse(ctx.params);
  return await SelectedAdapter.postsGet(params);
});

app.get("/proxy/:encodedUrl/:encodedIv", async (ctx) => {
  const proxyParams = ProxyParams.parse(ctx.params);
  let url;
  try {
    url = decryptUrl(proxyParams.encodedUrl, proxyParams.encodedIv);
  } catch (err) {
    throw new Error("Error decrypting URL");
  }
  const save = proxyParams.save != null;

  const headers = new Headers();
  let headersToCopy = ["range", "accept", "accept-language"];
  for (let headerName of headersToCopy) {
    const headerValue = ctx.request.headers.get(headerName);
    if (headerValue != null) {
      headers.set(headerName, headerValue);
    }
  }

  const res = await fetch(url, { headers });
  for (const [k, v] of res.headers.entries()) {
    ctx.set.headers[k] = v;
  }

  const dispositionFilename = basename(url).replace(/"/g, "");
  if (save) {
    ctx.set.headers["content-type"] = "application/octet-stream";
    ctx.set.headers["content-disposition"] =
      `attachment; filename="${dispositionFilename}"`;
  } else {
    ctx.set.headers["content-disposition"] =
      `inline; filename="${dispositionFilename}"`;
  }

  ctx.set.status = res.status;

  return res.body;
});

app.listen({
  hostname,
  port,
});

assert.ok(app.server);
console.log(`Listening on ${app.server.hostname}:${app.server.port}`);
