import { ConfigProvider } from "antd";
import useDesignV2Store from "../../store/designV2Store";
import { designV2Theme } from "./theme";
import Rail from "./Rail";
import Header from "./Header";
import Footer from "./Footer";
import PreviewDrawer from "./PreviewDrawer";
import SandboxFrame from "../SandboxFrame";
import { ViewSwitch } from "./views";
import { DEFAULT_TEMPLATE, usePickTemplate } from "./usePickTemplate";
import { FIRST_STEP } from "../../types/designV2.types";
import "./DesignV2Layout.css";

/**
 * DesignV2Layout
 *
 * Skeleton of the redesigned, step-based Template Playground (work in progress).
 * Structure follows the "Template Playground v4" design:
 *
 *   ┌ rail ┬───────────────────────────────────────────┐
 *   │      │ header  (eyebrow / sample · docs Help Preview)
 *   │      │ stepper (1 Template · 2 Text · 3 Model & Data · 4 Logic · 5 Simulate · 6 Deploy)
 *   │      ├─────────────────────────────┬─────────────┤
 *   │      │ view (welcome/start/editor/ │ help rail   │  ← preview drawer overlays
 *   │      │  model+data/simulate/deploy)│ (editor steps) │
 *   │      ├─────────────────────────────┴─────────────┤
 *   │      │ footer  (problems · Back · Compile · Next)   — editor steps only
 *   └──────┴───────────────────────────────────────────┘
 *
 * View / preview state lives in useDesignV2Store (src/store/designV2Store.ts).
 * Editor contents live in the legacy app store: picking a card on the Start
 * step loads its sample there, and the editor steps edit it through the same
 * containers as the old layout. The Start step has no footer: each gallery
 * card carries its own "Start with this template" button.
 * antd components inside are themed with the v2 palette via ConfigProvider (see theme.ts).
 * Simulate runs the compiled logic through the store's initContract /
 * triggerContract (see SimulateView.tsx). Deploy is still a placeholder.
 * Rendered from App.tsx when the "Enable Design v2" (isDesignV2Enabled) feature flag is on.
 */
const DesignV2Layout = () => {
  const view = useDesignV2Store((s) => s.view);
  const previewOpen = useDesignV2Store((s) => s.previewOpen);
  const setView = useDesignV2Store((s) => s.setView);
  const start = useDesignV2Store((s) => s.start);
  const selectedTemplate = useDesignV2Store((s) => s.selectedTemplate);
  const goBack = useDesignV2Store((s) => s.goBack);
  const goNext = useDesignV2Store((s) => s.goNext);
  const setPreviewOpen = useDesignV2Store((s) => s.setPreviewOpen);
  const togglePreview = useDesignV2Store((s) => s.togglePreview);
  const pick = usePickTemplate();

  /** "Start building": enter the flow on a template — the first card unless one was already picked. */
  const handleStart = () => {
    if (!selectedTemplate) pick(DEFAULT_TEMPLATE);
    start();
  };

  const showChrome = view !== "welcome";
  const showFooter = showChrome && view !== FIRST_STEP;

  return (
    <ConfigProvider theme={designV2Theme()}>
    <div className="nd-root">
      {/* Hidden iframe the store runs compiled logic in (initContract / triggerContract). */}
      <SandboxFrame />
      <Rail />
      <div className="nd-main">
        <Header
          view={view}
          previewOpen={previewOpen}
          onNavigate={setView}
          onTogglePreview={togglePreview}
        />
        <div className="nd-body">
          <div className="nd-body-content">
            <ViewSwitch view={view} onStart={handleStart} />
          </div>
          <PreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} />
        </div>
        {showFooter && <Footer view={view} onBack={goBack} onNext={goNext} />}
      </div>
    </div>
    </ConfigProvider>
  );
};

export default DesignV2Layout;
