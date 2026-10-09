# oxzoo-worker-bun

Deployed with [ox](https://deploywithox.com): deploy a repo to your own server with one command, no Docker. [Docs](https://deploywithox.com/docs) · [Guide for Bun](https://deploywithox.com/docs/guides/hono-bun)

An [ox](https://deploywithox.com) deploy example: a Bun + TypeScript background worker, deployed to your own Ubuntu server. There is no domain, no HTTP server, and no build step; the logs are the product. ox installs Bun, runs `worker.ts` directly under systemd, and restarts it if it exits.

## Stack

| Component | Version | Purpose |
|---|---|---|
| Runtime | Bun 1.3 (ox's default; mise installs it) | runs `worker.ts` directly, TypeScript with no compile step |
| Language | TypeScript (strict) | `@types/bun` is the only dependency, for editor types |

## ox.toml

```toml
# A Bun + TypeScript background worker: no web process, no domain.

[app]
enabled = false

[workers]
worker = "bun worker.ts"
```

`[app] enabled = false` says the project has no web process, so ox adds none and asks for no domain. ox detects `bun install --frozen-lockfile` from `bun.lock`.

## Environment flow

`worker.ts` reads `Bun.env.GREETING_TAG` once at startup, exits 1 if it is missing or empty, and puts the value in every line it prints. Changing it with `ox vars set` redeploys, and the next lines carry the new value.

## Deploy with ox

```sh
curl -fsSL https://deploywithox.com/install.sh | sh
ox login
ox new https://github.com/saurav-codes/oxzoo-worker-bun
printf 'GREETING_TAG=demo\n' | ox review oxzoo-worker-bun --from-file - --wait
```

The plan, offline:

```console
$ ox check .
ox check . (manifest: ox.toml)

  build.install              bun install --frozen-lockfile                        detected:bun.lock
  workers.worker             bun worker.ts                                        declared
  tools.bun                  1.3                                                  default

  Provided by ox: PORT, HOST, OX_ENV, OX_PROJECT, OX_RELEASE, OX_DATA_DIR
  Set on the dashboard before the first deploy: GREETING_TAG

Ready to deploy.
```

## Expected output

```sh
ox logs oxzoo-worker-bun --follow
```

shows `hello world oxzoo-worker-bun_<GREETING_TAG>` repeating.

## Local development

```sh
bun install
GREETING_TAG=dev bun worker.ts
```
