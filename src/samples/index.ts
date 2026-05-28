import canonicalize from "canonicalize";
import { verifyCredential } from "vc-signer";

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
import * as paymentReceipt from "./paymentReceipt";
import * as employmentOffer from "./employmentOffer";
import * as nda from "./nda";

export type Sample = {
  NAME: string;
  MODEL: string;
  TEMPLATE: string;
  DATA: object;
  isVerified: boolean;
};

type SignedSampleModule = {
  NAME: string;
  MODEL: string;
  TEMPLATE: string;
  DATA: object;
  HASH?: string;
  VC?: object;
};

const SIGNED_SAMPLES: ReadonlyArray<SignedSampleModule> = [
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
  paymentReceipt,
] as ReadonlyArray<SignedSampleModule>;

async function canonicalContentHash(s: SignedSampleModule): Promise<string> {
  const jcs = canonicalize({
    name: s.NAME,
    model: s.MODEL,
    template: s.TEMPLATE,
    data: s.DATA,
  });
  if (typeof jcs !== "string") {
    throw new Error("canonicalize returned non-string");
  }
  const bytes = new TextEncoder().encode(jcs);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifySample(s: SignedSampleModule): Promise<Sample> {
  const base: Sample = {
    NAME: s.NAME,
    MODEL: s.MODEL,
    TEMPLATE: s.TEMPLATE,
    DATA: s.DATA,
    isVerified: false,
  };
  if (!s.HASH || !s.VC) return base;
  try {
    const recomputed = await canonicalContentHash(s);
    if (recomputed !== s.HASH) return base;
    await verifyCredential(s.VC, {
      expectedSubject: { templateHash: s.HASH },
    });
    return { ...base, isVerified: true };
  } catch {
    return base;
  }
}

export async function loadSamples(): Promise<Sample[]> {
  return Promise.all(SIGNED_SAMPLES.map(verifySample));
}
