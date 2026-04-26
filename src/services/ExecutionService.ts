import { TemplateArchiveProcessor } from '@accordproject/template-engine';
import { Template } from '@accordproject/cicero-core';
import { Buffer } from 'buffer';

// Fix Buffer for browser
(window as any).Buffer = Buffer;

// 🔥 GLOBAL PATCH TO BLOCK AXIOS
import * as ModelManagerModule from '@accordproject/concerto-core';
(ModelManagerModule as any).ModelManager.prototype.updateExternalModels = async function () {
  console.log('⚠️ Skipping external model fetch (offline mode)');
};

export class ExecutionService {
  private processor: TemplateArchiveProcessor | null = null;

  async test(): Promise<void> {
    try {
      console.log('ExecutionService loaded successfully');

      // 1. Fetch the CTA file from the public folder (WITH CACHE BUSTER!)
      const res = await fetch('/sample.cta?v=' + Date.now());
      if (!res.ok) throw new Error('Failed to fetch sample.cta. Make sure it is in the public folder!');

      const arrayBuffer = await res.arrayBuffer();
      const fileHeader = new TextDecoder().decode(arrayBuffer.slice(0, 15));
      console.log('🔍 First 15 characters of file:', fileHeader);

      const buffer = Buffer.from(arrayBuffer);

      // 2. Load the template
      const template = await Template.fromArchive(buffer, { offline: true });
      console.log('✅ Template loaded:', template.getIdentifier());

      // 3. Initialize the Processor
      this.processor = new TemplateArchiveProcessor(template);
      console.log('✅ Processor initialized');

      // 4. Contract Data (from the documentation you pasted)
      const contractData = {
        "$class": "org.accordproject.acceptanceofdelivery.AcceptanceOfDeliveryClause",
        "clauseId": "0a378f5d-9f02-4b03-80ae-df89c4f7300f",
        "shipper": "Party A",
        "receiver": "Party B",
        "deliverable": "Widgets",
        "businessDays": 10,
        "attachment": "Attachment X"
      };

      // 5. Request Data (Simulating a passed inspection)
      const request = {
        "$class": "org.accordproject.acceptanceofdelivery.InspectDeliverable",
        "deliverableReceivedAt": new Date().toISOString(),
        "inspectionPassed": true,
        "transactionId": "dfe801d0-ff3e-11e9-b361-efc0ae54bdd6",
        "timestamp": new Date().toISOString()
      };

      // 6. Current State Data
      const state = {
        "$class": "org.accordproject.cicero.contract.AccordContractState",
        "stateId": "dfe8c520-ff3e-11e9-b361-efc0ae54bdd6"
      };

      console.log('🚀 Triggering contract logic...');

      // 7. EXECUTE!
      const result = await this.processor.trigger(contractData, request, state);

      // 8. Output the results
      console.log('🎉 EXECUTION SUCCESS! Here is the result:');
      console.log('👉 Response:', result.response);
      console.log('👉 New State:', result.state);

    } catch (err) {
      console.error('❌ Execution Error:', err);
    }
  }
}