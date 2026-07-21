export type Sample = {
  NAME: string;
  MODEL: string;
  TEMPLATE: string;
  DATA: object;
  /** Optional TypeScript logic string. When present, the Logic Editor and Contract Runner panels are activated. */
  LOGIC?: string;
  /** Default request JSON shown in the Contract Runner request editor (only used when LOGIC is set). */
  REQUEST?: object;
};

export { NAME, MODEL, TEMPLATE, DATA, LOGIC, REQUEST } from "./counterLogic";
