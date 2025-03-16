import { Button, Dropdown, message, Space } from "antd";
import useAppStore from "../store/store";
import TurndownService from "turndown";
import html2pdf from "html2pdf.js";

import HTMLtoDOCX from "html-to-docx";
import { DownloadOutlined } from "@ant-design/icons";

const ExportDropdown = () => {
  const state = useAppStore();

  const items = [
    {
      label: "PDF",
      key: "PDF",
    },
    {
      label: "DOCX",
      key: "DOCX",
    },
    {
      label: "MARKDOWN",
      key: "MARKDOWN",
    },
  ];

  const handleExportMenuClick = async (e: { key: string }) => {
    console.log("export button clicked", e);
    const htmlContent = state.agreementHtml;

    console.log("html content", htmlContent);

    switch (e.key) {
      case "PDF": {
        const tempElement = document.createElement("div");
        tempElement.innerHTML = htmlContent;
        document.body.appendChild(tempElement);

        const options = {
          margin: 1,
          filename: "document.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCors: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        };

        try {
          await html2pdf().set(options).from(tempElement).save();
        } catch (error) {
          console.error("Error generating PDF:", error);
          throw error;
        } finally {
          document.body.removeChild(tempElement);
        }
        break;
      }

      case "DOCX": {
        try {
          const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
          });

          const blob = new Blob([docxBuffer], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "export.docx";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error("error converting to docx", error);
          throw error;
        }
        break;
      }
      case "MARKDOWN": {
        try {
          const turndownService = new TurndownService();
          const markdownContent = turndownService.turndown(htmlContent);
          const blob = new Blob([markdownContent], { type: "text/markdown" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "export.md";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error("Error generating Markdown:", error);
          throw error;
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <Space>
      <Dropdown
        menu={{
          items,
          onClick: (e) => {
            void handleExportMenuClick(e)
              .then(() => {
                console.log("successfully exported");
                void message.success("Successfully exported Document");
              })
              .catch((e) => {
                if (e instanceof Error) {
                  void message.error(`Error: ${e.message}`);
                } else {
                  void message.error(
                    "Error exporting document, please try again"
                  );
                }
              });
          },
        }}
        trigger={["click"]}
      >
        <Button icon={<DownloadOutlined />}>Export</Button>
      </Dropdown>
    </Space>
  );
};

export default ExportDropdown;
