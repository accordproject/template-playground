import { useState } from "react";
import Rail from "./Rail";
import Header from "./Header";
import Footer from "./Footer";
import PreviewDrawer from "./PreviewDrawer";
import { ViewSwitch } from "./views";
import { STEPS, type NewDesignView } from "./types";
import "./NewDesignLayout.css";

/**
 * NewDesignLayout
 *
 * Skeleton of the redesigned, step-based Template Playground (work in progress).
 * Structure follows the "Template Playground v4" design:
 *
 *   ┌ rail ┬───────────────────────────────────────────┐
 *   │      │ header  (eyebrow / sample · docs Advanced Preview)
 *   │      │ stepper (1 Template · 2 Model · 3 Text · 4 Data · 5 Logic · 6 Simulate · 7 Export)
 *   │      ├─────────────────────────────┬─────────────┤
 *   │      │ view (welcome/start/editor/ │ help rail   │  ← preview drawer overlays
 *   │      │       simulate/export)      │ (steps 2–5) │
 *   │      ├─────────────────────────────┴─────────────┤
 *   │      │ footer  (problems · Back · Compile · Next)
 *   └──────┴───────────────────────────────────────────┘
 *
 * All content areas are placeholders; wiring to the store/editors comes later.
 * Rendered from App.tsx when the "Enable New Design" feature flag is on.
 */
const NewDesignLayout = () => {
  const [view, setView] = useState<NewDesignView>("welcome");
  const [previewOpen, setPreviewOpen] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === view);
  const goBack = () => {
    if (stepIndex > 0) setView(STEPS[stepIndex - 1].id);
  };
  const goNext = () => {
    if (stepIndex >= 0 && stepIndex < STEPS.length - 1) setView(STEPS[stepIndex + 1].id);
  };

  const showChrome = view !== "welcome";

  return (
    <div className="nd-root">
      <Rail />
      <div className="nd-main">
        <Header
          view={view}
          previewOpen={previewOpen}
          onNavigate={setView}
          onTogglePreview={() => setPreviewOpen((v) => !v)}
        />
        <div className="nd-body">
          <div className="nd-body-content">
            <ViewSwitch view={view} onStart={() => setView(1)} />
          </div>
          {previewOpen && <PreviewDrawer onClose={() => setPreviewOpen(false)} />}
        </div>
        {showChrome && <Footer view={view} onBack={goBack} onNext={goNext} />}
      </div>
    </div>
  );
};

export default NewDesignLayout;
