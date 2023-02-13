import {FileEntry} from '@tauri-apps/api/fs';
import { Modal } from '../lib/modal';

const loaderHTML = `
<p>Select an outline to load</p>
<table>
<thead>
<tr>
<th>Outline</th>
<th>Last Modified</th>
<th></th>
</tr>
</thead>
<tbody>
OUTLINELIST
</tbody>
</table>
<a class="btn" href="#" id="create-outline">Create new Outline</a>
`;

function loadOutline(filename: string) {
  console.log(filename);
}

export function loadOutlineModal(outlines: FileEntry[]) {
  const modal = new Modal({
    title: 'Load Outline',
    escapeExitable: false
  }, loaderHTML.replace('OUTLINELIST', outlines.map(o => {
    return `
    <tr>
    <td>${o.name}</td>
    <td>---</td>
    <td><a href="#" data-outline-filename="${o.name}" class="load-outline">Load</a></td>
    </tr>
    `;
  }).join("\n")));

  return modal;
}

