import React, { useState, useEffect } from 'react';
import { Modal, Button, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import html2pdfLib from 'html2pdf.js';
import useAppStore from '../store/store';

// Define the options interface for html2pdf
interface Html2PdfOptions {
  margin: [number, number, number, number];
  filename: string;
  image: { type: 'jpeg'; quality: number };
  html2canvas: {
    scale: number;
    useCORS: boolean;
    logging: boolean;
    allowTaint: boolean;
    scrollX: number;
    scrollY: number;
    windowWidth: number;
    windowHeight: number;
  };
  jsPDF: {
    unit: 'in';
    format: 'letter';
    orientation: 'portrait';
    compress: boolean;
  };
}

// Define the Html2Pdf instance interface
interface Html2PdfInstance {
  set(options: Html2PdfOptions): Html2PdfInstance;
  from(element: HTMLElement): Html2PdfInstance;
  toPdf(): Html2PdfInstance;
  output(type: 'blob'): Promise<Blob>;
}

// Type the html2pdfLib function
const html2pdf = html2pdfLib as unknown as (() => Html2PdfInstance);

const PDFPreview: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);

  const generatePDF = async (): Promise<void> => {
    try {
      // Create a container for the content
      const element = document.createElement('div');
      element.innerHTML = agreementHtml || '<p>No content available</p>'; // Fallback for empty content
      
      // Add styling to the container
      element.style.color = textColor;
      element.style.backgroundColor = backgroundColor;
      element.style.padding = '40px';
      element.style.border = '2px solid #000000'; // Added border for PDF
      element.style.borderRadius = '8px';
      element.style.width = '100%';
      element.style.maxWidth = '800px';
      element.style.margin = '0 auto';
      element.style.boxSizing = 'border-box';
      element.style.fontFamily = 'Arial, sans-serif';

      // Ensure images are loaded
      const images = element.getElementsByTagName('img');
      await Promise.all(
        Array.from(images).map(
          (img: HTMLImageElement) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => {
                  console.warn('Image failed to load:', img.src);
                  resolve();
                };
              }
            })
        )
      );

      const opt: Html2PdfOptions = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: 'template-preview.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 816,
          windowHeight: 1056,
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait',
          compress: true,
        },
      };

      // Create temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '816px';
      document.body.appendChild(container);
      container.appendChild(element);

      // Wait for content to render
      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      const pdfBlob = await html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .output('blob');

      if (pdfBlob) {
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setIsModalOpen(true);
      } else {
        throw new Error('PDF generation resulted in empty file');
      }

      // Cleanup
      document.body.removeChild(container);
    } catch (error) {
      console.error('PDF generation error:', error);
      if (!pdfUrl) {
        void message.error('Failed to generate PDF preview. Please try again.');
      }
    }
  };

  // Cleanup URL on component unmount or when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <>
      <Button
        icon={<FilePdfOutlined />}
        onClick={() => void generatePDF()}
        style={{ 
          margin: '5px',
          backgroundColor: '#19c6c7',
          borderColor: '#19c6c7',
          color: '#fff',
        }}
      >
        Preview PDF
      </Button>

      <Modal
        title="PDF Preview"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }
        }}
        width={900}
        footer={null}
        style={{ top: 20 }}
      >
        {pdfUrl && (
          <div style={{ 
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: '#fff',
          }}>
            <iframe
              src={pdfUrl}
              style={{ 
                width: '100%', 
                height: '70vh', 
                border: 'none',
              }}
              title="PDF Preview"
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default PDFPreview;