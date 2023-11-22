import {Cursor} from "cursor";
import {Integration} from "integrations/base";
import {ContentNode} from "lib/contentNode";
import {FlatTreeNode, Outline, OutlineTree} from "lib/outline";
import * as fs from '@tauri-apps/api/fs';
import { config } from '../../lib/config-reader';
import { slugify} from '../../lib/string';
import { DateTime } from "luxon";
import { map } from 'lodash';
import { ConfigReader } from "lib/config-reader";

const RegexList = {
  image: /\!\[(.*)\]\((.*)\)/
}

export class HugoPublisher extends Integration{
  outline: Outline;
  cursor: Cursor;
  constructor(config: ConfigReader) {
    super('hugo-publisher', 'Hugo Publisher', config);
  }

  bindEvents(outline: Outline, cursor: Cursor): void {
    this.outline = outline;
    this.cursor = cursor;
  }

  async copyImage(source: string): Promise<void> {
    const filename = source.split('/').pop();
    const destination = `${this.config.config.integrations.hugoPublisher.imagePath}/${filename}`;
    if(await fs.exists(destination)) {
      console.log('File exists..');
    }
    else {
      await fs.copyFile(source, destination);
      console.log('File copied!');
    }
  }

  async publish(node: OutlineTree): Promise<void> {
    // the first node is the "title" node. 
    // it looks for a node where the content is "$meta" that's a child 
    // of the first node. The values from that are the 
    const title = this.outline.getContentNode(node.id).content.split('#').pop();
    const frontMatter: Record<string, string> = {
      title: title
    };

    const flat: FlatTreeNode[] = this.outline.flattenOutlineTreeChildren(node);

    // now that we have a flat list of nodes, we can get their 
    // content and assemble it into a single post!

    // we join each node with \n\n to represent a new 
    // paragraph in markdown this is what we submit to 
    // the server
    let isMetaMode: boolean = false;
    let filename: string = slugify(this.outline.getContentNode(node.id).content.split('#').pop());
    const filesToCopy: {sourcePath: string, fileName: string}[] = [];
    const contentNodes = flat.map((ftn: FlatTreeNode) => {
      const node: ContentNode =  this.outline.getContentNode(ftn.id);
      if(isMetaMode) {
        if(node.content.includes('filename:')) {
          filename = node.content.split(': ')[1];
        }
        else {
          const pieces = node.content.toString().split(':');
          frontMatter[pieces.shift()] = pieces.join(':');
        }
      }
      else {
        if(node.content === '$meta') {
          isMetaMode = true;
        }
        else {
          if(node.content === title) {
            return '';
          }
          // this is where we figure out if this node contains an image
          const content = node.content.toString();
          if(RegexList.image.test(content)) {
            const [fullMatch, title, fileName] = RegexList.image.exec(content);

            // copy the file over to its final destination
            filesToCopy.push({
              sourcePath: `${config.iamgeDirPath()}/${fileName}`,
              fileName
            });

            return `![${title}](/${fileName})`;
          }
          else {
            return node.content.toString();
          }
          
        }
      }
      return '';
    });

    const finalFormat = `---
${map(frontMatter, (value, key) => {
      return `${key}: ${value}`
    }).join("\n")}
date: ${DateTime.now().toISO()}
---
${contentNodes.join("\n\n")}
    `;

    const paths = this.config.config.integrations.hugoPublisher;
    const dirPath = `${paths.contentPath}/${filename.split('/').slice(0, -1).join('/')}`;

    await fs.createDir(dirPath, { recursive: true });
    await fs.writeTextFile(`${paths.contentPath}/${filename}.md`, finalFormat);

    if(filesToCopy.length) {
      await Promise.all(filesToCopy.map(fileData => {
        return fs.copyFile(
          fileData.sourcePath,
          `${config.config.integrations.hugoPublisher.imagePath}/${fileData.fileName}`
        );
      }));
    }
  }

}
