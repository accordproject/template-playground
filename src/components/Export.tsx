import type React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Download } from "lucide-react";
import useAppStore from "../store/store";
import html2pdf from "html2pdf.js";
import HTMLtoDOCX from "html-to-docx";
import TurndownService from "turndown";

interface ExportDropdownProps {
  text: string;
}

export default function ExportDropdown({
  text
}: ExportDropdownProps) {
  const filename = "exported-file";
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [pageSize, setPageSize] = useState<string>("a4");
  const [orientation, setOrientation] = useState<string>("portrait");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

  const fileFormats = [
    { id: "pdf", name: "PDF (.pdf)" },
    { id: "docx", name: "Document (.docx)" },
    { id: "md", name: "Markdown (.md)" },
  ];

  const pageSizes = [
    { id: "a4", name: "A4", dimensions: [210, 297] },
    { id: "a3", name: "A3", dimensions: [297, 420] },
    { id: "a2", name: "A2", dimensions: [420, 594] },
    { id: "letter", name: "Letter", dimensions: [215.9, 279.4] },
    { id: "legal", name: "Legal", dimensions: [216, 356] },
  ];

  const orientations = [
    { id: "portrait", name: "Portrait" },
    { id: "landscape", name: "Landscape" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const convertToFormat = async (
    format: string,
    content: string
  ): Promise<Blob | null> => {
    switch (format) {
      case "pdf": {
        try {
          const sanitizedHtml = content.replace(
            /<img /g,
            '<img crossorigin="anonymous" '
          );
          
          const selectedSize = pageSizes.find((size) => size.id === pageSize)
            ?.dimensions || [210, 297];
          const [width, height] =
            orientation === "landscape"
              ? [selectedSize[1], selectedSize[0]]
              : selectedSize;
  
          const options = {
            margin: 10,
            filename: filename,
            image: { type: "png", quality: 0.98 },
            html2canvas: { useCORS: true, scale: 2 },
            jsPDF: {
              unit: "mm",
              format: [width, height],
              orientation: orientation,
            },
            pagebreak: { mode: "avoid-all", before: ".page-break" },
          };
  
          return html2pdf()
              .from(sanitizedHtml)
              .set(options)
              .toPdf()
              .outputPdf("blob");

        } catch (error) {
          return null;
        }
      }

      case "docx": {
        try {
          const docxBlob = await HTMLtoDOCX(content, null, {
            table: { row: { cantSplit: true } }
          });

          return docxBlob;
        } catch (error) {
          return null;
        }
      }

      case "md": {
        var turndownService = new TurndownService();
        var markdown = turndownService.turndown(content);
        const blob = new Blob([markdown], { type: getMimeType(format) });
        return blob;
      }

      default:
        return null;
    }
  };

  const handleDownload = async () => {
    const blob = await convertToFormat(selectedFormat, text);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsOpen(false);
    }
  };

  const getMimeType = (format: string): string => {
    switch (format) {
      case "pdf":
        return "application/pdf";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "md":
        return "text/markdown";
      default:
        return "text/plain";
    }
  };

  const containerStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    paddingRight: "4px",
    paddingLeft: "4px",
    backgroundColor: backgroundColor,
  };

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: backgroundColor,
    border: `1px solid ${textColor === "#ffffff" ? "#555555" : "#d1d5db"}`,
    borderRadius: "6px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    fontSize: "14px",
    fontWeight: 500,
    color: textColor,
    cursor: "pointer",
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor:
      textColor === "#ffffff" ? "rgba(255, 255, 255, 0.1)" : "#f9fafb",
    color: textColor,
  };

  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    right: 0,
    top: "100%",
    marginTop: "4px",
    width: "256px",
    padding: "12px",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    zIndex: 10,
    backgroundColor: backgroundColor,
    color: textColor,
    border: `1px solid ${textColor === "#ffffff" ? "#555555" : "#e5e7eb"}`,
    borderRadius: "6px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "8px",
    color: textColor,
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: backgroundColor,
    color: textColor,
    border: `1px solid ${textColor === "#ffffff" ? "#555555" : "#d1d5db"}`,
    borderRadius: "6px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    fontSize: "14px",
    marginBottom: "12px",
    outline: "none",
  };

  const optionStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    color: textColor
  };

  const downloadButtonStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "white",
    borderRadius: "6px",
    border: "none",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  };

  const [isDownloadHovered, setIsDownloadHovered] = useState(false);

  const downloadButtonHoverStyle: React.CSSProperties = {
    backgroundColor: "#1d4ed8",
  };

  return (
    <div style={containerStyle} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        style={{
          ...buttonStyle,
          ...(isButtonHovered ? buttonHoverStyle : {}),
        }}
      >
        <span>Export</span>
        <ChevronDown
          style={{ width: "16px", height: "16px", color: textColor }}
        />
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          <div>
            <p style={labelStyle}>Select format</p>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              style={selectStyle}
            >
              {fileFormats.map((format) => (
                <option key={format.id} value={format.id} style={optionStyle}>
                  {format.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFormat === "pdf" && (
            <>
              <div>
                <p style={labelStyle}>Page size</p>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  style={selectStyle}
                >
                  {pageSizes.map((size) => (
                    <option key={size.id} value={size.id} style={optionStyle}>
                      {size.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p style={labelStyle}>Orientation</p>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  style={selectStyle}
                >
                  {orientations.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      style={optionStyle}
                    >
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleDownload}
            onMouseEnter={() => setIsDownloadHovered(true)}
            onMouseLeave={() => setIsDownloadHovered(false)}
            style={{
              ...downloadButtonStyle,
              ...(isDownloadHovered ? downloadButtonHoverStyle : {}),
            }}
          >
            <Download style={{ width: "16px", height: "16px" }} />
            <span>Download</span>
          </button>
        </div>
      )}
    </div>
  );
}
