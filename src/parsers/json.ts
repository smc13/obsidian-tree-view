import { TreeNode } from './types'

export function parseJsonTree(source: string): TreeNode[] {
  const data = JSON.parse(source)
  if (!Array.isArray(data)) {
    throw new Error('JSON tree must be an array of nodes')
  }

  return data.map(mapJsonNode, 0)
}

function mapJsonNode(node: any, depth: number): TreeNode {
  return {
    name: node.name,
    type: node.type === 'directory' ? 'directory' : 'file',
    children: node.contents ? node.contents.map(mapJsonNode, depth + 1) : [],
    metadata: {
      _depth: depth,
      collapsed: node.collapsed !== undefined ? Boolean(node.collapsed) : undefined,
      icon: node.icon !== undefined ? String(node.icon) : undefined,
    }
  }
}