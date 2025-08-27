import { Plugin } from 'obsidian'
import { parseAsciiTree, parseJsonTree } from './parsers'
import { renderTree } from './render'

interface TreeViewPluginSettings {

}

interface TreeBlockSettings {
  type: 'ascii' | 'yaml' | 'json'
  defaultState: 'collapsed' | 'expanded'
}

export default class TreeViewPlugin extends Plugin {
  settings: TreeViewPluginSettings

  async onload() {
    await this.loadSettings()

    this.registerMarkdownCodeBlockProcessor('tree', (source, el, ctx) => {
      try {
        const treeStructure = parseAsciiTree(source)

        renderTree(this.app, ctx.sourcePath, el, treeStructure)
      } catch (e) {
        el.createEl('pre', { text: `Error parsing tree structure: ${e.message}` })
      }
    })
  }

  onunload() {
    console.log('Unloading Tree View Plugin')
  }

  async loadSettings() {
    this.settings = Object.assign({}, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}