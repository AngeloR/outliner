import {Cursor} from "cursor";
import {Integration} from "integrations/base";
import {ContentNode} from "lib/contentNode";
import {FlatTreeNode, Outline, OutlineTree} from "lib/outline";
import * as fs from '@tauri-apps/api/fs';
import { slugify} from '../../lib/string';
import { DateTime } from "luxon";


export class HugoPublisher extends Integration{
  outline: Outline;
  cursor: Cursor;
  path: string;
  constructor() {
    super('hugo-publisher', 'Hugo Publisher');
    this.path = '/home/xangelo/repos/xangelo.ca/content/posts';
  }

  bindEvents(outline: Outline, cursor: Cursor): void {
    this.outline = outline;
    this.cursor = cursor;

  }

  async publish(node: OutlineTree): Promise<void> {
    // the first node is the "title" node. 
    // it looks for a node where the content is "$meta" that's a child 
    // of the first node. The values from that are the 
    const frontMatter: string[] = [
      `title: "${this.outline.getContentNode(node.id).content.split('#').pop()}"`
    ];

    const flat: FlatTreeNode[] = this.outline.flattenOutlineTreeChildren(node);

    // now that we have a flat list of nodes, we can get their 
    // content and assemble it into a single post!

    // we join each node with \n\n to represent a new 
    // paragraph in markdown this is what we submit to 
    // the server
    let isMetaMode = false;
    let indented = [];
    let filename = slugify(this.outline.getContentNode(node.id).content.split('#').pop());
    const contentNodes = flat.map((ftn: FlatTreeNode) => {
      const node: ContentNode =  this.outline.getContentNode(ftn.id);
      if(isMetaMode) {
        if(node.content.includes('filename:')) {
          filename = node.content.split(': ')[1];
        }
        else {
          frontMatter.push(node.content.toString());
        }
      }
      else {
        if(node.content === '$meta') {
          isMetaMode = true;
        }
        else {
          return node.content.toString();
        }
      }
      return '';
    });

    const finalFormat = `---
${frontMatter.join("\n")}
date: ${DateTime.now().toISO()}
---
${contentNodes.join("\n\n")}
    `;

    
    await fs.writeTextFile(`${this.path}/${filename}.md`, finalFormat);


  }

}
