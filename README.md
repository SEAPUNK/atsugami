# atsugami

a booru viewer

https://github.com/SEAPUNK/atsugami/assets/4400726/33b3f1c8-23b2-4072-8b80-7955bfcbec16


## install

(so far,) the easiest way to run it locally is to use docker:

```sh
docker run \
  -e PROXY_SECRET=$(openssl rand -hex 32) \
  -p 55600:55600 \
  --name atsugami \
  ghcr.io/seapunk/atsugami:latest
```

this will start atsugami and have a web server running on port 55600
