import {OutlineTree, Outline, RawOutline} from "./lib/outline";
import { ContentNode, IContentNode } from "./lib/contentNode";
import { slugify } from './lib/string';
import { uniq, keyBy, map } from 'lodash';
import * as fs from '@tauri-apps/api/fs';
import { appWindow } from '@tauri-apps/api/window';

type RawOutlineData = {
  id: string;
  name: string;
  created: number;
  lastModified: number;
}

type OutlineDataStorage = {
  id: string;
  version: string;
  created: number;
  name: string;
  tree: OutlineTree;
}

export class ApiClient {
  dir = fs.BaseDirectory.AppLocalData;
  state: Map<string, any>;
  constructor() {
    this.state = new Map<string, any>();
  }

  async createDirStructureIfNotExists() {
    if(!await fs.exists('outliner/contentNodes', {
      dir: fs.BaseDirectory.AppLocalData
    })) {
      await fs.createDir('outliner/contentNodes', {
        dir: fs.BaseDirectory.AppLocalData,
        recursive: true
      });
    }
  }

  async listAllOutlines() {
    const files = await fs.readDir('outliner', {
      dir: fs.BaseDirectory.AppLocalData
    });

    return files.filter(obj => {
      return !obj.children 
    });
  }

  async loadOutline(outlineName: string): Promise<RawOutline> {
    const raw = await fs.readTextFile(`outliner/${slugify(outlineName)}.json`, {
      dir: fs.BaseDirectory.AppLocalData
    });

    const rawOutline = JSON.parse(raw) as OutlineDataStorage;

    const contentNodeIds = uniq(JSON.stringify(rawOutline.tree).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi));


    // the first node is always the root
    contentNodeIds.shift();

    const rawContentNodes = await Promise.allSettled(map(contentNodeIds, (id) => {
      return fs.readTextFile(`outliner/contentNodes/${id}.json`, {
        dir: fs.BaseDirectory.AppLocalData
      })
    }));

    appWindow.setTitle(`outliner: ${rawOutline.name}`);

    return {
      id: rawOutline.id,
      version: rawOutline.version,
      created: rawOutline.created,
      name: rawOutline.name,
      tree: rawOutline.tree,
      contentNodes: keyBy(map(rawContentNodes, raw => {
        if(raw.status === 'fulfilled') {
          return ContentNode.Create(JSON.parse(raw.value) as IContentNode)
        }
        else {
          console.log('rejected node', raw.reason);
        }
      }), n => n.id)
    }
  }

  async saveOutline(outline: Outline) {
    await fs.writeTextFile(`outliner/${slugify(outline.data.name)}.json`, JSON.stringify({
      id: outline.data.id,
      version: outline.data.version,
      created: outline.data.created,
      name: outline.data.name,
      tree: outline.data.tree
    }), {
      dir: fs.BaseDirectory.AppLocalData,
    });

  }

  async renameOutline(oldName: string, newName: string) {
    if(newName.length && oldName !== newName) {
      return fs.renameFile(`outliner/${slugify(oldName)}.json`, `outliner/${slugify(newName)}.json`, {
        dir: fs.BaseDirectory.AppLocalData
      });
    }
    appWindow.setTitle(`outliner: ${newName}`);
  }

  async saveContentNode(node: ContentNode) {
    await fs.writeTextFile(`outliner/contentNodes/${node.id}.json`, JSON.stringify(node.toJson()), {
      dir: fs.BaseDirectory.AppLocalData
    });
  }

  save(outline: Outline) {
    if(!this.state.has('saveTimeout')) {
      this.state.set('saveTimeout', setTimeout(async () => {
        await this.saveOutline(outline);
        this.state.delete('saveTimeout');
      }, 2000));
    }

  }
}
