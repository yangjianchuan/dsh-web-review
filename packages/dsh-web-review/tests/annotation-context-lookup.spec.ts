/**
 * Transcript-shape regression: the dock reads the newest annotation context
 * from either host collection shape.
 *
 * The 0.2.x line publishes `nodes` as a keyed collection with an `order` key
 * sequence; rc.8 publishes an ordered array. Reading the array unconditionally
 * crashed the dock on 0.2.x, so both arms — and the neither-present arm — are
 * pinned here.
 */
import { describe, expect, it } from 'vitest'
import {
  latestAnnotationContextIdOf,
} from '../src/client/annotation-context-lookup.ts'

/** One context node carrying a snapshot-id source. */
function contextNode(snapshotId: string) {
  return {
    kind: 'context' as const,
    source: { kind: 'plugin:dsh-web-review', snapshotId },
  }
}

/** One unrelated transcript node. */
function humanNode() {
  return { kind: 'user' as const, source: { kind: 'user' as const } }
}

type AnyNode = ReturnType<typeof contextNode> | ReturnType<typeof humanNode>

/** rc.8: an ordered array. */
function arraySession(nodes: readonly AnyNode[]) {
  return { nodes }
}

/** 0.2.x: a keyed collection plus its key order. */
function keyedSession(nodes: readonly AnyNode[]) {
  const keys = nodes.map((_, index) => `node-${index}`)
  const byKey = new Map(keys.map((key, index) => [key, nodes[index]]))
  return { order: keys, nodes: { get: (key: string) => byKey.get(key) } }
}

describe('latest annotation context across transcript shapes', () => {
  it('finds the newest context in the rc.8 array shape', () => {
    const session = arraySession([humanNode(), contextNode('a'), humanNode(), contextNode('b')])
    expect(latestAnnotationContextIdOf(session as never)).toBe('b')
  })

  it('finds the newest context in the 0.2.x keyed-collection shape', () => {
    const session = keyedSession([humanNode(), contextNode('a'), humanNode(), contextNode('b')])
    expect(latestAnnotationContextIdOf(session as never)).toBe('b')
  })

  it('returns undefined when the loaded window holds no annotation context', () => {
    expect(latestAnnotationContextIdOf(arraySession([humanNode()]) as never)).toBeUndefined()
    expect(latestAnnotationContextIdOf(keyedSession([humanNode()]) as never)).toBeUndefined()
  })

  it('returns undefined instead of throwing when a host exposes no transcript yet', () => {
    expect(latestAnnotationContextIdOf({} as never)).toBeUndefined()
    expect(latestAnnotationContextIdOf({ nodes: [] } as never)).toBeUndefined()
    // A key sequence without a collection must not dereference a missing map.
    expect(latestAnnotationContextIdOf({ order: ['a'] } as never)).toBeUndefined()
  })

  it('ignores contexts whose source is not this plugin', () => {
    const foreign = { kind: 'context' as const, source: { kind: 'plugin:other', snapshotId: 'x' } }
    expect(latestAnnotationContextIdOf(arraySession([foreign]) as never)).toBeUndefined()
  })
})
