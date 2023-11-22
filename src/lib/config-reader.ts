import * as fs from '@tauri-apps/api/fs';
import { appDataDir, join } from '@tauri-apps/api/path';

export type OutlinerConfiguration = {
  dirConfig: {
    base: string;
    images: string;
    contentNodes: string;
  },
  integrations: {
    hugoPublisher?: {
      contentPath: string,
      imagePath: string
    }
  }
}

const SampleConfig: OutlinerConfiguration = {
  dirConfig: {
    base: "outliner",
    images: "images",
    contentNodes: "contentNodes"
  },
  integrations: {
    hugoPublisher: {
      contentPath: "/home/xangelo/repos/xangelo.ca/content",
      imagePath: "/home/xangelo/repos/xangelo.ca/static"
    }
  }
};


export class ConfigReader {
  config: OutlinerConfiguration;
  baseDir: string;
  constructor() {
  }

  async loadFile() {
    if(await fs.exists('outliner/outliner.config', {
      dir: fs.BaseDirectory.AppLocalData
    })) {
      const raw = await fs.readTextFile('outliner/outliner.config', {
        dir: fs.BaseDirectory.AppLocalData
      });

      const config = JSON.parse(raw) as unknown as Partial<OutlinerConfiguration>;

      this.config = Object.assign(this.config, config)
    }
    else {
      this.config = SampleConfig;
    }

    console.log('loaded config', this.config);
    this.baseDir = await appDataDir();
  }

  iamgeDirPath(): string {
    return `${this.baseDir}${this.config.dirConfig.base}/${this.config.dirConfig.images}`
  }
}

export const config = new ConfigReader();
