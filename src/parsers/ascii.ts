import { TreeNode, TreeNodeMeta } from './types';

const SPACING_CHAR = '    ' // 4 spaces
const GUIDE_CHAR = '│   ' // vertical line + 3 spaces
const BRANCH_CHARS = ['├── ', '└── ']

const NAME_METADATA_SPLIT_REGEX = /^(.*?)(?:<\!\s*(.*?)\s*>)?\s*$/
const METADATA_FIELDS_REGEX = /(\w+)(?:\s*:\s*([^;]+))?\s*;?/g

export function parseAsciiTree(source: string): TreeNode[] {
  const lines = source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(l => l.replace(/\s+$/, '')) // strip trailing spaces
    .filter(l => l.length > 0)

  type StackItem = { depth: number; node: TreeNode }
  const roots: TreeNode[] = []
  let stack: StackItem[] = []

  for (const raw of lines) {
    const { depth, name, metadata } = parseLine(raw)

    const node: TreeNode = {
      name,
      type: isProbablyFile(name) ? 'file' : 'directory',
      children: [],
      metadata
    }

    if (depth === 0) {
      roots.push(node)
      stack = [{ depth: 0, node }]
      continue // we're done with this one
    }

    while (stack.length && stack[stack.length - 1].depth >= depth) {
      stack.pop()
    }

    // couldnt find a parent, attempt to add as root
    if (!stack.length) {
      roots.push(node)
      stack = [{ depth: 0, node }]
      continue // we're done with this one
    }

    const parent = stack[stack.length - 1].node
    parent.children.push(node)
    parent.type = 'directory' // upgrade to directory if it was a file
    stack.push({ depth, node })
  }

  return roots
}

/**
 * Do our best to guess if the line is a file or a directory based on its name.
 * Treats names starting with a dot as files (e.g. .gitignore, .env).
 * Treats names with an extension as files (e.g. file.txt, image.png).
 * Everything else is treated as a directory (e.g. src, docs).
 */
function isProbablyFile (name: string): boolean {
  if (name === '.') return false // the root should be a directory, typically named "."

  // dotfiles like .env, .gitignore -> file
  if (/^\.[^./\\]+$/.test(name)) {
    return true
  }

  // has an extension -> file (we’ll upgrade to directory if it gets children)
  return /\.[^./\\]+$/.test(name)
}

/**
 * Parses a single line of an ASCII tree and returns the depth, name, and metadata.
 * ASCII format: ├── filename.ext <! metaKey: metaValue >
 */
function parseLine (line: string): { depth: number, name: string, metadata: TreeNodeMeta } {
  line = line.trim()
  let i = 0
  let depth = 0

  // calculate the depth
  while (i + 4 <= line.length) {
    const seg = line.slice(i, i + 4)
    if (seg === GUIDE_CHAR || seg === SPACING_CHAR) {
      i += 4
      depth++
    } else {
      break
    }
  }

  // if there’s a branch token next, it represents the node at (guideDepth + 1)
  if (BRANCH_CHARS.some(b => line.startsWith(b, i))) {
    i += 4
    depth += 1
  }

  const { name, metadata } = extractMetadata(line.slice(i).trim())

  return { depth, name, metadata }
}

/**
 * Extracts metadata from a name string if present.
 * Metadata is expected to be in the format: "name <! key: value; key2: value2 >" (spacing optional).
 */
function extractMetadata (nameWithMeta: string): { name: string, metadata: TreeNodeMeta } {
  const match = nameWithMeta.match(NAME_METADATA_SPLIT_REGEX)
  if (!match) {
    return { name: nameWithMeta, metadata: { _depth: 0 } } // default depth will be overwritten later
  }

  const name = match[1].trim()
  const metaString = match[2]
  const metadata: TreeNodeMeta = { _depth: 0 } // default depth will be overwritten later

  if (metaString) {
    let fieldMatch: RegExpExecArray | null
    while ((fieldMatch = METADATA_FIELDS_REGEX.exec(metaString)) !== null) {
      const key = fieldMatch[1].trim();
      const value = fieldMatch[2]?.trim()

      switch (key) {
        case 'collapsed':
          metadata.collapsed = value ? value.toLowerCase() === 'true' : true
          break
        case 'icon':
          if (value) metadata.icon = value
          break
      }
    }
  }

  return { name, metadata }
}