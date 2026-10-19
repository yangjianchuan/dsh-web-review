/**
 * Locate the newest Browser Comments context in a host session transcript.
 *
 * The two DSH client lines publish the transcript differently: rc.8 exposes
 * `nodes` as an ordered array, while the 0.2.x line exposes a keyed collection
 * plus an `order` key sequence and its own components read `nodes.get(order[i])`.
 * This plugin runs on both, so the read is structural. It is also total — a
 * snapshot can carry no transcript at all (a session that has not opened yet) —
 * because an exception here runs inside a slot selector and takes the whole dock
 * entry down with it.
 */
import type { ConversationNode } from '@deepseek-ai/dsh-client-runtime/client'
import { annotationSnapshotIdOfSource } from '../annotation-contract.ts'

/**
 * Transcript collection shapes a host may publish. Both members are optional:
 * an unopened session provides neither, and that is a valid state.
 */
export type SessionTranscript = { readonly nodes?: readonly ConversationNode[] }
  | {
    readonly nodes?: { get: (key: string) => ConversationNode | undefined }
    readonly order?: readonly string[]
  }

/** Snapshot id carried by one node, when the node is this plugin's context. */
function annotationContextId(node: ConversationNode): ReturnType<typeof annotationSnapshotIdOfSource> {
  return node.kind === 'context' ? annotationSnapshotIdOfSource(node.source) : undefined
}

/** The transcript's nodes in reading order, or an empty list when unavailable. */
function transcriptOrder(session: SessionTranscript): readonly (ConversationNode | undefined)[] {
  const candidate = session as {
    readonly nodes?: readonly ConversationNode[] | { get: (key: string) => ConversationNode | undefined }
    readonly order?: readonly string[]
  }
  if (Array.isArray(candidate.nodes)) return candidate.nodes
  const { nodes, order } = candidate
  if (nodes === undefined || order === undefined) return []
  const keyed = nodes as { get: (key: string) => ConversationNode | undefined }
  return order.map(key => keyed.get(key))
}

/**
 * Newest annotation snapshot id in the loaded transcript.
 * @param session - the host session snapshot selector value.
 * @returns the newest id, or undefined when this window holds no such context.
 */
export function latestAnnotationContextIdOf(session: SessionTranscript): string | undefined {
  const ordered = transcriptOrder(session)
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const node = ordered[index]
    const id = node === undefined ? undefined : annotationContextId(node)
    if (id !== undefined) return id
  }
  return undefined
}
