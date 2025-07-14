import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AgreementData from "../editors/editorsContainer/AgreementData";
import TemplateModel from "../editors/editorsContainer/TemplateModel";
import TemplateMarkdown from "../editors/editorsContainer/TemplateMarkdown";
import useAppStore from "../store/store";
import { AIChatPanel } from "../components/AIChatPanel";

const MainContainer = () => {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const { isAIChatOpen, setAIChatOpen } = useAppStore((state) => ({
    isAIChatOpen: state.isAIChatOpen,
    setAIChatOpen: state.setAIChatOpen,
  }));

  return (
    <div className="h-full bg-slate-50">
      <PanelGroup direction="horizontal" className="h-full">
        <Panel defaultSize={50} minSize={30}>
          <div className="h-full bg-white border-r border-gray-200">
            <PanelGroup direction="vertical" className="h-full">
              <Panel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col">
                  <div className="bg-slate-100 border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 flex justify-between items-center">
                    <span>Concerto Model</span>
                    <button
                      id="ai-assistant"
                      onClick={() => setAIChatOpen(!isAIChatOpen)}
                      className="flex cursor-pointer items-center justify-center px-4 py-1.5 h-8 text-sm bg-white border border-solid border-gray-300 rounded-md transition-all duration-400 ease-in-out hover:border-[#4096ff] hover:text-[#4096ff]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 45 20"
                        fill="none"
                        className="size-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          d="M12 13.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 0.444 3 5c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 14c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                          transform="translate(0, 3)"
                        />
                        <defs>
                          <linearGradient
                            id="ai-gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="#a78bfa" />
                            <stop offset="50%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                        </defs>
                        <text
                          x="32"
                          y="6"
                          fontSize="16"
                          fontWeight="bold"
                          fill="url(#ai-gradient)"
                          textAnchor="middle"
                        >
                          AI
                        </text>
                      </svg>
                      <span>Assistant</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <TemplateModel />
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="h-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

              <Panel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col">
                  <div className="bg-slate-100 border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                    TemplateMark
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <TemplateMarkdown />
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

              <Panel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col">
                  <div className="bg-slate-100 border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
                    JSON Data
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    <AgreementData />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

        <Panel defaultSize={30} minSize={20}>
          <div className="h-full bg-white flex flex-col">
            <div className="bg-slate-100 border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700">
              Preview
            </div>
            <div className="flex-1 p-4 bg-gray-50">
              <div className="text-gray-500">
                <div
                  className="agreement"
                  dangerouslySetInnerHTML={{ __html: agreementHtml }}
                  style={{
                    flex: 1,
                    color: textColor,
                    backgroundColor: backgroundColor,
                  }}
                />
              </div>
            </div>
          </div>
        </Panel>

        {isAIChatOpen && (
          <>
            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />
            <Panel defaultSize={25} minSize={20}>
              <AIChatPanel />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};

export default MainContainer;
