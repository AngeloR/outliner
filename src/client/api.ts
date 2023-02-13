import {RawOutline, OutlineTree, Outline} from "../lib/outline";
import { ContentNode } from "../lib/contentNode";
import { map } from 'lodash';
import {Modal} from "./lib/modal";
import {Cursor} from "./cursor";


export class ApiClient {
  authToken: string;
  accountId: string;
  apiHost: string;
  outline: Outline;
  fileLoadModal: Modal;
  cursor: Cursor;
  constructor(outline: Outline, cursor: Cursor) {
    this.apiHost = 'http://localhost:3200';
    this.outline = outline;
    this.cursor = cursor;
    // the auth token in local storage is the default. But if there is a token 
    // in the URL, that's likely the newer one, so it should override
    this.authToken = localStorage.getItem('authToken');
    this.accountId = localStorage.getItem('accountId');

    if(window.location.search.length) {
      const searchParams = new URLSearchParams(window.location.search);

      if(searchParams.get('token')) {
        this.authToken = searchParams.get('token');
        localStorage.setItem('authToken', this.authToken);

        this.accountId = searchParams.get('accountId');
        localStorage.setItem('accountId', this.accountId);

        this.outline.accountId = this.accountId;
      }
    }


    if(this.isAuthenticated()) {
      this.firstTimeLoad();
    }
  }

  async firstTimeLoad() {
    const outlines = await this.listRemoteOutlines();

    this.fileLoadModal = new Modal({
      title: 'Remote Outlines',
      escapeExitable: true,
    }, `
    <p>We found some outlines on the server that you can resume</p>
    <table>
    <thead>
      <tr>
      <th>Outline</th>
      <th>Last Modified</th>
      <th></td>
      </tr>
    </thead>
    <tbody>
    ${outlines.map(outline => {
      return `
      <tr>
      <td>${outline.name}</td>
      <td>${outline.lastUpdated ? outline.lastUpdated : outline.createdDate}</td>
      <td><a href="#" data-outline-id="${outline.id}" class="load-outline">Load</a></td>
      </tr>
      `
    })}
    </tbody>
    </table>
    `);


    this.fileLoadModal.show();
    document.querySelectorAll('.load-outline').forEach(e => {
      const el = e as HTMLElement;
      el.addEventListener('click', async e => {
        await this.loadOutline(e);
        this.fileLoadModal.remove();
      });
    });
  }

  async loadOutline(e: Event) {
    const el = e.target as HTMLElement;
    const outlineId = el.getAttribute('data-outline-id');

    const data = await this.get<{
      outline: {
        accountId: string,
        createdDate: string,
        id: string,
        lastUpdated: string,
        name: string,
        tree: OutlineTree
      },
      contentNodes: Record<string, ContentNode>
    }>(`/account/${this.accountId}/outline/${outlineId}`);

    this.outline.data = {
      id: data.outline.id,
      created: +(new Date(data.outline.createdDate)),
      name: data.outline.name,
      tree: data.outline.tree,
      contentNodes: data.contentNodes
    };

    document.getElementById('outliner').innerHTML = this.outline.render();
    this.cursor.set('.node');
    this.saveLocal();
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.apiHost}${endpoint}?token=${this.authToken}`);
    return await res.json() as T;
  }

  async post<T>(endpoint: string, body: Record<string, any> = {}): Promise<[T, number]> {
    const res = await fetch(`${this.apiHost}${endpoint}?token=${this.authToken}`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    return [await res.json() as T, res.status];
  }

  async patch<T>(endpoint: string, body: Record<string, any> = {}): Promise<[T, number]> {
    const res = await fetch(`${this.apiHost}${endpoint}?token=${this.authToken}`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    return [await res.json() as T, res.status];
  }

  isAuthenticated() {
    return this.authToken?.length > 0;
  }

  async createNewOutline(id: string) {
    const [res, statusCode] = await this.post(`/account/${this.accountId}/outline/${id}`)
  }

  async syncTree(id: string, tree: OutlineTree) {
    const [ , statusCode] = await this.patch(`/account/${this.accountId}/outline/${id}`, { outlineTree: tree });
  }

  async listRemoteOutlines() {
    return this.get<{
      id: string,
      createdDate: string,
      lastUpdated: string,
      name: string
    }[]>(`/account/${this.accountId}/outline`);
  }

  saveLocal() {
    localStorage.setItem(this.outline.data.id, JSON.stringify(this.outline.data));
    localStorage.setItem('activeOutline', this.outline.data.id);
    console.log(`Saved outline ${this.outline.data.id} locally`);
  }

  async save() {
    this.saveLocal();
    await this.syncTree(this.outline.data.id, this.outline.data.tree);
    console.log('Synced tree remotely');
  }

  async saveContentNode(content: ContentNode) {
    const res = await this.post(`/account/${this.accountId}/content/${content.id}`, {
      content
    });

    this.saveLocal();

    return res;
  }

  async syncOutlineFromLocal(outline: RawOutline) {
    // first make sure the outline exists
    await this.createNewOutline(outline.id);
    await this.syncTree(outline.id, outline.tree);
    await this.post(`/account/${this.accountId}/batch-content-create`, {
      content: map(outline.contentNodes, node => {
        return {
          id: node.id,
          type: node.type,
          archiveDate: node.archiveDate,
          content: node.content
        }
      })
    });

    console.log('Local outline Synced');
  }
}
