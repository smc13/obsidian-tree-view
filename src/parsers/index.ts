import { parseAsciiTree } from './ascii';
import { parseJsonTree } from './json';
import { TreeNode } from './types';
import { TreeFormat } from './types';

export function parseTree(source: string, format: TreeFormat | undefined): TreeNode[] {
  switch (format) {
    case TreeFormat.ASCII:
      return parseAsciiTree(source)
    case TreeFormat.JSON:
      return parseJsonTree(source)
  }

  // otherwise, try to auto-detect if the block looks like a JSON array
  const trimmed = source.trim()
  if (trimmed.startsWith('[')) {
    return parseJsonTree(source)
  }

  // just assume ASCII if we can't tell
  return parseAsciiTree(source)
}