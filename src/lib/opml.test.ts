import { serializeRawOutlineToOpml, parseOpmlToRawOutline } from './opml';
import { RawOutline } from './outline';
import { ContentNode } from './contentNode';

function makeOutline(): RawOutline {
  const rootId = 'e067419a-85c3-422d-b8c4-41690be44500';
  const childA = 'e067419a-85c3-422d-b8c4-41690be4450d';
  const childB = 'e067419a-85c3-422d-b8c4-41690be4450e';

  const a = new ContentNode(childA, 'Hello\n**world**');
  a.archived = true;
  a.archiveDate = 1700000000000;
  a.task = true;
  a.completionDate = 1700000001111;

  const b = new ContentNode(childB, 'Second');
  b.deleted = true;
  b.deletedDate = 1700000002222;
  b.lastUpdated = 1700000003333;

  return {
    id: rootId,
    version: '0.0.1',
    created: 1699999999999,
    name: 'Sample Outline',
    tree: {
      id: rootId,
      collapsed: false,
      children: [
        { id: childA, collapsed: true, children: [] },
        { id: childB, collapsed: false, children: [] },
      ],
    },
    contentNodes: {
      [childA]: a,
      [childB]: b,
    },
  };
}

describe('OPML', () => {
  test('serializes and parses back preserving structure + metadata', () => {
    const original = makeOutline();
    const xml = serializeRawOutlineToOpml(original);

    expect(xml).toContain('<opml version="2.0">');
    expect(xml).toContain('<body>');
    expect(xml).toContain('outlinerId');

    const parsed = parseOpmlToRawOutline(xml);

    expect(parsed.id).toBe(original.id);
    expect(parsed.version).toBe(original.version);
    // OPML `created` values are RFC822 dates (second-level precision).
    expect(parsed.created).toBe(Math.floor(original.created / 1000) * 1000);
    expect(parsed.name).toBe(original.name);

    expect(parsed.tree.children.map(n => ({ id: n.id, collapsed: n.collapsed }))).toEqual(
      original.tree.children.map(n => ({ id: n.id, collapsed: n.collapsed }))
    );

    const parsedA = parsed.contentNodes[original.tree.children[0].id] as unknown as ContentNode;
    expect(parsedA.content).toBe('Hello\n**world**');
    expect(parsedA.created).toBe(Math.floor(original.contentNodes[parsedA.id].created / 1000) * 1000);
    expect(parsedA.archived).toBe(true);
    expect(parsedA.archiveDate).toBe(1700000000000);
    expect(parsedA.task).toBe(true);
    expect(parsedA.completionDate).toBe(1700000001111);

    const parsedB = parsed.contentNodes[original.tree.children[1].id] as unknown as ContentNode;
    expect(parsedB.content).toBe('Second');
    expect(parsedB.created).toBe(Math.floor(original.contentNodes[parsedB.id].created / 1000) * 1000);
    expect(parsedB.deleted).toBe(true);
    expect(parsedB.deletedDate).toBe(1700000002222);
    expect(parsedB.lastUpdated).toBe(1700000003333);
  });
});


