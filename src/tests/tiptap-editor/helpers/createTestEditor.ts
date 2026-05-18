import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { Plugin } from 'prosemirror-state';

import { VariableExtension } from '../../../tiptap-editor/extensions/VariableExtension';
import { FormattedVariableExtension } from '../../../tiptap-editor/extensions/FormattedVariableExtension';
import { EnumVariableExtension } from '../../../tiptap-editor/extensions/EnumVariableExtension';
import { FormulaExtension } from '../../../tiptap-editor/extensions/FormulaExtension';
import { ConditionalExtension } from '../../../tiptap-editor/extensions/ConditionalExtension';
import { OptionalExtension } from '../../../tiptap-editor/extensions/OptionalExtension';
import { WithExtension } from '../../../tiptap-editor/extensions/WithExtension';
import { ListBlockExtension } from '../../../tiptap-editor/extensions/ListBlockExtension';
import { ListItemExtension } from '../../../tiptap-editor/extensions/ListItemExtension';
import { ForeachExtension } from '../../../tiptap-editor/extensions/ForeachExtension';
import { JoinExtension } from '../../../tiptap-editor/extensions/JoinExtension';
import { ImageExtension } from '../../../tiptap-editor/extensions/ImageExtension';
import { ThematicBreakExtension } from '../../../tiptap-editor/extensions/ThematicBreakExtension';
import { ClauseExtension } from '../../../tiptap-editor/extensions/ClauseExtension';
import { ContractExtension } from '../../../tiptap-editor/extensions/ContractExtension';
import { WithBlockExtension } from '../../../tiptap-editor/extensions/WithBlockExtension';
import {
  ConditionalBlockExtension,
  ConditionalBranchTrueExtension,
  ConditionalBranchFalseExtension,
} from '../../../tiptap-editor/extensions/ConditionalBlockExtension';
import {
  OptionalBlockExtension,
  OptionalBranchSomeExtension,
  OptionalBranchNoneExtension,
} from '../../../tiptap-editor/extensions/OptionalBlockExtension';
import { createVariableSyncPlugin } from '../../../tiptap-editor/plugins/VariableSyncPlugin';
import { createFormulaDependencyPlugin } from '../../../tiptap-editor/plugins/FormulaDependencyPlugin';
import { templateMarkToTipTap } from '../../../tiptap-editor/serializer/TemplateMarkToTipTap';
import type { TemplateMarkDocument } from '../../../tiptap-editor/types/TemplateMark';

const BasePluginsExtension = Extension.create({
  name: 'testEditorPlugins',
  addProseMirrorPlugins(): Plugin[] {
    return [createVariableSyncPlugin(), createFormulaDependencyPlugin()];
  },
});

/** Create a headless TipTap Editor for testing (no DOM rendering). */
export function createTestEditor(doc?: TemplateMarkDocument): Editor {
  const content = doc
    ? templateMarkToTipTap(doc)
    : { type: 'doc', content: [{ type: 'paragraph' }] };

  return new Editor({
    extensions: [
      StarterKit.configure({ listItem: false }),
      VariableExtension,
      FormattedVariableExtension,
      EnumVariableExtension,
      FormulaExtension,
      ConditionalExtension,
      OptionalExtension,
      WithExtension,
      ListBlockExtension,
      ListItemExtension,
      ForeachExtension,
      JoinExtension,
      ImageExtension,
      ThematicBreakExtension,
      ClauseExtension,
      ContractExtension,
      WithBlockExtension,
      ConditionalBlockExtension,
      ConditionalBranchTrueExtension,
      ConditionalBranchFalseExtension,
      OptionalBlockExtension,
      OptionalBranchSomeExtension,
      OptionalBranchNoneExtension,
      BasePluginsExtension,
    ],
    content,
  });
}
