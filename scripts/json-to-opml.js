#!/usr/bin/env node
/**
 * Convert legacy outliner JSON (outline + contentNodes/*.json) into a single OPML 2.0 file.
 *
 * Usage:
 *   node scripts/json-to-opml.js /path/to/outliner/MyOutline.json
 *
 * Output:
 *   /path/to/outliner/MyOutline.opml
 *
 * Notes:
 * - This script is intentionally self-contained (Node stdlib only).
 * - It emits OPML 2.0 per spec: https://opml.org/spec2.opml
 * - It uses standard OPML `created` (RFC822 date string) on each <outline>.
 * - Other app-specific metadata is stored via `ol_*` attributes.
 */

const fs = require('fs');
const path = require('path');

function usageAndExit(message) {
  if (message) {
    console.error(message);
  }
  console.error('Usage: node scripts/json-to-opml.js /absolute/or/relative/path/to/outline.json');
  process.exit(1);
}

function escapeXmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '&#10;');
}

function toRFC822(ms) {
  const d = new Date(Number(ms));
  if (!Number.isFinite(d.getTime())) {
    return new Date().toUTCString();
  }
  return d.toUTCString();
}

function asBool01(v) {
  return v ? '1' : '0';
}

function asMsString(v) {
  if (v === undefined || v === null) {
    return '';
  }
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '';
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function collectTreeNodeIds(tree) {
  const ids = [];
  function walk(node) {
    if (!node) {
      return;
    }
    if (node.id) {
      ids.push(node.id);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
  }
  walk(tree);
  return ids;
}

function outlineNodeXml(node, contentById) {
  const cn = contentById[node.id] || {};

  const attrs = {
    text: cn.content || '',
    id: node.id,
    // standard OPML attribute:
    created: toRFC822(cn.created),
    // app metadata:
    ol_collapsed: asBool01(!!node.collapsed),
    ol_lastUpdatedMs: asMsString(cn.lastUpdated),
    ol_archived: asBool01(!!cn.archived),
    ol_archiveDateMs: asMsString(cn.archiveDate),
    ol_deleted: asBool01(!!cn.deleted),
    ol_deletedDateMs: asMsString(cn.deletedDate),
    ol_task: asBool01(!!cn.task),
    ol_completionDateMs: asMsString(cn.completionDate),
  };

  const attrStr = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null && String(v).length > 0)
    .map(([k, v]) => `${k}="${escapeXmlAttr(v)}"`)
    .join(' ');

  if (!node.children || node.children.length === 0) {
    return `<outline ${attrStr}/>`;
  }

  const childrenXml = node.children.map(child => outlineNodeXml(child, contentById)).join('\n');
  return `<outline ${attrStr}>\n${childrenXml}\n</outline>`;
}

function buildOpml(outlineMeta, tree, contentById) {
  const now = new Date();
  const title = outlineMeta.name || 'Untitled';
  const created = outlineMeta.created || Date.now();
  const outlineId = outlineMeta.id || '';
  const outlineVersion = outlineMeta.version || '0.0.1';

  const head = [
    '<head>',
    `<title>${escapeXmlAttr(title)}</title>`,
    `<dateCreated>${toRFC822(created)}</dateCreated>`,
    `<dateModified>${now.toUTCString()}</dateModified>`,
    '<generator>outliner-json-to-opml</generator>',
    `<outlinerId>${escapeXmlAttr(outlineId)}</outlinerId>`,
    `<outlinerVersion>${escapeXmlAttr(outlineVersion)}</outlinerVersion>`,
    '</head>',
  ].join('\n');

  const bodyOutlines = (tree.children || []).map(n => outlineNodeXml(n, contentById)).join('\n');

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

function main() {
  const argv = process.argv.slice(2);
  if (argv.length !== 1) {
    usageAndExit();
  }

  const input = argv[0];
  const inputPath = path.resolve(process.cwd(), input);
  if (!inputPath.toLowerCase().endsWith('.json')) {
    usageAndExit(`Input must be a .json file: ${inputPath}`);
  }
  if (!fs.existsSync(inputPath)) {
    usageAndExit(`File not found: ${inputPath}`);
  }

  const outlineDir = path.dirname(inputPath);
  const contentDir = path.join(outlineDir, 'contentNodes');

  const outlineJson = readJson(inputPath);
  if (!outlineJson || typeof outlineJson !== 'object') {
    throw new Error('Invalid JSON: expected an object at the root');
  }
  if (!outlineJson.tree || typeof outlineJson.tree !== 'object') {
    throw new Error('Invalid outline JSON: missing `tree`');
  }

  // Content nodes can be embedded (e.g. src/test-data.json) OR stored externally as contentNodes/<id>.json
  const contentById = {};
  if (outlineJson.contentNodes && typeof outlineJson.contentNodes === 'object') {
    for (const [id, node] of Object.entries(outlineJson.contentNodes)) {
      if (node && typeof node === 'object') {
        contentById[id] = node;
      }
    }
  } else {
    // Collect ids from the tree and load content nodes from contentNodes/<id>.json.
    const ids = collectTreeNodeIds(outlineJson.tree);
    const rootId = outlineJson.id || outlineJson.tree.id;
    const contentIds = ids.filter(id => id && id !== rootId);

    if (!fs.existsSync(contentDir)) {
      throw new Error(
        `Missing content nodes directory: ${contentDir}\n` +
        `This JSON doesn't include inline contentNodes; expected content files at ${contentDir}/<uuid>.json`
      );
    }

    for (const id of contentIds) {
      const p = path.join(contentDir, `${id}.json`);
      if (!fs.existsSync(p)) {
        // If a node file is missing, still create a placeholder node so the outline remains valid.
        contentById[id] = { id, created: Date.now(), content: '' };
        continue;
      }
      try {
        contentById[id] = readJson(p);
      } catch (e) {
        throw new Error(`Failed reading content node ${p}: ${String(e && e.message ? e.message : e)}`);
      }
    }
  }

  // If any content nodes contain a legacy `archivedDate` key, normalize to `archiveDate`.
  for (const [id, node] of Object.entries(contentById)) {
    if (node && node.archivedDate !== undefined && node.archiveDate === undefined) {
      node.archiveDate = node.archivedDate;
      delete node.archivedDate;
      contentById[id] = node;
    }
  }

  const opml = buildOpml(
    {
      id: outlineJson.id,
      name: outlineJson.name,
      created: outlineJson.created,
      version: outlineJson.version,
    },
    outlineJson.tree,
    contentById
  );

  const outputPath = inputPath.replace(/\.json$/i, '.opml');
  fs.writeFileSync(outputPath, opml, 'utf8');
  console.log(`Wrote ${outputPath}`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}


