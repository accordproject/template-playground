import { ConfigProvider } from "antd";
import useDesignV2Store from "../../store/designV2Store";
import { designV2Theme } from "./theme";
import Rail from "./Rail";
import Header from "./Header";
import Footer from "./Footer";
import PreviewDrawer from "./PreviewDrawer";
import SandboxFrame from "../SandboxFrame";
import { ViewSwitch } from "./views";
import "./DesignV2Layout.css";

/**
 * DesignV2Layout
 *
 * Skeleton of the redesigned, step-based Template Playground (work in progress).
 * Structure follows the "Template Playground v4" design:
 *
 *   ┌ rail ┬───────────────────────────────────────────┐
 *   │      │ header  (eyebrow / sample · docs Advanced Preview)
 *   │      │ stepper (1 Template · 2 Model & Data · 3 Text · 4 Logic · 5 Simulate · 6 Deploy)
 *   │      ├─────────────────────────────┬─────────────┤
 *   │      │ view (welcome/start/editor/ │ help rail   │  ← preview drawer overlays
 *   │      │  model+data/simulate/deploy)│ (editor steps) │
 *   │      ├─────────────────────────────┴─────────────┤
 *   │      │ footer  (problems · Back · Compile · Next)
 *   └──────┴───────────────────────────────────────────┘
 *
 * View / preview state lives in useDesignV2Store (src/store/designV2Store.ts).
 * Editor contents live in the legacy app store: leaving the Start step loads the
 * picked sample there, and the Model & Data step edits it through the same
 * containers as the old layout.
 * antd components inside are themed with the v2 palette via ConfigProvider (see theme.ts).
 * Text, Logic, Simulate and Deploy are still placeholders.
 * Rendered from App.tsx when the "Enable Design v2" (isDesignV2Enabled) feature flag is on.
 */
const DesignV2Layout = () => {
  const view = useDesignV2Store((s) => s.view);
  const previewOpen = useDesignV2Store((s) => s.previewOpen);
  const setView = useDesignV2Store((s) => s.setView);
  const start = useDesignV2Store((s) => s.start);
  const goBack = useDesignV2Store((s) => s.goBack);
  const goNext = useDesignV2Store((s) => s.goNext);
  const setPreviewOpen = useDesignV2Store((s) => s.setPreviewOpen);
  const togglePreview = useDesignV2Store((s) => s.togglePreview);


  const showChrome = view !== "welcome";

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
            <ViewSwitch view={view} onStart={start} />
          </div>
          <PreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} />
        </div>
        {showChrome && <Footer view={view} onBack={goBack} onNext={goNext} />}
      </div>
    </div>
    </ConfigProvider>
  );
};

export default DesignV2Layout;
