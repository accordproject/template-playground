import React, { useCallback } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import useAppStore from '../store/store';

const { Dragger } = Upload;

const FileUpload: React.FC = () => {
  const { setTemplateMarkdown, setModelCto, setData } = useAppStore();

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      
      // Determine file type based on extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      switch (fileExtension) {
        case 'md':
          await setTemplateMarkdown(content);
          message.success('Template file loaded successfully');
          break;
        case 'cto':
          await setModelCto(content);
          message.success('Model file loaded successfully');
          break;
        case 'json':
          await setData(content);
          message.success('Data file loaded successfully');
          break;
        default:
          message.error('Unsupported file type. Please upload .md, .cto, or .json files');
      }
    } catch (error) {
      message.error('Failed to read file');
      console.error('File upload error:', error);
    }
  }, [setTemplateMarkdown, setModelCto, setData]);

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.md,.cto,.json',
    beforeUpload: (file: File) => {
      handleFileUpload(file);
      return false; // Prevent default upload behavior
    },
  };

  return (
    <Dragger {...uploadProps}>
      <p className="ant-upload-drag-icon">
        <UploadOutlined />
      </p>
      <p className="ant-upload-text">Click or drag file to upload</p>
      <p className="ant-upload-hint">
        Support for .md (Template), .cto (Model), or .json (Data) files
      </p>
    </Dragger>
  );
};

export default FileUpload; 