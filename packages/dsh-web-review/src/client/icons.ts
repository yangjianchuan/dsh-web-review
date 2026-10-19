/**
 * Icon access across the two DSH primitive lines this plugin has to run on.
 *
 * The reviewed rc.8 baseline exports size-suffixed names (`IconCheckOutline16`,
 * `IconChevronDownOutline14`); the 0.2.x runtime line replaced those with
 * `IconXxxOutlineRegular`. Both name the same semantic icon, and the host
 * provides exactly one set through the shared module table, so the package
 * resolves whichever set the running host actually exports instead of pinning
 * one. The legacy name is exported here because it also records the glyph size
 * the call site was designed against; the wrapper keeps that default when the
 * caller does not pass `size`.
 *
 * A missing pair degrades to an empty placeholder rather than an undefined
 * component: an undefined JSX type crashes the whole slot (React #130), which
 * is far worse than a missing glyph.
 */
import { createElement, type ComponentType, type SVGProps } from 'react'
import * as primitives from '@deepseek-ai/dsh-client-ui-primitives'

/** Props every icon in this module accepts. */
export type IconProperties = SVGProps<SVGSVGElement> & { size?: number }

/** One resolved icon component. */
export type IconComponent = ComponentType<IconProperties>

const primitiveExports = primitives as unknown as Readonly<Record<string, IconComponent | undefined>>

/**
 * Read one export without assuming the host namespace tolerates a missing key.
 * Module namespaces are merge-extensible records in the loader, but an ESM
 * namespace proxy can throw on an unknown name instead of answering
 * `undefined`, so absence is detected rather than relied on.
 * @param name - export name to look up.
 * @returns the component when the host really exports it.
 */
function exportedIcon(name: string): IconComponent | undefined {
  try {
    return Object.hasOwn(primitiveExports, name) ? primitiveExports[name] : undefined
  } catch {
    return undefined
  }
}

/** Placeholder that keeps layout stable when a host exports neither name. */
function placeholderIcon(defaultSize: number): IconComponent {
  return function MissingIcon({ size = defaultSize, ...rest }: IconProperties) {
    return createElement('svg', { ...rest, width: size, height: size, 'aria-hidden': true })
  }
}

/**
 * Resolve one icon against the host's export table.
 * @param regular - name used by the 0.2.x line.
 * @param legacy - name used by the rc.8 baseline.
 * @param defaultSize - glyph size the call sites were designed against.
 * @returns a component that always renders something.
 */
function resolveIcon(regular: string, legacy: string, defaultSize: number): IconComponent {
  const icon = exportedIcon(regular) ?? exportedIcon(legacy) ?? placeholderIcon(defaultSize)
  return function ResolvedIcon({ size = defaultSize, ...rest }: IconProperties) {
    return createElement(icon, { size, ...rest })
  }
}

export const IconCheckOutline16 = resolveIcon('IconCheckOutlineRegular', 'IconCheckOutline16', 16)
export const IconChevronDownOutline14 = resolveIcon('IconChevronDownOutlineRegular', 'IconChevronDownOutline14', 14)
export const IconChevronLeftOutline14 = resolveIcon('IconChevronLeftOutlineRegular', 'IconChevronLeftOutline14', 14)
export const IconChevronRightOutline14 = resolveIcon('IconChevronRightOutlineRegular', 'IconChevronRightOutline14', 14)
export const IconCloseOutline16 = resolveIcon('IconCloseOutlineRegular', 'IconCloseOutline16', 16)
export const IconLinkOutline14 = resolveIcon('IconLinkOutlineRegular', 'IconLinkOutline14', 14)
export const IconLoadingOutline16 = resolveIcon('IconLoadingOutlineRegular', 'IconLoadingOutline16', 16)
export const IconNewChatOutline16 = resolveIcon('IconNewChatOutlineRegular', 'IconNewChatOutline16', 16)
export const IconQueueOutline14 = resolveIcon('IconQueueOutlineRegular', 'IconQueueOutline14', 14)
export const IconRefreshOutline14 = resolveIcon('IconRefreshOutlineRegular', 'IconRefreshOutline14', 14)
export const IconRefreshOutline16 = resolveIcon('IconRefreshOutlineRegular', 'IconRefreshOutline16', 16)
export const IconRightUpOutline16 = resolveIcon('IconRightUpOutlineRegular', 'IconRightUpOutline16', 16)
export const IconSendOutline16 = resolveIcon('IconSendOutlineRegular', 'IconSendOutline16', 16)
export const IconTrashOutline16 = resolveIcon('IconTrashOutlineRegular', 'IconTrashOutline16', 16)
export const IconWarningOutline16 = resolveIcon('IconWarningOutlineRegular', 'IconWarningOutline16', 16)
