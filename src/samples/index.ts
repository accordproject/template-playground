import * as playground from "./playground";
import * as helloworld from "./helloworld";
import * as formulanow from "./formulanow";
import * as join from "./join";
import * as clause from "./clause";
import * as list from "./list";
import * as optional from "./optional";
import * as markdown from "./markdown";
import * as formula from "./formula";
import * as clausecondition from "./clausecondition";
import * as invitation from "./invitation";
import * as announcement from "./announcement";
import * as blank from "./blank";
import * as paymentReceipt from './paymentReceipt';
import * as employmentOffer from "./employmentOffer";
import * as nda from "./nda";
import * as counterLogic from "./counterLogic";

export type Sample = {
  NAME: string;
  MODEL: string;
  TEMPLATE: string;
  DATA: object;
  /** Optional TypeScript logic string. When present, the Logic Editor and Contract Runner panels are activated. */
  LOGIC?: string;
  /** Default request JSON shown in the Contract Runner request editor (only used when LOGIC is set). */
  DEFAULT_REQUEST?: string;
};

export const SAMPLES: Array<Sample> = [
  playground,
  counterLogic,   // Logic sample — listed near the top to showcase the new feature
  helloworld,
  employmentOffer,
  formula,
  formulanow,
  join,
  nda,
  clause,
  clausecondition,
  invitation,
  announcement,
  blank,
  list,
  optional,
  markdown,
  paymentReceipt
];
