const MODEL = `namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
}`;

const TEMPLATE = `> The one, the only...

### Hello {{name}}!
`;

const DATA = {
    "$class" : "hello@1.0.0.HelloWorld",
    "name": "John Doe"
};

const NAME = 'Hello World';
// --- BEGIN VC-SIGNED BLOCK (generated) ---
const HASH = '16f60e198a0f0e3baf05d06ee73c7562af6e48c9611a732b96cef79b6f553062';
const VC = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://w3id.org/security/data-integrity/v2"
  ],
  "type": [
    "VerifiableCredential",
    "TemplateAuthorshipCredential"
  ],
  "issuer": "did:key:z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW",
  "validFrom": "2026-05-28T14:34:56.411Z",
  "credentialSubject": {
    "id": "ap-template:hello-world",
    "templateHash": "16f60e198a0f0e3baf05d06ee73c7562af6e48c9611a732b96cef79b6f553062",
    "templateName": "Hello World"
  },
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2026-05-28T14:34:56.411Z",
    "verificationMethod": "did:key:z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW#z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW",
    "proofPurpose": "assertionMethod",
    "proofValue": "z4kTMLfxvirxsDNVNu6FxYiKU826PeYKoex8LekxgRshXgj9BwYbbGmz2YbiMCwR7Dfx68dxC1h4uavsotkS52Wan"
  }
};

export { NAME, MODEL, DATA, TEMPLATE, HASH, VC };
// --- END VC-SIGNED BLOCK (generated) ---
