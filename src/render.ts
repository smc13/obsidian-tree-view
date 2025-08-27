import { TreeNode } from './parsers'
import { App, getIcon } from 'obsidian'

export function renderTree(app: App, file: string, el: HTMLElement, nodes: TreeNode[]) {
  const wrapper = el.createEl('div', { cls: 'nav-files-container tree-view--container' })
  const container = wrapper.createEl('div')
  container.createEl('div') // currently just for rainbow compatibility

  nodes.forEach(node => renderTreeItem(app, file, container, node, 1))
}

function renderTreeItem(app: App, file: string, parent: HTMLElement, node: TreeNode, depth: number) {
  const mappedType = node.type === 'directory' ? 'folder' : 'file'
  const hasChildren = node.children.length > 0
  const item = parent.createEl(
    'div',
    {
      cls: `tree-view--item tree-item nav-${mappedType}`
    }
  )

  const { icon } = createTreeItemSelf(item, node)

  if (hasChildren) {
    const childrenContainer = item.createEl('div', { cls: 'tree-item-children nav-folder-children' })
    childrenContainer.createEl('div') // currently just for rainbow compatibility
    node.children.forEach(child => renderTreeItem(app, file, childrenContainer, child, depth + 1))

    item.addEventListener('click', (e) => {
      e.stopPropagation()
      const isCollapsed = item.hasClass('is-collapsed')
      item.toggleClass('is-collapsed', !isCollapsed)
      icon?.toggleClass('collapse-icon', !isCollapsed)

      if (isCollapsed) {
        item.appendChild(childrenContainer)
      } else {
        childrenContainer.remove()
      }
    })
  }
}

function createTreeItemSelf(parent: HTMLElement, node: TreeNode) {
  const mappedType = node.type === 'directory' ? 'folder' : 'file'
  const itemSelf = parent.createEl('div', { cls: `tree-view--item-self tree-item-self nav-${mappedType}-title is-clickable mod-collapsible` })
  let iconContainer: HTMLElement | undefined
  if (node.children.length > 0) {
    iconContainer = itemSelf.createEl('div', { cls: 'tree-item-icon collapse-icon' })
    const icon = getIcon('chevron-right')!
    icon.addClass('right-triangle')
    iconContainer.appendChild(icon)
  }

  createNodeIcon(itemSelf, node)

  itemSelf.createEl('div', {
    text: node.name,
    cls: `tree-item-inner nav-${mappedType}-title-content`
  })

  return { self: itemSelf, icon: iconContainer }
}

function createNodeIcon(parent: HTMLElement, node: TreeNode) {
  // we're going to use 2 icons for directories: open and closed
  if (node.type === 'directory') {
    const openIcon = getIcon('folder-open')!
    openIcon.addClass('tree-view--icon', 'tree-view--folder-icon', 'tree-view--folder-icon--open')
    const closedIcon = getIcon('folder-closed')!
    closedIcon.addClass('tree-view--icon', 'tree-view--folder-icon', 'tree-view--folder-icon--closed')
    parent.appendChild(closedIcon)
    parent.appendChild(openIcon)
  }

  if (node.type === 'file') {
    const fileIcon = getIcon('file')!
    fileIcon.addClass('tree-view--icon', 'tree-view--file-icon')
    parent.appendChild(fileIcon)
  }
}