import { Outline, RawOutline } from "./lib/outline";
import { slugify } from './lib/string';
import * as _ from 'lodash';
import * as fs from '@tauri-apps/plugin-fs';
import { parseOpmlToRawOutline, serializeRawOutlineToOpml } from './lib/opml';

export class ApiClient {
  dir = fs.BaseDirectory.AppLocalData;
  state: Map<string, any>;
  constructor() {
    this.state = new Map<string, any>();
  }

  async createDirStructureIfNotExists() {
    if (!await fs.exists('outliner', {
      baseDir: fs.BaseDirectory.AppLocalData
    })) {
      await fs.mkdir('outliner', {
        baseDir: fs.BaseDirectory.AppLocalData,
        recursive: true
      });
    }
  }

  async listAllOutlines() {
    const files: fs.DirEntry[] = await fs.readDir('outliner', {
      baseDir: fs.BaseDirectory.AppLocalData
    });

    return files.filter(obj => {
      return !obj.isDirectory && obj.name?.toLowerCase().endsWith('.opml');
    });
  }

  private normalizeOutlineFilename(nameOrFilename: string): string {
    const trimmed = nameOrFilename.trim();
    if (trimmed.toLowerCase().endsWith('.opml')) {
      return trimmed;
    }
    return `${slugify(trimmed)}.opml`;
  }

  async loadOutline(outlineNameOrFilename: string): Promise<RawOutline> {
    const filename = this.normalizeOutlineFilename(outlineNameOrFilename);
    const raw = await fs.readTextFile(`outliner/${filename}`, {
      baseDir: fs.BaseDirectory.AppLocalData
    });
    return parseOpmlToRawOutline(raw);
  }

  async saveOutline(outline: Outline) {
    await fs.writeTextFile(`outliner/${slugify(outline.data.name)}.opml`, serializeRawOutlineToOpml(outline.data), {
      baseDir: fs.BaseDirectory.AppLocalData,
    });
  }

  async renameOutline(oldName: string, newName: string) {
    if (newName.length && oldName !== newName) {
      return fs.rename(`outliner/${slugify(oldName)}.opml`, `outliner/${slugify(newName)}.opml`, {
        oldPathBaseDir: fs.BaseDirectory.AppLocalData,
        newPathBaseDir: fs.BaseDirectory.AppLocalData,
      });
    }
  }

  save(outline: Outline) {
    if (!this.state.has('saveTimeout')) {
      this.state.set('saveTimeout', setTimeout(async () => {
        await this.saveOutline(outline);
        this.state.delete('saveTimeout');
      }, 2000));
    }

  }
}
