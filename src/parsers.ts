
export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  children: TreeNode[]
}

/**
 * Parses an ASCII tree representation (eg from `tree` command) into a nested object structure.
 * example input:
 * ```
 * .
 * ├── folder1
 * │   ├── file1.txt
 * │   └── file2.txt
 * └── folder2
 *     └── file3.txt
 * ```
 */
export function parseAsciiTree(source: string): TreeNode[] {
  const lines = source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(l => l.replace(/\s+$/, '')) // strip trailing spaces
    .filter(l => l.length > 0)

  type StackItem = { depth: number; node: TreeNode }
  const roots: TreeNode[] = []
  const stack: StackItem[] = []

  const isProbablyFile = (name: string): boolean => {
    if (name === '.') return false
    // dotfiles like .env, .gitignore -> file
    if (/^\.[^./\\]+$/.test(name)) return true
    // has an extension -> file (we’ll upgrade to directory if it gets children)
    return /\.[^./\\]+$/.test(name)
  }

  const parseLine = (line: string): { depth: number; name: string } => {
    const trimmed = line
    if (trimmed.trim() === '.') return { depth: 0, name: '.' }

    let i = 0
    let depth = 0

    // Count leading guide segments (each one is 4 chars: "│   " or "    ")
    while (i + 4 <= trimmed.length) {
      const seg = trimmed.slice(i, i + 4)
      if (seg === '│   ' || seg === '    ') {
        i += 4
        depth++
      } else {
        break
      }
    }

    // If there’s a branch token next, it represents the node at (guideDepth + 1)
    if (trimmed.startsWith('├── ', i) || trimmed.startsWith('└── ', i)) {
      i += 4
      const name = trimmed.slice(i)
      return { depth: depth + 1, name }
    }

    // Plain line (no branch tokens) -> name at current depth
    return { depth, name: trimmed.slice(i).trim() }
  }

  for (const raw of lines) {
    const { depth, name } = parseLine(raw)

    const node: TreeNode = {
      name,
      type: isProbablyFile(name) ? 'file' : 'directory',
      children: []
    }

    if (depth === 0) {
      roots.push(node)
      stack.length = 0
      stack.push({ depth, node })
      continue
    }

    // Find the correct parent at depth-1
    while (stack.length && stack[stack.length - 1].depth >= depth) {
      stack.pop()
    }

    if (!stack.length) {
      // Fallback: if structure is malformed, treat as another root
      roots.push(node)
      stack.push({ depth, node })
      continue
    }

    const parent = stack[stack.length - 1].node
    parent.type = 'directory' // ensure parent is a directory if it gets children
    parent.children.push(node)
    stack.push({ depth, node })
  }

  return roots
}

/**
 * Parses a JSON representation of a tree into a nested object structure.
 * example input:
 * ```
 * [
 *   { "name": "folder1", "type": "directory", "contents": [
 *     { "name": "file1.txt", "type": "file" },
 *     { "name": "file2.txt", "type": "file" }
 *   ] },
 * ]
 * ```
 */
export function parseJsonTree(source: string): TreeNode[] {
  const data = JSON.parse(source)
  if (!Array.isArray(data)) {
    throw new Error('JSON tree must be an array of nodes')
  }

  return data.map(mapJsonNode)
}

function mapJsonNode(node: any): TreeNode {
  return {
    name: node.name,
    type: node.type === 'directory' ? 'directory' : 'file',
    children: node.contents ? node.contents.map(mapJsonNode) : [],
  }
}