# oxzoo-worker-bun

An official ox deploy example: an internal Bun 1.3.14 worker written in strict TypeScript that prints one greeting line to stdout every 10 seconds, forever, deployed to a single Ubuntu VPS by the [ox](https://github.com/saurav-codes/ox) control plane from one `ox.toml` manifest at the repo root. There is no domain, no nginx routing, and no HTTP server: the process never listens on a socket. The journal IS the product. ox clones the repo into a git worktree, runs `npm install` as an unprivileged hook, and runs the worker as a systemd service with `Restart=always`; the only way to verify it is watching systemd's journal:

```bash
journalctl -u ox-oxzoo-worker-bun-worker.service
```

The `port = 9120` in the manifest exists only because ox requires a project port even for non-listening workers. Nothing binds it.

## Stack

| Component | Version | Purpose |
|---|---|---|
| Worker runtime | Bun 1.3.14 | executes `worker.ts` directly (TypeScript, no build step) and prints the greeting line |
| Language | TypeScript (strict) | source language; run by bun with no separate compiler in dependencies |
| Bootstrap | npm (NodeSource node 22.x) | installs bun as a local devDependency into `node_modules/.bin/bun` |
| Deploy | ox (`ox.toml`) | clones the repo, runs install hooks, generates the systemd unit with `Restart=always` |

**Why bun lives in `node_modules`:** ox install hooks run as the unprivileged project user, so nothing can be installed globally (no sudo, and Ubuntu ships no bun apt package). Instead `bun` is pinned as an exact local devDependency, `npm install` bootstraps it into `node_modules/.bin/bun`, and the systemd command runs the worker through it: `node_modules/.bin/bun worker.ts`. Node itself comes from the NodeSource apt repo (`required_packages = ["nodejs"]` with the matching `[[apt_sources]]` entry, because the distro `nodejs` package conflicts with NodeSource); npm is bundled with it, so the install hook needs nothing else. Exact pins in `package.json` keep installs deterministic.

## Environment flow

One variable, one path:

**`GREETING_TAG`** is runtime-only. `worker.ts` reads `Bun.env.GREETING_TAG` once at startup, fails loudly with a non-zero exit if it is missing or empty, and folds the value into every line it prints. ox injects it from `/etc/ox/apps/oxzoo-worker-bun.env` into the systemd unit's environment, so changing the value in the ox Environment editor and restarting the process is enough; no rebuild is involved because there is no build step.

`.env.example` documents the variable with a placeholder; real values live in the ox dashboard, never in git.

## Deploy with ox

1. Add the repo in the ox dashboard: paste the clone URL `https://github.com/saurav-codes/oxzoo-worker-bun`.
2. In the Environment editor, set `GREETING_TAG=w3-06`.
3. Press **Deploy**. ox runs `npm install` (bootstrapping `node_modules/.bin/bun`), then starts `node_modules/.bin/bun worker.ts` as a systemd unit with `Restart=always`. No domain is needed; skip the domain step entirely.

## Expected output

The unit name is `ox-<project>-<process>.service`: the project is `oxzoo-worker-bun` and the manifest declares one process named `worker`, so the unit is `ox-oxzoo-worker-bun-worker.service`.

```bash
journalctl -u ox-oxzoo-worker-bun-worker.service
```

shows the exact line

```
hello world oxzoo-worker-bun_w3-06
```

repeating every 10 seconds (printed once immediately at start, then on a 10-second interval). Because `restart_policy = "always"`, systemd also restarts the worker whenever it exits; a missing or empty `GREETING_TAG` is a deliberate crash loop with a clear stderr message on every attempt.

## Local development

```bash
npm install                  # installs bun 1.3.14 into node_modules/.bin
GREETING_TAG=dev npm start   # prints: hello world oxzoo-worker-bun_dev
```

Pass env inline per the commands above; never commit a real `.env`.
