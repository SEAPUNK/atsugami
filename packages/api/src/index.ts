import "./constants";
import { Elysia } from "elysia";
import assert from "node:assert";
import { basename } from "node:path";
import {
  PostsListRequest,
  PostsGetParams,
  ProxyParams,
  ProxyQuery,
} from "@atsugami/common/types";
import * as SafebooruOrg from "./adapters/safebooru.org";
import { decryptUrl } from "./proxy";

// TODO: move off of elysia onto something that actually tries to be correct
// https://github.com/elysiajs/elysia/issues/630
const noop = (...args: unknown[]): void => {};

const SelectedAdapter = SafebooruOrg;
const hostname = "127.0.0.1";
const port = 55601;
const app = new Elysia();

app.post("/posts/list", async (ctx) => {
  // opt out of elysia's broken perf optimizations
  noop(ctx);

  const postsListRequest = PostsListRequest.parse(ctx.body);
  return await SelectedAdapter.postsList(postsListRequest);
});

app.get("/posts/get/:id", async (ctx) => {
  // opt out of elysia's broken perf optimizations
  noop(ctx);

  const params = PostsGetParams.parse(ctx.params);
  return await SelectedAdapter.postsGet(params);
});

app.get("/proxy/:encodedUrl/:encodedIv", async (ctx) => {
  // opt out of elysia's broken perf optimizations
  noop(ctx);

  const proxyParams = ProxyParams.parse(ctx.params);
  const proxyQuery = ProxyQuery.parse(ctx.query);
  let url;
  try {
    url = new URL(decryptUrl(proxyParams.encodedUrl, proxyParams.encodedIv));
  } catch (err) {
    throw new Error("Error decrypting URL");
  }
  const save = proxyQuery.save != null;

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

  const dispositionFilename = basename(url.pathname).replace(/"/g, "");
  if (save) {
    ctx.set.headers["content-type"] = "application/octet-stream";
    ctx.set.headers["content-disposition"] =
      `attachment; filename="${dispositionFilename}"`;
  } else {
    ctx.set.headers["content-disposition"] =
      `inline; filename="${dispositionFilename}"`;
  }

  ctx.set.status = res.status;

  // i cannot return ReadableStream directly because elysia in its infinite
  // wisdom overrides the content-type to text/event-stream
  return new Response(res.body, {
    headers: ctx.set.headers,
    status: ctx.set.status,
    // HACK: because we're building the Response directly
    //       we're ignoring ctx.cookie, ctx.location,
    //       and not setting response.statusText
  });
});

app.listen({
  hostname,
  port,
});

assert.ok(app.server);
console.log(`Listening on ${app.server.hostname}:${app.server.port}`);
