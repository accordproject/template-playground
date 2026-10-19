import { ConfigProvider, message } from "antd";
import useDesignV2Store from "../../store/designV2Store";
import { designV2Theme } from "./theme";
import Rail from "./Rail";
import Header from "./Header";
import Footer from "./Footer";
import PreviewDrawer from "./PreviewDrawer";
import SandboxFrame from "../SandboxFrame";
import { ViewSwitch } from "./views";
import { DEFAULT_TEMPLATE, usePickTemplate } from "./usePickTemplate";
import { ensureLogicCompiles, usePendingLogic } from "./useCompileOnArrival";
import { FOOTER } from "./constants";
import { FIRST_STEP, STEPS, STEP_ID, type DesignV2View } from "../../types/designV2.types";
import "./DesignV2Layout.css";

/**
 * DesignV2Layout
 *
 * Skeleton of the redesigned, step-based Template Playground (work in progress).
 * Structure follows the "Template Playground v4" design:
 *
 *   ┌ rail ┬───────────────────────────────────────────┐
 *   │      │ header  (eyebrow / sample · docs Help)
 *   │      │ stepper (1 Template · 2 Text · 3 Data · 4 Logic · 5 Simulate · 6 Deploy)
 *   │      ├─────────────────────────────┬─────────────┤
 *   │      │ view (welcome/start/editor/ │ help rail   │  ← preview drawer overlays
 *   │      │  model+data/simulate/deploy)│ (editor steps) │
 *   │      ├─────────────────────────────┴─────────────┤
 *   │      │ footer  (problems · Back · Next)             — editor steps only
 *   └──────┴───────────────────────────────────────────┘
 *
 * View / preview state lives in useDesignV2Store (src/store/designV2Store.ts);
 * the Text and Data steps carry the Preview toggle (PreviewToggle.tsx).
 * Editor contents live in the legacy app store: picking a card on the Start
 * step loads its sample there, and the editor steps edit it through the same
 * containers as the old layout. The Start step has no footer: each gallery
 * card carries its own "Start with this template" button.
 * antd components inside are themed with the v2 palette via ConfigProvider (see theme.ts).
 * There is no compile button: the Logic step compiles its logic when it
 * opens, and every move to Simulate — Next or the stepper — compiles it
 * again if it changed; a compile error keeps the user where they are with
 * the error in view (see useCompileOnArrival.ts). Simulate runs the compiled
 * logic through the store's initContract / triggerContract (SimulateView.tsx).
 * A template without logic has nothing to simulate: Next and Back pass over
 * Simulate, and the stepper shows it greyed out.
 * Deploy is still a placeholder.
 * Rendered from App.tsx when the "Enable Design v2" (isDesignV2Enabled) feature flag is on.
 */
const DesignV2Layout = () => {
  const view = useDesignV2Store((s) => s.view);
  const previewOpen = useDesignV2Store((s) => s.previewOpen);
  const setView = useDesignV2Store((s) => s.setView);
  const start = useDesignV2Store((s) => s.start);
  const selectedTemplate = useDesignV2Store((s) => s.selectedTemplate);
  const setPreviewOpen = useDesignV2Store((s) => s.setPreviewOpen);
  const pick = usePickTemplate();

  /** "Start building": enter the flow on a template — the first card unless one was already picked. */
  const handleStart = () => {
    if (!selectedTemplate) pick(DEFAULT_TEMPLATE);
    start();
  };

  /** Steps the flow passes over: Simulate, while the template has no logic. */
  const hasLogic = usePendingLogic() !== null;
  const isSkipped = (id: DesignV2View) => id === STEP_ID.simulate && !hasLogic;

  /** Any move to another step. Simulate opens only if the logic compiles. */
  const navigate = (target: DesignV2View) => {
    if (isSkipped(target)) return;
    void (async () => {
      if (target === STEP_ID.simulate && !(await ensureLogicCompiles())) {
        void message.error(FOOTER.logicBlocked);
        return;
      }
      setView(target);
    })();
  };
  /** The nearest step before (-1) or after (+1) the current one that is not skipped. */
  const neighbour = (direction: -1 | 1) => {
    const index = STEPS.findIndex((step) => step.id === view);
    if (index < 0) return undefined;
    for (let i = index + direction; i >= 0 && i < STEPS.length; i += direction) {
      if (!isSkipped(STEPS[i].id)) return STEPS[i].id;
    }
    return undefined;
  };
  const next = () => {
    const target = neighbour(1);
    if (target !== undefined) navigate(target);
  };
  const back = () => {
    const target = neighbour(-1);
    if (target !== undefined) setView(target);
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
        <Header view={view} onNavigate={navigate} isSkipped={isSkipped} />
        <div className="nd-body">
          <div className="nd-body-content">
            <ViewSwitch view={view} onStart={handleStart} />
          </div>
          <PreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} />
        </div>
        {showFooter && <Footer view={view} onBack={back} onNext={next} />}
      </div>
    </div>
    </ConfigProvider>
  );
};

export default DesignV2Layout;
