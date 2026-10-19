/**
 * Build this checkout and reinstall it into a DSH profile as a local `file:`
 * dependency.
 *
 * `dsh plugin --profile <name> add <spec>` is the only supported mount path: it
 * forwards the install to pnpm *and* appends the package to
 * `dsh.profile.bundles` when the manifest declares `dsh.bundle`. A plain
 * `pnpm add` would install files without mounting the layer.
 *
 * Usage:
 *   tsx scripts/install-dsh.ts [profile] [--no-build]
 * Env: DSH_HOME (default `~/.dsh`), DSH_BIN (default: resolve `dsh` on PATH).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const staged = join(root, 'dist', 'package')
const args = process.argv.slice(2)
const skipBuild = args.includes('--no-build')
const profile = args.find(argument => !argument.startsWith('-')) ?? 'web'
const dshHome = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')

/** Fail with an actionable message instead of a stack trace. */
function fail(message: string): never {
  console.error(`install:dsh: ${message}`)
  process.exit(1)
}

/** Run one command in this checkout and fail on a non-zero status. */
function run(command: string, commandArgs: readonly string[], cwd = root): void {
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) fail(`"${command} ${commandArgs.join(' ')}" failed (status ${String(result.status)})`)
}

if (!skipBuild) run('pnpm', ['run', 'package:official'])
if (!existsSync(join(staged, 'package.json'))) fail(`no built package at ${staged}; drop --no-build`)

const manifest = JSON.parse(readFileSync(join(staged, 'package.json'), 'utf8')) as {
  name?: string
  version?: string
  dsh?: { bundle?: unknown }
}
const name = manifest.name
if (name === undefined) fail(`the staged manifest at ${staged} declares no name`)
if (manifest.dsh?.bundle === undefined) {
  fail(`${name} declares no dsh.bundle, so DSH would install it as a plain dependency instead of a profile layer`)
}

// `file:` keeps the spec anchored to this checkout instead of a registry copy.
const spec = `file:${resolve(staged).replaceAll('\\', '/')}`
const dsh = process.env.DSH_BIN?.trim() || 'dsh'
console.log(`install:dsh: ${name}@${manifest.version ?? 'unknown'} -> profile "${profile}" (DSH_HOME=${dshHome})`)

const installed = spawnSync(
  dsh,
  ['plugin', '--profile', profile, 'add', spec],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, DSH_HOME: dshHome } },
)
if (installed.error !== undefined) fail(`cannot run "${dsh}": ${installed.error.message}`)
if (installed.status !== 0) {
  fail(
    `install failed (status ${String(installed.status)}). If the message names the profile manifest `
    + '(Windows: "拒绝访问" / os error 5), a running DSH Web holds it: stop the service, rerun, then start it again.',
  )
}

// Prove the mount happened rather than trusting the exit status.
const profileManifest = join(dshHome, 'profiles', profile, 'package.json')
const mounted = JSON.parse(readFileSync(profileManifest, 'utf8')) as {
  dependencies?: Record<string, string>
  dsh?: { profile?: { bundles?: string[] } }
}
if (mounted.dependencies?.[name] === undefined) fail(`${name} is missing from ${profileManifest} dependencies`)
if (!mounted.dsh?.profile?.bundles?.includes(name)) fail(`${name} is missing from the ${profile} profile bundles`)
console.log(`install:dsh: mounted ${name} in the ${profile} profile; restart DSH Web to load it`)
