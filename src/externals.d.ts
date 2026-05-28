/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
declare module '@accordproject/markdown-common'
declare module '@accordproject/markdown-template'
declare module '@accordproject/markdown-transform'

declare module 'vc-signer' {
  export function verifyCredential(
    credential: object,
    options?: {
      expectedSubject?: Record<string, unknown>;
      fetcher?: (url: string) => Promise<Response>;
    },
  ): Promise<{
    verified: true;
    issuer: string;
    verificationMethodId: string;
    subject: Record<string, unknown>;
  }>;

  export function signCredential(opts: {
    type: string[];
    context?: string[];
    id?: string;
    subject: object | object[];
    validFrom?: string;
    validUntil?: string;
    proofPurpose?: string;
    signer: {
      keyInfo: { algo: string; privateJwk: object; publicJwk: object; keyObject?: unknown };
      issuerDid?: string;
      verificationMethodId?: string;
    };
  }): Promise<Record<string, unknown>>;

  export function deriveDidKey(publicJwk: object): {
    did: string;
    verificationMethodId: string;
  };

  export function resolveIssuerKey(
    issuerDid: string,
    verificationMethodId: string,
    options?: { fetcher?: (url: string) => Promise<Response> },
  ): Promise<{ publicJwk: object; algo: string }>;
}