ARG GROUNDCONTROL_TAG

FROM ${GROUNDCONTROL_TAG} AS groundcontrol

FROM oven/bun:1 AS build
# TODO: do the song and dance that i need to to copy over just the
# package files and lockfiles and the workspace crap so it caches the package
# part of it
WORKDIR /app
COPY . /app
RUN bun install --frozen-lockfile

FROM build AS api
WORKDIR /app/packages/api/
RUN bun run build

FROM build AS webapp
WORKDIR /app/packages/webapp/
RUN bun run build

FROM bitnami/minideb:latest AS release
WORKDIR /app
RUN install_packages ca-certificates debian-keyring debian-archive-keyring gnupg apt-transport-https curl \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list \
    && install_packages caddy
COPY --from=groundcontrol /groundcontrol ./groundcontrol
COPY --from=build /app/packages/deploy/docker/groundcontrol.toml ./groundcontrol.toml
COPY --from=webapp /app/packages/deploy/docker/Caddyfile ./Caddyfile
COPY --from=api /app/packages/api/dist/atsugami-api ./atsugami-api
COPY --from=webapp /app/packages/webapp/dist ./webapp

# web server, all-in-one
EXPOSE 55600/tcp
# just the API server, if you want to do the work yourself
EXPOSE 55601/tcp

ENTRYPOINT ["/app/groundcontrol"]
CMD ["/app/groundcontrol.toml"]
