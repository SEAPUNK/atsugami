import { Elysia } from "elysia";
import assert from "node:assert";

const hostname = "127.0.0.1";
const port = 55601;
const app = new Elysia();

app.get("/hello", async () => {
  return "world";
});

app.listen({
  hostname,
  port,
});

assert.ok(app.server);
console.log(`Listening on ${app.server.hostname}:${app.server.port}`);
