# Reinstall this checkout into a DSH profile

The plugin is installed from the **built** package (`dist/package`), not from
`src/`. A `file:` dependency is copied into the profile's `node_modules`, so
editing source does not change the running app on its own.

## One command

```powershell
pnpm install:dsh            # build + reinstall into the web profile
pnpm install:dsh tui        # ...into another profile
pnpm install:dsh --no-build # reinstall the existing build as-is
```

The script stops nothing. Reinstalling rewrites the profile manifest, and a
running DSH Web holds that file, so stop the service first when the command
reports `Failed to save the manifest file` (Windows: `拒绝访问` / `os error 5`):

```powershell
& "$HOME\.dsh\start.ps1" -Action stop
pnpm install:dsh
& "$HOME\.dsh\start.ps1" -Action start
```

## Why the official entry, not `pnpm add`

`dsh plugin --profile <name> add <spec>` forwards to pnpm **and** rewrites the
profile manifest: it appends the package to `dsh.profile.bundles` only when the
manifest declares `dsh.bundle`, and it runs the exact-version compatibility
check against the running DSH. A bare `pnpm add` inside the profile directory
installs files but never mounts the plugin layer.

## Rules this script keeps

- The install spec is `file:`-anchored to this checkout's `dist/package`, so the
  profile never depends on a registry copy of the same name.
- `dist/package` is the staged, allowlisted artifact (`pnpm package:official`);
  it is not the repository root, whose manifest is `private: true`.
- `DSH_HOME` defaults to `~/.dsh` and can be overridden for an isolated profile.

## Verify the running instance

A clean unit run only proves the bundle agrees with its own stubs. To prove the
*running* host mounts it, drive the real GUI:

```powershell
# the launcher prints the tokenized URL in logs/dsh-web.log
node scripts/verify-live-tab.mjs --url "http://127.0.0.1:3080/?token=<token>"
```

It opens a conversation, requires the `网页预览` view tab, clicks it, and fails
if this plugin's `[data-webview-ui]` root does not mount or the console shows a
slot crash. Pass `--session "<history entry>"` when the default entry is absent.

## Client module contract

The browser half resolves host modules through the running web frontend's
platform table. Two specifiers matter and neither may be "fixed" back to the
other line:

| Specifier | 0.2.x | rc.8 |
| --- | --- | --- |
| `@deepseek-ai/dsh-client-store` (`defineStore`) | published | route through the `tsconfig.client.json` path mapping |
| `@deepseek-ai/dsh-client-ui-primitives` (icons) | `*OutlineRegular` only | size-suffixed names only |

The table throws for an unregistered specifier and that throw fails the whole
fiber, so a wrong name is a plugin that never activates — not a degraded panel.
Icons are resolved at runtime through `src/client/icons.ts`, which probes both
naming lines and degrades to a placeholder rather than an undefined component.
