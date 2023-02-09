import {RawOutline, OutlineTree, OutlineNode} from "../lib/outline";
import { map } from 'lodash';
import {Modal} from "./lib/modal";


export class ApiClient {
  authToken: string;
  accountId: string;
  apiHost: string;
  constructor() {
    this.apiHost = 'http://localhost:3200';
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
      }
    }


    if(this.isAuthenticated()) {
      this.firstTimeLoad();
    }
  }

  async firstTimeLoad() {
    const outlines = await this.listRemoteOutlines();

    const modal = new Modal({
      title: 'Remote Outlines',
      escapeExitable: true
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


    modal.show();
    document.querySelectorAll('.load-outline').forEach(e => {
      const el = e as HTMLElement;
      el.addEventListener('click', this.loadOutline.bind(this));
    });
  }

  async loadOutline(e) {
    const el = e.target as HTMLElement;
    const outlineId = el.getAttribute('data-outline-id');

    const data = await this.get(`/account/${this.accountId}/outline/${outlineId}`);

    console.log('load outline', data);
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

  async saveContentNode(content: OutlineNode) {
    return this.post(`/account/${this.accountId}/content/${content.id}`, {
      content
    });
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

  async syncOutlineFromRemote() {
  }
}
