import useDesignV2Store from "../../store/designV2Store";
import Rail from "./Rail";
import Header from "./Header";
import Footer from "./Footer";
import PreviewDrawer from "./PreviewDrawer";
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
 *   │      │ stepper (1 Template · 2 Text · 3 Model · 4 Data · 5 Logic · 6 Simulate · 7 Deploy)
 *   │      ├─────────────────────────────┬─────────────┤
 *   │      │ view (welcome/start/editor/ │ help rail   │  ← preview drawer overlays
 *   │      │       simulate/deploy)      │ (editor steps) │
 *   │      ├─────────────────────────────┴─────────────┤
 *   │      │ footer  (problems · Back · Compile · Next)
 *   └──────┴───────────────────────────────────────────┘
 *
 * View / preview state lives in useDesignV2Store (src/store/designV2Store.ts).
 * All content areas are placeholders; wiring to the editors comes later.
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
    <div className="nd-root">
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
          {previewOpen && <PreviewDrawer onClose={() => setPreviewOpen(false)} />}
        </div>
        {showChrome && <Footer view={view} onBack={goBack} onNext={goNext} />}
      </div>
    </div>
  );
};

export default DesignV2Layout;
