import JSZip from 'jszip';

export interface TemplateArchive {
  name: string;
  model: string;
  template: string;
  data: string;
}

/**
 * Creates a CTA (Contract Template Archive) from template data
 */
export const createArchive = async (
  name: string,
  model: string,
  template: string,
  data: string
): Promise<Blob> => {
  const zip = new JSZip();

  // Create package.json
  const packageJson = {
    name: name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: `Template: ${name}`,
    accordproject: {
      template: 'clause',
      runtime: 'es6'
    }
  };

  // Add files to archive
  zip.file('package.json', JSON.stringify(packageJson, null, 2));
  zip.file('model/model.cto', model);
  zip.file('text/grammar.tem.md', template);
  zip.file('sample.json', data);

  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Extracts template data from a CTA archive
 */
export const extractArchive = async (file: File): Promise<TemplateArchive> => {
  const zip = await JSZip.loadAsync(file);

  // Extract model
  const modelFile = zip.file('model/model.cto');
  if (!modelFile) throw new Error('Archive missing model/model.cto');
  const model = await modelFile.async('string');

  // Extract template
  const templateFile = zip.file('text/grammar.tem.md');
  if (!templateFile) throw new Error('Archive missing text/grammar.tem.md');
  const template = await templateFile.async('string');

  // Extract sample data
  const dataFile = zip.file('sample.json');
  if (!dataFile) throw new Error('Archive missing sample.json');
  const data = await dataFile.async('string');

  // Extract name from package.json
  const packageFile = zip.file('package.json');
  let name = 'Imported Template';
  if (packageFile) {
    try {
      const pkg = JSON.parse(await packageFile.async('string'));
      name = pkg.name || pkg.description || name;
    } catch {
      // Use default name
    }
  }

  return { name, model, template, data };
};

/**
 * Triggers browser download of a blob
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
