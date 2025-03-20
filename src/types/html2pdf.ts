declare module 'html2pdf.js' {
    interface Html2PdfOptions {
      margin?: number | [number, number, number, number];
      filename?: string;
      image?: {
        type?: string;
        quality?: number;
      };
      html2canvas?: {
        scale?: number;
        useCORS?: boolean;
        logging?: boolean;
        allowTaint?: boolean;
        scrollX?: number;
        scrollY?: number;
        windowWidth?: number;
        windowHeight?: number;
      };
      jsPDF?: {
        unit?: string;
        format?: string;
        orientation?: 'portrait' | 'landscape';
        compress?: boolean;
      };
    }
  
    interface Html2PdfInstance {
      set(options: Html2PdfOptions): Html2PdfInstance;
      from(element: HTMLElement): Html2PdfInstance;
      toPdf(): Html2PdfInstance;
      output(type: 'blob'): Promise<Blob>;
      save(): Promise<void>;
    }
  
    function html2pdf(): Html2PdfInstance;
    export = html2pdf;
  } 