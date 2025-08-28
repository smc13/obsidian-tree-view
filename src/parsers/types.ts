
export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  children: TreeNode[]
  metadata?: TreeNodeMeta
}

export interface TreeNodeMeta {
  _depth: number
  collapsed?: boolean
  icon?: string
}

export enum TreeFormat {
  ASCII = 'ascii',
  JSON = 'json'
}