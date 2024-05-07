/*
  DO NOT EDIT THIS FILE!!!

  This is a sample config used for development, and running
  atsugami locally. When deploying atsugami, you must
  pass these down as environment variables, either directly
  (e.g. `SOME=envvar bun start`), or with a dotenv file.
*/

/*
  random secret for proxy encryption
  this serves a dual purpose:
  - obfuscating the URL to booru (if you want to copy image URL from atsugami)
  - ensuring that the proxy only proxies paths that we generate

  generate new secret with `openssl rand -hex 32`
*/
process.env.PROXY_SECRET = process.env.PROXY_SECRET ?? "a".repeat(64);

console.warn(`
!!!
WARNING

You're running atsugami in development mode. Do not deploy this
to the internet!

See config.dev.js for mode details.
!!!
`);
