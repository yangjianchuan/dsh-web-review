/**
 * The icon layer has to satisfy two hosts: the reviewed rc.8 primitive line
 * exports size-suffixed names, and the 0.2.x line exports `*OutlineRegular`.
 * These specs pin both resolution orders and the placeholder fallback, because
 * an undefined JSX type crashes the whole slot (React #130).
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Host stub that records which spelling produced the glyph and at what size. */
function stub(marker: string) {
  return function StubIcon({ size }: { size?: number }) {
    return createElement('i', { 'data-marker': marker, 'data-size': String(size) })
  }
}

/** Load the icon layer against one host export table. */
async function loadIcons(exports: Record<string, unknown>) {
  vi.doMock('@deepseek-ai/dsh-client-ui-primitives', () => exports)
  vi.resetModules()
  return import('../src/client/icons.ts')
}

afterEach(() => {
  vi.doUnmock('@deepseek-ai/dsh-client-ui-primitives')
  vi.resetModules()
})

describe('icon resolution across host primitive lines', () => {
  it('prefers the 0.2.x Regular export when the host provides it', async () => {
    const icons = await loadIcons({
      IconCheckOutlineRegular: stub('regular-check'),
      IconCheckOutline16: stub('legacy-check'),
    })
    const markup = renderToStaticMarkup(createElement(icons.IconCheckOutline16))
    expect(markup).toContain('data-marker="regular-check"')
  })

  it('falls back to the rc.8 size-suffixed export', async () => {
    const icons = await loadIcons({
      IconTrashOutline16: stub('legacy-trash'),
    })
    const markup = renderToStaticMarkup(createElement(icons.IconTrashOutline16))
    expect(markup).toContain('data-marker="legacy-trash"')
  })

  it('keeps the designed glyph size when the caller passes none, and honors an explicit size', async () => {
    const icons = await loadIcons({
      IconChevronDownOutlineRegular: stub('chevron'),
      IconTrashOutlineRegular: stub('trash'),
    })
    // Chevron call sites were designed at 14px, trash at 16px.
    expect(renderToStaticMarkup(createElement(icons.IconChevronDownOutline14)))
      .toContain('data-size="14"')
    expect(renderToStaticMarkup(createElement(icons.IconTrashOutline16)))
      .toContain('data-size="16"')
    expect(renderToStaticMarkup(createElement(icons.IconTrashOutline16, { size: 22 })))
      .toContain('data-size="22"')
  })

  it('still yields a renderable component when the host exports neither name', async () => {
    const icons = await loadIcons({})
    for (const component of [
      icons.IconCheckOutline16,
      icons.IconChevronDownOutline14,
      icons.IconChevronLeftOutline14,
      icons.IconChevronRightOutline14,
      icons.IconCloseOutline16,
      icons.IconLinkOutline14,
      icons.IconLoadingOutline16,
      icons.IconNewChatOutline16,
      icons.IconQueueOutline14,
      icons.IconRefreshOutline14,
      icons.IconRefreshOutline16,
      icons.IconRightUpOutline16,
      icons.IconSendOutline16,
      icons.IconTrashOutline16,
      icons.IconWarningOutline16,
    ]) {
      expect(renderToStaticMarkup(createElement(component))).toContain('<svg')
    }
  })
})
