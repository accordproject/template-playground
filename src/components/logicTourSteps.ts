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

import Shepherd from "shepherd.js";

type ShepherdTourInstance = InstanceType<typeof Shepherd.Tour>;

export interface LogicStepOptions {
  id: string;
  text: string;
  attachTo?: {
    element: string;
    on: "top" | "bottom" | "left" | "right";
  };
  buttons: Array<{
    text: string;
    action: (tour: ShepherdTourInstance) => void;
    classes?: string;
  }>;
}

/**
 * Universal transition prompt step shown at the end of the General Tour.
 */
export const getLogicPromptStep = (
  onStartLogic: (tour: ShepherdTourInstance) => void,
  onFinish: (tour: ShepherdTourInstance) => void
): LogicStepOptions => ({
  id: "logic-transition-prompt",
  text: "Ready to bring your contract to life? You can now run and execute smart contract logic directly in the Playground. Let us walk you through it!",
  buttons: [
    {
      text: "Skip",
      action: onFinish,
      classes: "shepherd-button-secondary",
    },
    {
      text: "Start Logic Tour",
      action: onStartLogic,
    },
  ],
});

/**
 * Step definitions for the Logic Authoring & Execution Workflow.
 */
export const getLogicWorkflowSteps = (
  onCancel: (tour: ShepherdTourInstance) => void,
  onNext: (tour: ShepherdTourInstance) => void
): LogicStepOptions[] => [
  {
    id: "logic-editor",
    text: "This is the Logic Editor. Write your contract logic in TypeScript by extending the TemplateLogic class. Implement init() for contract state and trigger() for business logic execution.",
    attachTo: {
      element: ".tour-logic-editor",
      on: "top",
    },
    buttons: [
      {
        text: "Skip",
        action: onCancel,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: onNext,
      },
    ],
  },
  {
    id: "apply-compile",
    text: "Click 'Apply & Compile' to compile your TypeScript logic into executable JavaScript. Any compilation errors will be highlighted directly in the editor and Problems panel.",
    attachTo: {
      element: ".tour-apply-compile",
      on: "bottom",
    },
    buttons: [
      {
        text: "Skip",
        action: onCancel,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: onNext,
      },
    ],
  },
  {
    id: "init-contract",
    text: "Click 'Init Contract' to initialize your smart legal contract state before processing requests.",
    attachTo: {
      element: ".tour-init-contract",
      on: "bottom",
    },
    buttons: [
      {
        text: "Skip",
        action: onCancel,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: onNext,
      },
    ],
  },
  {
    id: "request-editor",
    text: "Provide your request payload in JSON format here. This JSON matches the request types defined in your Concerto model.",
    attachTo: {
      element: ".tour-request-editor",
      on: "top",
    },
    buttons: [
      {
        text: "Skip",
        action: onCancel,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: onNext,
      },
    ],
  },
  {
    id: "send-request",
    text: "Click 'Send Request' to trigger your contract logic in a secure, sandboxed execution environment.",
    attachTo: {
      element: ".tour-send-request",
      on: "bottom",
    },
    buttons: [
      {
        text: "Skip",
        action: onCancel,
        classes: "shepherd-button-secondary",
      },
      {
        text: "Next",
        action: onNext,
      },
    ],
  },
  {
    id: "view-results",
    text: "View execution results here! Explore the Response JSON, updated contract State, and emitted Events & Obligations across tabs.",
    attachTo: {
      element: ".tour-execution-results",
      on: "top",
    },
    buttons: [
      {
        text: "Finish Tour",
        action: onCancel,
      },
    ],
  },
];
