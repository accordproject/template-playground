import React from 'react';
import { Form, Input, Select } from 'antd';
import useAppStore from '../../store/store';

const { TextArea } = Input;
const { Option } = Select;

interface TemplateMetadata {
  author: string;
  displayName: string;
  version: string;
  description: string;
  license: string;
  keywords: string[];
  metadata: {
    runtime: string;
    template: string;
    cicero: string;
  };
}

function TemplateMetadata() {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const templateMetadata = useAppStore((state) => state.templateMetadata);
  const setTemplateMetadata = useAppStore((state) => state.setTemplateMetadata);

  const handleMetadataChange = (field: keyof TemplateMetadata, value: any) => {
    setTemplateMetadata({
      ...templateMetadata,
      [field]: value
    });
  };

  const handleMetadataPropertyChange = (field: keyof TemplateMetadata['metadata'], value: string) => {
    setTemplateMetadata({
      ...templateMetadata,
      metadata: {
        ...templateMetadata.metadata,
        [field]: value
      }
    });
  };

  const handleKeywordChange = (keywords: string[]) => {
    setTemplateMetadata({
      ...templateMetadata,
      keywords
    });
  };

  return (
    <div className="column" style={{ backgroundColor, padding: '16px' }}>
      <h3 style={{ color: textColor, marginBottom: '16px' }}>Template Metadata</h3>
      <p style={{ color: textColor, marginBottom: '16px' }}>
        Configure template properties and metadata for API upload.
      </p>
      
      <Form layout="vertical" style={{ color: textColor }}>
        <Form.Item label="Author" style={{ color: textColor }}>
          <Input
            value={templateMetadata.author}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetadataChange('author', e.target.value)}
            placeholder="Template author"
            style={{ backgroundColor, color: textColor, borderColor: '#d9d9d9' }}
          />
        </Form.Item>

        <Form.Item label="Display Name" style={{ color: textColor }}>
          <Input
            value={templateMetadata.displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetadataChange('displayName', e.target.value)}
            placeholder="Template display name"
            style={{ backgroundColor, color: textColor, borderColor: '#d9d9d9' }}
          />
        </Form.Item>

        <Form.Item label="Version" style={{ color: textColor }}>
          <Input
            value={templateMetadata.version}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetadataChange('version', e.target.value)}
            placeholder="1.0.0"
            style={{ backgroundColor, color: textColor, borderColor: '#d9d9d9' }}
          />
        </Form.Item>

        <Form.Item label="Description" style={{ color: textColor }}>
          <TextArea
            value={templateMetadata.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleMetadataChange('description', e.target.value)}
            placeholder="Template description"
            rows={3}
            style={{ backgroundColor, color: textColor, borderColor: '#d9d9d9' }}
          />
        </Form.Item>

        <Form.Item label="License" style={{ color: textColor }}>
          <Select
            value={templateMetadata.license}
            onChange={(value: string) => handleMetadataChange('license', value)}
            placeholder="Select license"
            style={{ backgroundColor, color: textColor }}
          >
            <Option value="Apache-2">Apache-2</Option>
            <Option value="MIT">MIT</Option>
            <Option value="GPL-3.0">GPL-3.0</Option>
            <Option value="BSD-3-Clause">BSD-3-Clause</Option>
            <Option value="ISC">ISC</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Keywords" style={{ color: textColor }}>
          <Select
            mode="tags"
            value={templateMetadata.keywords}
            onChange={handleKeywordChange}
            placeholder="Add keywords"
            style={{ backgroundColor, color: textColor }}
          />
        </Form.Item>

        <h4 style={{ color: textColor, marginTop: '24px', marginBottom: '16px' }}>Runtime Metadata</h4>
        
        <Form.Item label="Runtime" style={{ color: textColor }}>
          <Select
            value={templateMetadata.metadata.runtime}
            onChange={(value: string) => handleMetadataPropertyChange('runtime', value)}
            placeholder="Select runtime"
            style={{ backgroundColor, color: textColor }}
          >
            <Option value="typescript">TypeScript</Option>
            <Option value="javascript">JavaScript</Option>
            <Option value="es2015">ES2015</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Template Type" style={{ color: textColor }}>
          <Select
            value={templateMetadata.metadata.template}
            onChange={(value: string) => handleMetadataPropertyChange('template', value)}
            placeholder="Select template type"
            style={{ backgroundColor, color: textColor }}
          >
            <Option value="clause">Clause</Option>
            <Option value="contract">Contract</Option>
            <Option value="template">Template</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Cicero Version" style={{ color: textColor }}>
          <Input
            value={templateMetadata.metadata.cicero}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMetadataPropertyChange('cicero', e.target.value)}
            placeholder="0.25.x"
            style={{ backgroundColor, color: textColor, borderColor: '#d9d9d9' }}
          />
        </Form.Item>
      </Form>
    </div>
  );
}

export default TemplateMetadata; 