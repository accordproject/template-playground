/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { colors } from "../utils/theme";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import useAppStore from "../store/store";

type ShepherdTourInstance = InstanceType<typeof Shepherd.Tour>;

interface TourStepButton {
  text: string;
  action: () => void | Promise<void>;
  classes?: string;
}

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .shepherd-button-secondary {
      background-color: #6c757d !important;
    }
    .shepherd-button {
      background-color: ${colors.darkNavy} !important;
      color: white !important;
    }
    .shepherd-has-title .shepherd-content .shepherd-header {
      background: #f8fafc !important;
      padding: 0.75rem 1rem 0.5rem !important;
      border-bottom: 1px solid #e2e8f0;
    }
    .shepherd-title {
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      color: ${colors.darkNavy} !important;
    }
  `;
  document.head.appendChild(style);
}

const tour: ShepherdTourInstance = new Shepherd.Tour({
  defaultStepOptions: {
    classes: "shepherd-theme-arrows",
    scrollTo: true,
  },
  useModalOverlay: true,
});

interface TourStepConfig {
  id: string;
  text: string;
  attachTo?: {
    element: string;
    on: "top" | "bottom" | "left" | "right";
  };
  getButtons?: (
    tourInstance: ShepherdTourInstance,
    stepIndex: number,
    totalSteps: number
  ) => TourStepButton[];
}

const tourStepConfigs: TourStepConfig[] = [
  {
    id: "intro",
    text: "Welcome to the Template Playground! This brief tour will help you get acquainted with the key features of the platform.",
  },
  {
    id: "template-dropdown",
    text: "Here is the 'Template' dropdown. This dropdown contains various templates that you can edit and experiment with. Select a template to see and modify its details.",
    attachTo: {
      element: ".samples-element",
      on: "bottom",
    },
  },
  {
    id: "toggle-editor",
    text: "Use this button to toggle the editor panel on/off. The editor panel contains the Concerto Model, TemplateMark, and JSON Data editors.",
    attachTo: {
      element: ".tour-editor",
      on: "right",
    },
  },
  {
    id: "toggle-preview",
    text: "Toggle the preview window to show or hide the live preview of your template. This helps you see the results of your edits in real-time.",
    attachTo: {
      element: ".tour-preview",
      on: "right",
    },
  },
  {
    id: "toggle-problems",
    text: "Toggle the problems panel to view compilation errors and warnings. This helps you debug issues in your template and model.",
    attachTo: {
      element: ".tour-problems",
      on: "right",
    },
  },
  {
    id: "fullscreen-modal",
    text: "Open the preview in fullscreen mode for better viewing. This allows you to see your template output in a larger, focused view.",
    attachTo: {
      element: ".tour-fullscreen",
      on: "right",
    },
  },
  {
    id: "template-share",
    text: "Use this 'Share' button to generate and share a link for any created or edited templates. Share your work with others easily.",
    attachTo: {
      element: ".tour-share",
      on: "right",
    },
  },
  {
    id: "start-tour-button",
    text: "Use this button to restart the tour anytime you want to review the features and functionality of the Template Playground.",
    attachTo: {
      element: ".tour-start-tour",
      on: "right",
    },
  },
  {
    id: "editor-settings",
    text: "Access editor settings and configuration options here. Customize your editing experience to suit your preferences.",
    attachTo: {
      element: ".tour-settings",
      on: "right",
    },
  },
  {
    id: "ai-assistant",
    text: "Use the AI Assistant to get help with creating and editing your templates. The AI can provide suggestions and guidance for your template development.",
    attachTo: {
      element: ".tour-ai-assistant",
      on: "left",
    },
  },
  {
    id: "concerto-model",
    text: "This is the Concerto Model editor. Define the data model for your template including types, concepts, and business logic here.",
    attachTo: {
      element: ".tour-concerto-model",
      on: "top",
    },
  },
  {
    id: "template-mark",
    text: "This is the TemplateMark editor. Write your natural language template with embedded variables, conditional sections, and TypeScript code.",
    attachTo: {
      element: ".tour-template-mark",
      on: "top",
    },
  },
  {
    id: "json-data",
    text: "This is the JSON Data editor. Provide sample data that matches your Concerto model to test and preview your template.",
    attachTo: {
      element: ".tour-json-data",
      on: "top",
    },
  },
  {
    id: "preview-panel",
    text: "This section shows the live preview of your template. View the results of your edits and see how your template renders with the provided data.",
    attachTo: {
      element: ".tour-preview-panel",
      on: "top",
    },
  },
  {
    id: "logic-transition-prompt",
    text: "Ready to bring your contract to life? You can now run and execute smart contract logic directly in the Playground. Let us walk you through it!",
    getButtons: (tourInstance) => [
      {
        text: "Back",
        action: () => tourInstance.back(),
        classes: "shepherd-button-secondary",
      },
      {
        text: "Skip",
        action: () => {
          if (typeof window !== "undefined") {
            localStorage.setItem("hasVisitedLogicTour", "true");
          }
          void tourInstance.cancel();
        },
        classes: "shepherd-button-secondary",
      },
      {
        text: "Start Logic Tour",
        action: () => {
          if (typeof window !== "undefined") {
            localStorage.setItem("hasVisitedLogicTour", "true");
          }
          const store = useAppStore.getState();
          if (!store.isLogicFeatureEnabled) {
            store.setLogicFeatureEnabled(true);
          }
          store.setLogicPanelVisible(true);
          store.setContractRunnerVisible(true);

          // Hide the prompt dialog immediately so it disappears with 0ms delay
          tourInstance.getCurrentStep()?.hide();

          // If the active sample has no logic, load the Counter sample in the background
          if (!store.logicTs || store.logicTs.trim().length === 0) {
            void store.loadSample("Counter Contract (with Logic)");
          }

          // Wait 250ms for React layout recalculation & DOM mounting before showing logic-editor step
          setTimeout(() => {
            tourInstance.show("logic-editor");
          }, 250);
        },
      },
    ],
  },
  {
    id: "logic-editor",
    text: "This is the Logic Editor. Write your contract logic in TypeScript by extending the TemplateLogic class. Implement init() for contract state and trigger() for business logic execution.",
    attachTo: {
      element: ".tour-logic-editor",
      on: "top",
    },
  },
  {
    id: "apply-compile",
    text: "Click 'Apply & Compile' to compile your TypeScript logic into executable JavaScript. Any compilation errors will be highlighted directly in the editor and Problems panel.",
    attachTo: {
      element: ".tour-apply-compile",
      on: "bottom",
    },
  },
  {
    id: "init-contract",
    text: "Click 'Init Contract' to initialize your smart legal contract state before processing requests.",
    attachTo: {
      element: ".tour-init-contract",
      on: "bottom",
    },
  },
  {
    id: "request-editor",
    text: "Provide your request payload in JSON format here. This JSON matches the request types defined in your Concerto model.",
    attachTo: {
      element: ".tour-request-editor",
      on: "top",
    },
  },
  {
    id: "send-request",
    text: "Click 'Send Request' to trigger your contract logic in a secure, sandboxed execution environment.",
    attachTo: {
      element: ".tour-send-request",
      on: "bottom",
    },
  },
  {
    id: "view-results",
    text: "View execution results here! Explore the Response JSON, updated contract State, and emitted Events & Obligations across tabs.",
    attachTo: {
      element: ".tour-execution-results",
      on: "top",
    },
  },
  {
    id: "learn-button",
    text: 'Click the "Learn" button to access the Learning Pathway. Here, you will find comprehensive documentation and tutorials to help you create templates effectively.',
    attachTo: {
      element: ".learnNow-button",
      on: "bottom",
    },
    getButtons: (tourInstance) => [
      {
        text: "Back",
        action: () => tourInstance.back(),
        classes: "shepherd-button-secondary",
      },
      {
        text: "Finish Tour",
        action: () => void tourInstance.cancel(),
      },
    ],
  },
];

const totalSteps = tourStepConfigs.length;

const buildDefaultStepButtons = (
  tourInstance: ShepherdTourInstance,
  stepIndex: number
): TourStepButton[] => {
  const buttons: TourStepButton[] = [];

  // Step 2 onward provides Back navigation to the previous step
  if (stepIndex > 0) {
    buttons.push({
      text: "Back",
      action: () => tourInstance.back(),
      classes: "shepherd-button-secondary",
    });
  }

  buttons.push(
    {
      text: "Skip",
      action: () => void tourInstance.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tourInstance.next(),
    }
  );

  return buttons;
};

tourStepConfigs.forEach((config, index) => {
  const buttons = config.getButtons
    ? config.getButtons(tour, index, totalSteps)
    : buildDefaultStepButtons(tour, index);

  tour.addStep({
    id: config.id,
    title: `Step ${index + 1}/${totalSteps}`,
    text: config.text,
    ...(config.attachTo ? { attachTo: config.attachTo } : {}),
    buttons,
  });
});

export default tour;
