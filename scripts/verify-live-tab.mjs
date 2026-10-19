/**
 * Live acceptance for the isolated-preview surfaces.
 *
 * A clean unit run proves the bundle is consistent with its own stubs; it says
 * nothing about whether the *running* host mounts the plugin. This drives the
 * real DSH Web GUI: it opens a conversation, asserts the "网页预览" view tab is
 * contributed, clicks it, and requires this plugin's own `[data-webview-ui]`
 * root to mount with no slot crash on the console.
 *
 * Usage:
 *   node scripts/verify-live-tab.mjs --url http://127.0.0.1:3080/?token=<token>
 *   node scripts/verify-live-tab.mjs --url <url> --session "<history entry text>"
 *   node scripts/verify-live-tab.mjs --url <url> --keep     # leave the browser open
 *
 * Requires a reachable DSH Web instance and an installed playwright Chromium.
 * The token is printed by the launcher (`dsh web`) as part of the URL.
 */
import { chromium } from 'playwright'

const args = process.argv.slice(2)

/** Read one `--name value` flag. */
function flag(name, fallback) {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback
}

const baseUrl = flag('url', 'http://127.0.0.1:3080/')
// A conversation must be opened for the conversation.view slot to render; any
// existing history entry works. Pass --session when the default does not exist.
const sessionText = flag('session', '预览 domainValueFilter 页面')
const keep = args.includes('--keep')

const browser = await chromium.launch({ headless: !keep })
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

const errors = []
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('pageerror', error => errors.push(`pageerror: ${String(error)}`))

/** Read what the plugin contributes from the live DOM. */
async function probe(stage) {
  const state = await page.evaluate(() => ({
    webviewRoots: document.querySelectorAll('[data-webview-ui]').length,
    tabs: [...document.querySelectorAll('[role="tablist"] [role="tab"], [role="tablist"] button')]
      .map(node => (node.textContent ?? '').trim()).filter(Boolean).slice(0, 12),
  }))
  console.log(`[${stage}] roots=${state.webviewRoots} tabs=${JSON.stringify(state.tabs)}`)
  return state
}

let exitCode = 0
try {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 })
  await page.waitForTimeout(1500)

  const entry = page.getByText(sessionText, { exact: false }).first()
  if (await entry.count() === 0) {
    console.error(`verify-live-tab: no history entry matches "${sessionText}"; pass --session`)
    process.exit(1)
  }
  await entry.click().catch(() => undefined)
  await page.waitForTimeout(2500)
  await probe('conversation opened')

  const tab = page.getByRole('tab', { name: /网页预览|Web Preview/ }).first()
  if (await tab.count() === 0) {
    console.error('verify-live-tab: the plugin did not contribute its conversation.view tab')
    exitCode = 1
  } else {
    await tab.click().catch(() => undefined)
    await page.waitForTimeout(2000)
    const opened = await probe('preview tab opened')
    if (opened.webviewRoots === 0) {
      console.error('verify-live-tab: the tab exists but the preview surface did not mount')
      exitCode = 1
    }
  }

  // A slot crash and a fiber that never activated are the two failure modes
  // this check exists to catch; both surface as console errors.
  const fatal = errors.filter(text => /slot entry crashed|React #130|did not activate|import failed/i.test(text))
  for (const text of fatal.slice(0, 3)) console.error(`  ! ${text.split('\n')[0]}`)
  console.log(`console errors: ${errors.length} (fatal: ${fatal.length})`)
  if (fatal.length > 0) exitCode = 1
} catch (error) {
  console.error(`verify-live-tab: ${error instanceof Error ? error.message : String(error)}`)
  exitCode = 1
} finally {
  if (!keep) await browser.close()
}

process.exit(exitCode)
