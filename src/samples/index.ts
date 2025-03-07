import * as playground from "@samples/playground";
import * as helloworld from "@samples/helloworld";
import * as formulanow from "@samples/formulanow";
import * as join from "@samples/join";
import * as clause from "@samples/clause";
import * as list from "@samples/list";
import * as optional from "@samples/optional";
import * as markdown from "@samples/markdown";
import * as formula from "@samples/formula";
import * as clausecondition from "@samples/clausecondition";
import * as invitation from "@samples/invitation";
import * as announcement from "@samples/announcement";
import * as blank from "@samples/blank";

export type Sample = {
  NAME: string;
  MODEL: string;
  TEMPLATE: string;
  DATA: object;
};

export const SAMPLES: Array<Sample> = [
  playground,
  helloworld,
  formula,
  formulanow,
  join,
  clause,
  clausecondition,
  invitation,
  announcement,
  blank,
  list,
  optional,
  markdown,
];
