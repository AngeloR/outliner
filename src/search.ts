import { create, insert, insertBatch, search } from '@lyrasearch/lyra';
import { map } from 'lodash';
import { OutlineNode } from 'outline';

export class Search {
  db: any;
  constructor() {
  }

  async createIndex(schema: Record<string, any>) {
    this.db = await create({
      schema
    });
  }

  indexDoc(doc: Record<string, any>) {
    return insert(this.db, doc)
  }

  indexBatch(docs: Record<string, OutlineNode>) {
    return insertBatch(this.db, map(docs, doc => doc as any));
  }

  search(term: string) {
    return search(this.db, {
      term: term.trim(),
      properties: ["content"]
    });
  }
}
