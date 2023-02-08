import {RawOutline, OutlineTree, OutlineNode} from "../lib/outline";
import { map } from 'lodash';


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

    const syncFromRemote = confirm('Do you want to sync your outline from the server, overwriting your local copy?');

    if(syncFromRemote) {
      this.syncOutlineFromRemote()
    }
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.apiHost}${endpoint}?=token=${this.authToken}`);
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
    return this.authToken.length > 0;
  }

  async createNewOutline(id: string) {
    const [res, statusCode] = await this.post(`/account/${this.accountId}/outline/${id}`)
  }

  async syncTree(id: string, tree: OutlineTree) {
    const [ , statusCode] = await this.patch(`/account/${this.accountId}/outline/${id}`, { outlineTree: tree });
  }

  async listRemoteOutlines() {
    return this.get(`/account/${this.accountId}/outline`);
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
          archiveDate: node.strikethrough ? Date.now() : null,
          content: node.content
        }
      })
    });

    console.log('Local outline Synced');
  }

  async syncOutlineFromRemote() {
  }
}
