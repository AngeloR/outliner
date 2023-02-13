import {OutlineTree, Outline} from "../lib/outline";
import { ContentNode } from "../lib/contentNode";
import * as fs from '@tauri-apps/api/fs';
import { appLocalDataDir, join } from '@tauri-apps/api/path';

type OutlineDataStorage = {
  id: string;
  version: string;
  created: string;
  name: string;
  tree: OutlineTree;
}

export class ApiClient {
  constructor() {
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

  async saveOutline(outline: Outline) {
    await fs.writeTextFile(`outliner/${outline.data.id}.json`, JSON.stringify({
      id: outline.data.id,
      version: outline.data.version,
      created: outline.data.created,
      name: outline.data.name,
      tree: outline.data.tree
    }), {
      dir: fs.BaseDirectory.AppLocalData,
    });
  }

  async saveContentNode(node: ContentNode) {
    await fs.writeTextFile(`outliner/contentNodes/${node.id}.json`, JSON.stringify(node.toJson()), {
      dir: fs.BaseDirectory.AppLocalData
    });
  }
}
