/**
 * Default logic source and the "what to commit on Apply & Compile" rule,
 * shared by the legacy LogicEditor and the design-v2 footer.
 */
export const DEFAULT_LOGIC_BOILERPLATE = `// Write your contract logic here.

class ContractLogic extends TemplateLogic<any> {

  async init(data: any) {
    return {
      state: {
        $identifier: 'contract-state',
      },
    };
  }

  async trigger(data: any, request: any, state: any) {
    return {
      result: {
        $class: 'org.example.Response',
        $timestamp: new Date(),
      },
      state: {
        ...state,
      },
    };
  }
}

export default ContractLogic;
`;

/**
 * Source to commit on "Apply & Compile": the editor content, or the boilerplate
 * when both the editor and the committed logic are empty.
 */
export const nextLogicSource = (editorLogicTs: string, logicTs: string): string =>
  editorLogicTs.trim() === '' && logicTs.trim() === '' ? DEFAULT_LOGIC_BOILERPLATE : editorLogicTs;
