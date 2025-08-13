export interface IContentNode {
  id: string;
  created: number;
  lastUpdated?: number;
  type: 'text';
  content: string;
  archived: boolean;
  archiveDate?: number;
  deleted: boolean;
  deletedDate?: number;
}

export class ContentNode implements IContentNode {
  id: string;
  created: number;
  lastUpdated?: number;
  type: 'text';
  content: string;
  archived: boolean;
  archiveDate?: number;
  deleted: boolean;
  deletedDate?: number;

  constructor(id?: string, content?: string) {
    this.id = id;
    this.content = content || '';
    this.created = Date.now();
    this.type = 'text';

    this.archived = false;
    this.deleted = false;
  }

  static Create(data: IContentNode): ContentNode {
    const node = new ContentNode(data.id, data.content);

    node.type = 'text';
    node.created = data.created;
    node.lastUpdated = data.lastUpdated;
    node.archived = data.archived;
    node.archiveDate = data.archiveDate;
    node.deleted = data.deleted;
    node.deletedDate = data.deletedDate;

    return node;
  }

  setContent(str: string) {
    this.content = str;
    this.lastUpdated = Date.now();
  }

  isArchived() {
    return this.archived === true;
  }

  isDeleted() {
    return this.deleted === true;
  }

  toggleArchiveStatus() {
    if (this.isArchived()) {
      this.unarchive();
    }
    else {
      this.archive();
    }
  }

  unarchive() {
    this.archived = false;
    this.archiveDate = null;
  }

  archive() {
    this.archived = true;
    this.archiveDate = Date.now();
  }

  undelete() {
    this.deleted = false;
    this.deletedDate = null;
  }

  delete() {
    this.deleted = true;
    this.deletedDate = Date.now();
  }

  toJson(): IContentNode {
    return {
      id: this.id,
      created: this.created,
      lastUpdated: this.lastUpdated,
      type: this.type,
      content: this.content,
      archived: this.archived,
      archiveDate: this.archiveDate,
      deleted: this.deleted,
      deletedDate: this.deletedDate
    };
  }

}
