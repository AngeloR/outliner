import { v4 as uuid } from 'uuid';
import { ContentNode, IContentNode } from './contentNode';
import { OutlineTree, RawOutline } from './outline';

type Attrs = Record<string, string>;

function escapeXmlAttr(value: string): string {
  // XML attribute escaping + preserve newlines
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '&#10;');
}

function unescapeXml(value: string): string {
  // Handles common named entities + numeric entities used by our serializer.
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseTagAttributes(tag: string): Attrs {
  // Expects a string like `<outline a="b" c='d'>` or `outline a="b"`
  const attrs: Attrs = {};
  const re = /([A-Za-z_][A-Za-z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag))) {
    const key = match[1];
    const raw = (match[2] ?? match[3] ?? '').toString();
    attrs[key] = unescapeXml(raw);
  }
  return attrs;
}

function extractTagText(xml: string, tagName: string): string | null {
  const re = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const m = xml.match(re);
  if (!m) {
    return null;
  }
  return unescapeXml(m[1].trim());
}

function findBodyInnerXml(xml: string): string {
  const bodyStart = xml.search(/<body\b[^>]*>/i);
  if (bodyStart < 0) {
    return '';
  }
  const openTagEnd = xml.indexOf('>', bodyStart);
  if (openTagEnd < 0) {
    return '';
  }
  const bodyEnd = xml.search(/<\/body>/i);
  if (bodyEnd < 0) {
    return '';
  }
  return xml.slice(openTagEnd + 1, bodyEnd);
}

type ParsedOutline = {
  attrs: Attrs;
  children: ParsedOutline[];
};

function skipWhitespace(xml: string, idx: number): number {
  while (idx < xml.length && /\s/.test(xml[idx])) {
    idx++;
  }
  return idx;
}

function parseOutlineAt(xml: string, startIdx: number): { node: ParsedOutline; nextIdx: number } {
  let idx = skipWhitespace(xml, startIdx);
  if (!xml.slice(idx).toLowerCase().startsWith('<outline')) {
    throw new Error(`OPML parse error: expected <outline> at index ${idx}`);
  }

  const startTagEnd = xml.indexOf('>', idx);
  if (startTagEnd < 0) {
    throw new Error('OPML parse error: unterminated <outline> start tag');
  }

  const startTag = xml.slice(idx, startTagEnd + 1);
  const isSelfClosing = /\/>\s*$/.test(startTag);
  const attrs = parseTagAttributes(startTag);

  idx = startTagEnd + 1;

  if (isSelfClosing) {
    return { node: { attrs, children: [] }, nextIdx: idx };
  }

  const children: ParsedOutline[] = [];
  while (idx < xml.length) {
    idx = skipWhitespace(xml, idx);

    // comments
    if (xml.slice(idx).startsWith('<!--')) {
      const endComment = xml.indexOf('-->', idx + 4);
      if (endComment < 0) {
        throw new Error('OPML parse error: unterminated comment');
      }
      idx = endComment + 3;
      continue;
    }

    if (xml.slice(idx).toLowerCase().startsWith('</outline')) {
      const closeEnd = xml.indexOf('>', idx);
      if (closeEnd < 0) {
        throw new Error('OPML parse error: unterminated </outline> end tag');
      }
      idx = closeEnd + 1;
      break;
    }

    if (xml.slice(idx).toLowerCase().startsWith('<outline')) {
      const parsed = parseOutlineAt(xml, idx);
      children.push(parsed.node);
      idx = parsed.nextIdx;
      continue;
    }

    // Ignore unexpected content between outline tags (whitespace or other tags).
    const nextTag = xml.indexOf('<', idx);
    if (nextTag < 0) {
      break;
    }
    idx = nextTag;
  }

  return { node: { attrs, children }, nextIdx: idx };
}

function parseBodyOutlines(xml: string): ParsedOutline[] {
  const inner = findBodyInnerXml(xml);
  const outlines: ParsedOutline[] = [];
  let idx = 0;
  while (idx < inner.length) {
    idx = skipWhitespace(inner, idx);
    const next = inner.slice(idx).toLowerCase().indexOf('<outline');
    if (next < 0) {
      break;
    }
    idx = idx + next;
    const parsed = parseOutlineAt(inner, idx);
    outlines.push(parsed.node);
    idx = parsed.nextIdx;
  }
  return outlines;
}

function asBool(v: unknown, defaultValue: boolean = false): boolean {
  if (v === undefined || v === null) {
    return defaultValue;
  }
  const s = v.toString().trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

function asNumber(v: unknown, defaultValue: number = null): number {
  if (v === undefined || v === null) {
    return defaultValue;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

function parseDateMs(v: unknown, defaultValue: number = null): number {
  if (v === undefined || v === null) {
    return defaultValue;
  }
  const s = v.toString().trim();
  if (!s.length) {
    return defaultValue;
  }
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : defaultValue;
}

function parsedOutlineToTreeAndContent(
  parsed: ParsedOutline,
  contentNodes: Record<string, IContentNode>
): OutlineTree {
  const id = parsed.attrs.id || parsed.attrs['ol_id'] || uuid();

  const content: IContentNode = {
    id,
    created: parseDateMs(parsed.attrs.created, Date.now()),
    lastUpdated: asNumber(parsed.attrs.ol_lastUpdatedMs ?? parsed.attrs.ol_lastUpdated ?? parsed.attrs.lastUpdatedMs, null),
    type: 'text',
    content: (parsed.attrs.text ?? '').toString(),
    archived: asBool(parsed.attrs.ol_archived, false),
    archiveDate: asNumber(parsed.attrs.ol_archiveDateMs ?? parsed.attrs.ol_archiveDate, null),
    deleted: asBool(parsed.attrs.ol_deleted, false),
    deletedDate: asNumber(parsed.attrs.ol_deletedDateMs ?? parsed.attrs.ol_deletedDate, null),
    task: asBool(parsed.attrs.ol_task, false),
    completionDate: asNumber(parsed.attrs.ol_completionDateMs ?? parsed.attrs.ol_completionDate, null),
  };

  contentNodes[id] = content;

  return {
    id,
    collapsed: asBool(parsed.attrs.ol_collapsed ?? parsed.attrs.collapsed, false),
    children: parsed.children.map(child => parsedOutlineToTreeAndContent(child, contentNodes)),
  };
}

export function parseOpmlToRawOutline(xml: string): RawOutline {
  const name = extractTagText(xml, 'title') || 'Untitled';
  const version = extractTagText(xml, 'outlinerVersion') || '0.0.1';
  const id = extractTagText(xml, 'outlinerId') || uuid();
  const created = parseDateMs(extractTagText(xml, 'dateCreated'), Date.now());

  const contentNodes: Record<string, IContentNode> = {};
  const bodyNodes = parseBodyOutlines(xml);
  const treeChildren = bodyNodes.map(n => parsedOutlineToTreeAndContent(n, contentNodes));

  // Root container exists only for the app's internal invariants.
  const tree: OutlineTree = {
    id,
    collapsed: false,
    children: treeChildren,
  };

  return {
    id,
    version,
    created,
    name,
    tree,
    contentNodes: Object.values(contentNodes).reduce((acc, n) => {
      acc[n.id] = ContentNode.Create(n);
      return acc;
    }, {} as Record<string, ContentNode>),
  };
}

function outlineTreeNodeToXml(outline: RawOutline, node: OutlineTree): string {
  const cn = outline.contentNodes[node.id];
  const content = cn ? cn.content : '';

  const attrs: Attrs = {
    text: content,
    id: node.id,
    ol_collapsed: node.collapsed ? '1' : '0',
    ol_lastUpdatedMs: (cn?.lastUpdated ?? '').toString(),
    ol_archived: (cn?.archived ?? false) ? '1' : '0',
    ol_archiveDateMs: (cn?.archiveDate ?? '').toString(),
    ol_deleted: (cn?.deleted ?? false) ? '1' : '0',
    ol_deletedDateMs: (cn?.deletedDate ?? '').toString(),
    ol_task: (cn?.task ?? false) ? '1' : '0',
    ol_completionDateMs: (cn?.completionDate ?? '').toString(),
    // OPML convention (optional) - human readable created timestamp
    created: new Date(cn?.created ?? outline.created).toUTCString(),
  };

  const attrStr = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && v.toString().length > 0)
    .map(([k, v]) => `${k}="${escapeXmlAttr(v.toString())}"`)
    .join(' ');

  if (!node.children || node.children.length === 0) {
    return `<outline ${attrStr}/>`;
  }

  const childrenXml = node.children.map(child => outlineTreeNodeToXml(outline, child)).join('\n');
  return `<outline ${attrStr}>\n${childrenXml}\n</outline>`;
}

export function serializeRawOutlineToOpml(outline: RawOutline): string {
  const now = new Date();

  const head = [
    '<head>',
    `<title>${escapeXmlAttr(outline.name)}</title>`,
    `<dateCreated>${new Date(outline.created).toUTCString()}</dateCreated>`,
    `<dateModified>${now.toUTCString()}</dateModified>`,
    '<generator>outliner</generator>',
    `<outlinerId>${escapeXmlAttr(outline.id)}</outlinerId>`,
    `<outlinerVersion>${escapeXmlAttr(outline.version)}</outlinerVersion>`,
    '</head>',
  ].join('\n');

  const bodyOutlines = outline.tree.children.map(n => outlineTreeNodeToXml(outline, n)).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    head,
    '<body>',
    bodyOutlines,
    '</body>',
    '</opml>',
    '',
  ].join('\n');
}


