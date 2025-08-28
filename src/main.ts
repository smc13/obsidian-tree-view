import { getIcon, Plugin } from 'obsidian'
import { parseTree } from './parsers'
import { TreeNode } from './parsers/types'

interface TreeViewPluginSettings {
  showArrows: boolean
}

interface TreeBlockSettings {
  type: 'ascii' | 'yaml' | 'json'
  state: 'collapsed' | 'expanded'
}

export default class TreeViewPlugin extends Plugin {
  settings: TreeViewPluginSettings

  async onload() {
    await this.loadSettings()

    this.registerMarkdownCodeBlockProcessor('tree', (source, el, ctx) => {
      try {
        const treeStructure = parseTree(source, undefined)

        this.renderTree(ctx.sourcePath, el, treeStructure)
      } catch (e) {
        el.createEl('pre', { text: `Error parsing tree structure: ${e.message}` })
      }
    })
  }

  async loadSettings() {
    this.settings = Object.assign({
      showArrows: false
    }, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }

  renderTree(file: string, el: HTMLElement, nodes: TreeNode[]) {
    const wrapper = el.createEl('div', { cls: 'nav-files-container tree-view--container' })
    const container = wrapper.createEl('div')
    container.createEl('div') // currently just for rainbow compatibility

    nodes.forEach(node => this.renderTreeItem(file, container, node))
  }

  renderTreeItem (file: string, parent: HTMLElement, node: TreeNode) {
    const mappedType = node.type === 'directory' ? 'folder' : 'file'
    const hasChildren = node.children.length > 0
    const item = parent.createEl(
      'div',
      {
        cls: `tree-view--item tree-item nav-${mappedType}`
      }
    )

    const { icon } = this.createTreeItemSelf(item, node)

    if (hasChildren) {
      const childrenContainer = item.createEl('div', { cls: 'tree-item-children nav-folder-children' })
      childrenContainer.createEl('div') // currently just for rainbow compatibility
      node.children.forEach(child => this.renderTreeItem(file, childrenContainer, child))

      function toggleCollapse(collapsed: boolean) {
        item.toggleClass('is-collapsed', collapsed)
        icon?.toggleClass('collapse-icon', collapsed)
        if (collapsed) {
          childrenContainer.remove()
        } else {
          item.appendChild(childrenContainer)
        }
      }

      item.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleCollapse(!item.hasClass('is-collapsed'))
      })

      if (node.metadata?.collapsed) {
        toggleCollapse(true)
      }
    }
  }

  createTreeItemSelf (parent: HTMLElement, node: TreeNode) {
    const mappedType = node.type === 'directory' ? 'folder' : 'file'
    const itemSelf = parent.createEl('div', { cls: `tree-view--item-self tree-item-self nav-${mappedType}-title is-clickable mod-collapsible` })
    let iconContainer: HTMLElement | undefined
    if (node.children.length > 0) {
      iconContainer = itemSelf.createEl('div', { cls: 'tree-item-icon collapse-icon' })
      const icon = getIcon('chevron-right')!
      icon.addClass('right-triangle')
      iconContainer.appendChild(icon)
    }

    this.createNodeIcon(itemSelf, node)

    itemSelf.createEl('div', {
      text: node.name,
      cls: `tree-item-inner nav-${mappedType}-title-content`
    })

    return { self: itemSelf, icon: iconContainer }
  }

  createNodeIcon (parent: HTMLElement, node: TreeNode) {
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
}