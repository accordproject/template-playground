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

const style = document.createElement("style");
style.textContent = `
  .shepherd-button-secondary {
    background-color: #6c757d !important;
  }
  .shepherd-button {
    background-color: ${colors.darkNavy} !important;
    color: white !important;
  }
`;
document.head.appendChild(style);

const tour = new Shepherd.Tour({
  defaultStepOptions: {
    classes: "shepherd-theme-arrows",
    scrollTo: true,
  },
  useModalOverlay: true,
});

tour.addStep({
  id: "intro",
  text: "Welcome to the Template Playground! This brief tour will help you get acquainted with the key features of the platform.",
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "template-dropdown",
  text: "Here is the 'Template' dropdown. This dropdown contains various templates that you can edit and experiment with. Select a template to see and modify its details.",
  attachTo: {
    element: ".samples-element",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "toggle-editor",
  text: "Use this button to toggle the editor panel on/off. The editor panel contains the Concerto Model, TemplateMark, and JSON Data editors.",
  attachTo: {
    element: ".tour-editor",
    on: "right",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "toggle-preview",
  text: "Toggle the preview window to show or hide the live preview of your template. This helps you see the results of your edits in real-time.",
  attachTo: {
    element: ".tour-preview",
    on: "right",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "toggle-problems",
  text: "Toggle the problems panel to view compilation errors and warnings. This helps you debug issues in your template and model.",
  attachTo: {
    element: ".tour-problems",
    on: "right",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "fullscreen-modal",
  text: "Open the preview in fullscreen mode for better viewing. This allows you to see your template output in a larger, focused view.",
  attachTo: {
    element: ".tour-fullscreen",
    on: "right",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "template-share",
  text: "Use this 'Share' button to generate and share a link for any created or edited templates. Share your work with others easily.",
  attachTo: {
    element: ".tour-share",
    on: "right",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "start-tour-button",
  text: "Use this button to restart the tour anytime you want to review the features and functionality of the Template Playground.",
  attachTo: {
    element: ".tour-start-tour",
    on: "right",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "editor-settings",
  text: "Access editor settings and configuration options here. Customize your editing experience to suit your preferences.",
  attachTo: {
    element: ".tour-settings",
    on: "right",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "ai-assistant",
  text: "Use the AI Assistant to get help with creating and editing your templates. The AI can provide suggestions and guidance for your template development.",
  attachTo: {
    element: ".tour-ai-assistant",
    on: "left",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "concerto-model",
  text: "This is the Concerto Model editor. Define the data model for your template including types, concepts, and business logic here.",
  attachTo: {
    element: ".tour-concerto-model",
    on: "top",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "template-mark",
  text: "This is the TemplateMark editor. Write your natural language template with embedded variables, conditional sections, and TypeScript code.",
  attachTo: {
    element: ".tour-template-mark",
    on: "top",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "json-data",
  text: "This is the JSON Data editor. Provide sample data that matches your Concerto model to test and preview your template.",
  attachTo: {
    element: ".tour-json-data",
    on: "top",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "preview-panel",
  text: "This section shows the live preview of your template. View the results of your edits and see how your template renders with the provided data.",
  attachTo: {
    element: ".tour-preview-panel",
    on: "top",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "logic-transition-prompt",
  text: "Ready to bring your contract to life? You can now run and execute smart contract logic directly in the Playground. Let us walk you through it!",
  buttons: [
    {
      text: "Skip",
      action: () => {
        if (typeof window !== "undefined") {
          localStorage.setItem("hasVisitedLogicTour", "true");
        }
        void tour.cancel();
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
        store.setLogicPanelVisible(true);
        store.setContractRunnerVisible(true);

        // Hide the prompt dialog immediately so it disappears with 0ms delay
        tour.getCurrentStep()?.hide();

        // If the active sample has no logic, load the Counter sample in the background
        if (!store.logicTs || store.logicTs.trim().length === 0) {
          void store.loadSample("Counter Contract (with Logic)");
        }

        // Wait 250ms for React layout recalculation & DOM mounting before showing logic-editor step
        setTimeout(() => {
          tour.show("logic-editor");
        }, 250);
      },
    },
  ],
});

tour.addStep({
  id: "logic-editor",
  text: "This is the Logic Editor. Write your contract logic in TypeScript by extending the TemplateLogic class. Implement init() for contract state and trigger() for business logic execution.",
  attachTo: {
    element: ".tour-logic-editor",
    on: "top",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "apply-compile",
  text: "Click 'Apply & Compile' to compile your TypeScript logic into executable JavaScript. Any compilation errors will be highlighted directly in the editor and Problems panel.",
  attachTo: {
    element: ".tour-apply-compile",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "init-contract",
  text: "Click 'Init Contract' to initialize your smart legal contract state before processing requests.",
  attachTo: {
    element: ".tour-init-contract",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "request-editor",
  text: "Provide your request payload in JSON format here. This JSON matches the request types defined in your Concerto model.",
  attachTo: {
    element: ".tour-request-editor",
    on: "top",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "send-request",
  text: "Click 'Send Request' to trigger your contract logic in a secure, sandboxed execution environment.",
  attachTo: {
    element: ".tour-send-request",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "view-results",
  text: "View execution results here! Explore the Response JSON, updated contract State, and emitted Events & Obligations across tabs.",
  attachTo: {
    element: ".tour-execution-results",
    on: "top",
  },
  buttons: [
    {
      text: "Skip",
      action: () => void tour.cancel(),
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: () => tour.next(),
    },
  ],
});

tour.addStep({
  id: "learn-button",
  text: 'Click the "Learn" button to access the Learning Pathway. Here, you will find comprehensive documentation and tutorials to help you create templates effectively.',
  attachTo: {
    element: ".learnNow-button",
    on: "bottom",
  },
  buttons: [
    {
      text: "Finish Tour",
      action: () => void tour.cancel(),
    },
  ],
});

export default tour;
