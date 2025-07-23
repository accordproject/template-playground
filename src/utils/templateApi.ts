import useAppStore from '../store/store';

export interface TemplateApiFormat {
  uri: string;
  author: string;
  displayName: string;
  version: string;
  description: string;
  license: string;
  keywords: string[];
  metadata: {
    $class: string;
    runtime: string;
    template: string;
    cicero: string;
  };
  logo: null;
  templateModel: {
    $class: string;
    typeName: string;
    model: {
      $class: string;
      ctoFiles: Array<{
        contents: string;
        filename: string;
      }>;
    };
  };
  text: {
    $class: string;
    templateText: string;
  };
  logic: string | null;
  sampleRequest: any | null;
}

export function formatTemplateForApi(): TemplateApiFormat {
  const store = useAppStore.getState();
  
  // Generate a unique URI with timestamp to prevent duplicates
  const timestamp = Date.now();
  const baseName = store.templateMetadata.displayName.toLowerCase().replace(/\s+/g, '-') || 'template';
  const uri = `resource:org.accordproject.protocol@1.0.0.Template#${baseName}-${timestamp}`;
  
  return {
    uri,
    author: store.templateMetadata.author,
    displayName: store.templateMetadata.displayName,
    version: store.templateMetadata.version,
    description: store.templateMetadata.description,
    license: store.templateMetadata.license,
    keywords: store.templateMetadata.keywords,
    metadata: {
      $class: "org.accordproject.protocol@1.0.0.TemplateMetadata",
      runtime: store.templateMetadata.metadata.runtime,
      template: store.templateMetadata.metadata.template,
      cicero: store.templateMetadata.metadata.cicero,
    },
    logo: null,
    templateModel: {
      $class: "org.accordproject.protocol@1.0.0.TemplateModel",
      typeName: store.templateMetadata.displayName.toLowerCase().replace(/\s+/g, '') || 'template',
      model: {
        $class: "org.accordproject.protocol@1.0.0.CtoModel",
        ctoFiles: [
          {
            contents: store.modelCto,
            filename: "model.cto"
          }
        ]
      }
    },
    text: {
      $class: "org.accordproject.protocol@1.0.0.Text",
      templateText: store.templateMarkdown
    },
    logic: store.templateLogic || null,
    sampleRequest: null
  };
}

export async function uploadTemplateToApi(apiUrl: string, template: TemplateApiFormat): Promise<Response> {
  // Use the proxy path if the API URL contains localhost and /api
  const baseUrl = apiUrl.includes('localhost') && apiUrl.includes('/api') ? '/api' : apiUrl;
  return fetch(`${baseUrl}/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(template),
  });
}

export async function createAgreementFromTemplate(apiUrl: string, templateId: string, data: any): Promise<Response> {
  // Use the proxy path if the API URL contains localhost and /api
  const baseUrl = apiUrl.includes('localhost') && apiUrl.includes('/api') ? '/api' : apiUrl;
  
  // Generate a unique URI for the agreement (avoiding duplication)
  const agreementUri = `resource:org.accordproject.protocol@1.0.0.Agreement#agreement-${Date.now()}`;
  
  // Construct the template URI from the template ID
  const templateUri = `resource:org.accordproject.protocol@1.0.0.Template#${templateId}`;
  
  return fetch(`${baseUrl}/agreements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uri: agreementUri,
      templateId,
      template: templateUri, // Use the template URI instead of template ID
      data,
      agreementStatus: 'DRAFT',
      agreementParties: [],
      signatures: [],
      metadata: {
        values: {} // Add the required values field
      }
    }),
  });
} 