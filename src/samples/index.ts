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

export type Sample = {
  NAME: string;
  MODEL: string;
  TEMPLATE: string;
  DATA: object;
};

export const SAMPLES: Array<Sample> = [
  playground,
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
