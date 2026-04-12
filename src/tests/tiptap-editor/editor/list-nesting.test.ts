/**
 * List nesting tests.
 *
 * Validates that ListBlockDefinition renders without nested ul/ol elements.
 * This was a bug where StarterKit's bulletList/orderedList wrapped listItems
 * inside our custom ListBlockExtension, causing double-nesting:
 *   <ul data-type="listBlock"><ul><li>...</li></ul></ul>
 *
 * The fix disables StarterKit's bulletList/orderedList extensions.
 */
import { describe, it, expect } from 'vitest';
import { createTestEditor } from '../helpers/createTestEditor';
import { DOMSerializer } from 'prosemirror-model';
import type { TemplateMarkDocument } from '../../../tiptap-editor/types/TemplateMark';

/** Template with a ListBlockDefinition containing items. */
const listBlockTemplate: TemplateMarkDocument = {
  $class: 'org.accordproject.templatemark@0.5.0.ContractDefinition',
  name: 'listTest',
  nodes: [
    {
      $class: 'org.accordproject.templatemark@0.5.0.ListBlockDefinition',
      name: 'items',
      elementType: 'org.example@1.0.0.ListItem',
      listType: 'bullet',
      tight: true,
      start: 1,
      nodes: [
        {
          $class: 'org.accordproject.commonmark@0.5.0.Item',
          nodes: [
            {
              $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
              nodes: [
                { $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'First item' },
              ],
            },
          ],
        },
        {
          $class: 'org.accordproject.commonmark@0.5.0.Item',
          nodes: [
            {
              $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
              nodes: [
                { $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'Second item' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/** Template with a ListBlockDefinition inside a ClauseDefinition. */
const clauseWithListTemplate: TemplateMarkDocument = {
  $class: 'org.accordproject.templatemark@0.5.0.ContractDefinition',
  name: 'clauseListTest',
  nodes: [
    {
      $class: 'org.accordproject.templatemark@0.5.0.ClauseDefinition',
      name: 'myClause',
      nodes: [
        {
          $class: 'org.accordproject.templatemark@0.5.0.ListBlockDefinition',
          name: 'services',
          elementType: 'org.example@1.0.0.ServiceItem',
          listType: 'bullet',
          tight: true,
          start: 1,
          nodes: [
            {
              $class: 'org.accordproject.commonmark@0.5.0.Item',
              nodes: [
                {
                  $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
                  nodes: [
                    { $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'Service A' },
                  ],
                },
              ],
            },
            {
              $class: 'org.accordproject.commonmark@0.5.0.Item',
              nodes: [
                {
                  $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
                  nodes: [
                    { $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'Service B' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Helper to serialize editor content to HTML string.
 */
function getEditorHTML(editor: ReturnType<typeof createTestEditor>): string {
  const { state } = editor;
  const serializer = DOMSerializer.fromSchema(state.schema);
  const fragment = serializer.serializeFragment(state.doc.content);
  const div = document.createElement('div');
  div.appendChild(fragment);
  return div.innerHTML;
}

describe('list nesting', () => {
  describe('ListBlockDefinition without clause', () => {
    it('renders listBlock with listItem children, no nested ul', () => {
      const editor = createTestEditor(listBlockTemplate);
      const html = getEditorHTML(editor);

      // Should have ul with data-type="listBlock"
      expect(html).toContain('data-type="listBlock"');

      // Should have li elements
      expect(html).toContain('<li>');

      // Should NOT have nested ul>ul pattern (the bug we're fixing)
      const nestedUlPattern = /<ul[^>]*data-type="listBlock"[^>]*>\s*<ul>/;
      expect(nestedUlPattern.test(html)).toBe(false);

      // Count ul elements - should be exactly 1
      const ulMatches = html.match(/<ul/g) || [];
      expect(ulMatches.length).toBe(1);

      editor.destroy();
    });

    it('listItem nodes are direct children of listBlock in schema', () => {
      const editor = createTestEditor(listBlockTemplate);
      let listBlockNode: ReturnType<typeof editor.state.doc.nodeAt> = null;

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'listBlock') {
          listBlockNode = editor.state.doc.nodeAt(pos);
          return false;
        }
      });

      expect(listBlockNode).not.toBeNull();
      expect(listBlockNode!.childCount).toBe(2);

      // First child should be a listItem, not a bulletList
      const firstChild = listBlockNode!.child(0);
      expect(firstChild.type.name).toBe('listItem');

      editor.destroy();
    });
  });

  describe('ListBlockDefinition inside ClauseDefinition', () => {
    it('renders without nested ul elements', () => {
      const editor = createTestEditor(clauseWithListTemplate);
      const html = getEditorHTML(editor);

      // Should have the clause wrapper
      expect(html).toContain('data-type="clause"');

      // Should have ul with data-type="listBlock"
      expect(html).toContain('data-type="listBlock"');

      // Should NOT have nested ul>ul inside the clause
      const nestedPattern = /<ul[^>]*>\s*<ul/;
      expect(nestedPattern.test(html)).toBe(false);

      // Count ul elements - should be exactly 1 (the listBlock)
      const ulMatches = html.match(/<ul/g) || [];
      expect(ulMatches.length).toBe(1);

      editor.destroy();
    });

    it('listItems inside clause listBlock have consistent structure', () => {
      const editor = createTestEditor(clauseWithListTemplate);
      let itemCount = 0;
      let itemsInsideListBlock = 0;

      editor.state.doc.descendants((node, _pos, parent) => {
        if (node.type.name === 'listItem') {
          itemCount++;
          if (parent?.type.name === 'listBlock') {
            itemsInsideListBlock++;
          }
        }
      });

      expect(itemCount).toBe(2);
      expect(itemsInsideListBlock).toBe(2); // All items should be direct children of listBlock

      editor.destroy();
    });
  });

  describe('bullet symbol consistency', () => {
    it('listBlock uses disc bullets (not circle or square from nesting)', () => {
      const editor = createTestEditor(clauseWithListTemplate);

      // The key indicator of the bug was that nested ul elements
      // cause browsers to use different bullet styles (disc → circle → square).
      // With the fix, there's only one ul level so bullets stay consistent.

      // Verify structure: listBlock > listItem (not listBlock > bulletList > listItem)
      const listBlockChildTypes: string[] = [];
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'listBlock') {
          for (let i = 0; i < node.childCount; i++) {
            listBlockChildTypes.push(node.child(i).type.name);
          }
          return false;
        }
      });

      // All children of listBlock should be listItem
      expect(listBlockChildTypes.every((t) => t === 'listItem')).toBe(true);
      expect(listBlockChildTypes.length).toBe(2);

      editor.destroy();
    });
  });

  describe('CommonMark List conversion', () => {
    /** Template with a CommonMark List (not ListBlockDefinition). */
    const commonMarkListTemplate: TemplateMarkDocument = {
      $class: 'org.accordproject.templatemark@0.5.0.ContractDefinition',
      name: 'commonMarkListTest',
      nodes: [
        {
          $class: 'org.accordproject.commonmark@0.5.0.List',
          type: 'bullet',
          tight: true,
          nodes: [
            {
              $class: 'org.accordproject.commonmark@0.5.0.Item',
              nodes: [
                {
                  $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
                  nodes: [
                    { $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'Item one' },
                  ],
                },
              ],
            },
            {
              $class: 'org.accordproject.commonmark@0.5.0.Item',
              nodes: [
                {
                  $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
                  nodes: [
                    { $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'Item two' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    /** Template with an ordered CommonMark List. */
    const orderedListTemplate: TemplateMarkDocument = {
      $class: 'org.accordproject.templatemark@0.5.0.ContractDefinition',
      name: 'orderedListTest',
      nodes: [
        {
          $class: 'org.accordproject.commonmark@0.5.0.List',
          type: 'ordered',
          tight: true,
          start: 1,
          nodes: [
            {
              $class: 'org.accordproject.commonmark@0.5.0.Item',
              nodes: [
                {
                  $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
                  nodes: [
                    { $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'First' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    it('CommonMark bullet List converts to listBlock (not bulletList)', () => {
      const editor = createTestEditor(commonMarkListTemplate);

      // Should NOT throw "Unknown node type: bulletList"
      expect(editor.isDestroyed).toBe(false);

      // Verify the node type is listBlock
      let hasListBlock = false;
      let hasBulletList = false;
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'listBlock') hasListBlock = true;
        if (node.type.name === 'bulletList') hasBulletList = true;
      });

      expect(hasListBlock).toBe(true);
      expect(hasBulletList).toBe(false);

      editor.destroy();
    });

    it('CommonMark ordered List converts to listBlock (not orderedList)', () => {
      const editor = createTestEditor(orderedListTemplate);

      // Should NOT throw "Unknown node type: orderedList"
      expect(editor.isDestroyed).toBe(false);

      // Verify the node type is listBlock with listType='ordered'
      let foundListBlock = false;
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'listBlock') {
          expect(node.attrs.listType).toBe('ordered');
          foundListBlock = true;
          return false;
        }
      });

      expect(foundListBlock).toBe(true);

      editor.destroy();
    });

    it('CommonMark List renders without nested ul elements', () => {
      const editor = createTestEditor(commonMarkListTemplate);
      const html = getEditorHTML(editor);

      // Count ul elements - should be exactly 1
      const ulMatches = html.match(/<ul/g) || [];
      expect(ulMatches.length).toBe(1);

      // Should NOT have nested ul>ul
      const nestedPattern = /<ul[^>]*>\s*<ul/;
      expect(nestedPattern.test(html)).toBe(false);

      editor.destroy();
    });
  });
});
