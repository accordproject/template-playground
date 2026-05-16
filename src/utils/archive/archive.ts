import JSZip from 'jszip';

export interface TemplateArchive {
  name: string;
  model: string;
  template: string;
  data: string;
}

/**
 * Creates a CTA (Cicero Template Archive) file.
 * Mirrors the file structure used by TemplateSaver in cicero-core:
 * https://github.com/accordproject/template-archive/blob/main/packages/cicero-core/src/templatesaver.js
 */
export const createArchive = async (
  name: string,
  model: string,
  template: string,
  data: string
): Promise<Blob> => {
  const zip = new JSZip();

  const packageJson = {
    name: name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    description: `Template: ${name}`,
    accordproject: {
      template: 'clause',
      runtime: 'es6',
      cicero: '^0.24.0'
    }
  };

  zip.file('package.json', JSON.stringify(packageJson, null, 2));
  zip.file('model/model.cto', model);
  zip.file('text/grammar.tem.md', template);
  zip.file('text/sample.md', data);

  return await zip.generateAsync({ type: 'blob' });
};

/**
 * Extracts template data from a CTA archive.
 * Mirrors the file structure used by TemplateLoader in cicero-core:
 * https://github.com/accordproject/template-archive/blob/main/packages/cicero-core/src/templateloader.js
 */
export const extractArchive = async (file: File): Promise<TemplateArchive> => {
  const zip = await JSZip.loadAsync(file);

  const modelFiles = zip.file(/model[/\\].*\.cto$/);
  if (!modelFiles || modelFiles.length === 0) throw new Error('Archive missing model .cto file');
  const model = await modelFiles[0].async('string');

  const templateFile = zip.file('text/grammar.tem.md');
  if (!templateFile) throw new Error('Archive missing text/grammar.tem.md');
  const template = await templateFile.async('string');

  let data = '';
  const sampleMd = zip.file('text/sample.md');
  if (sampleMd) {
    data = await sampleMd.async('string');
  }

  const packageFile = zip.file('package.json');
  let name = 'Imported Template';
  if (packageFile) {
    try {
      const pkg = JSON.parse(await packageFile.async('string')) as { name?: string; description?: string };
      const description = typeof pkg.description === 'string' ? pkg.description.trim() : '';
      const pkgName = typeof pkg.name === 'string' ? pkg.name.trim() : '';
      const prefix = 'Template: ';
      if (description && description.startsWith(prefix)) {
        name = description.slice(prefix.length).trim() || pkgName || name;
      } else if (description) {
        name = description;
      } else if (pkgName) {
        name = pkgName;
      }
    } catch {
      // Use default name
    }
  }

  return { name, model, template, data };
};

/**
 * Triggers browser download of a blob.
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
