import { useState } from 'react';
import { Button, Input, Modal, message, Space, Card, Typography } from 'antd';
import { UploadOutlined, CloudUploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { formatTemplateForApi, uploadTemplateToApi, createAgreementFromTemplate } from '../utils/templateApi';
import useAppStore from '../store/store';

const { TextArea } = Input;
const { Text } = Typography;

function ApiUpload() {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const templateMetadata = useAppStore((state) => state.templateMetadata);
  const data = useAppStore((state) => state.data);
  
  const [apiUrl, setApiUrl] = useState('http://localhost:5175/api');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedTemplateId, setUploadedTemplateId] = useState<string | null>(null);
  const [templateJson, setTemplateJson] = useState('');

  const handleUploadTemplate = async () => {
    if (!templateMetadata.displayName || !templateMetadata.author) {
      message.error('Please fill in the template metadata (Display Name and Author are required)');
      return;
    }

    setIsUploading(true);
    try {
      const template = formatTemplateForApi();
      setTemplateJson(JSON.stringify(template, null, 2));
      
      const response = await uploadTemplateToApi(apiUrl, template);
      
      if (response.ok) {
        const result = await response.json();
        setUploadedTemplateId(result.uri || result.id);
        message.success('Template uploaded successfully!');
        setIsModalVisible(true);
      } else {
        const errorText = await response.text();
        message.error(`Upload failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      message.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAgreement = async () => {
    if (!uploadedTemplateId) {
      message.error('No template uploaded yet');
      return;
    }

    setIsUploading(true);
    try {
      const agreementData = JSON.parse(data);
      const response = await createAgreementFromTemplate(apiUrl, uploadedTemplateId, agreementData);
      
      if (response.ok) {
        const result = await response.json();
        message.success('Agreement created successfully!');
        console.log('Created agreement:', result);
      } else {
        const errorText = await response.text();
        message.error(`Agreement creation failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      message.error(`Agreement creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = formatTemplateForApi();
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateMetadata.displayName || 'template'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ backgroundColor, padding: '16px' }}>
      <Card 
        title={
          <Space>
            <CloudUploadOutlined />
            <span style={{ color: textColor }}>API Upload</span>
          </Space>
        }
        style={{ backgroundColor, borderColor: '#d9d9d9' }}
        headStyle={{ color: textColor, backgroundColor }}
        bodyStyle={{ color: textColor, backgroundColor }}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text style={{ color: textColor }}>API Base URL:</Text>
          <Input
            value={apiUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3000"
            style={{ marginTop: '8px', backgroundColor, color: textColor, borderColor: '#d9d9d9' }}
          />
        </div>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleUploadTemplate}
            loading={isUploading}
            style={{ width: '100%' }}
          >
            Upload Template to API
          </Button>

          <Button
            icon={<FileTextOutlined />}
            onClick={handleDownloadTemplate}
            style={{ width: '100%' }}
          >
            Download Template JSON
          </Button>

          {uploadedTemplateId && (
            <Button
              type="default"
              onClick={handleCreateAgreement}
              loading={isUploading}
              style={{ width: '100%' }}
            >
              Create Agreement from Template
            </Button>
          )}
        </Space>

        {uploadedTemplateId && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px' }}>
            <Text strong style={{ color: '#52c41a' }}>
              Template uploaded successfully! ID: {uploadedTemplateId}
            </Text>
          </div>
        )}
      </Card>

      <Modal
        title="Template JSON Preview"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <TextArea
          value={templateJson}
          rows={20}
          readOnly
          style={{ fontFamily: 'monospace', fontSize: '12px' }}
        />
      </Modal>
    </div>
  );
}

export default ApiUpload; 