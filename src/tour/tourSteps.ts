import { Tour } from "shepherd.js";
import { getProgress } from "./tourUtils";

/* ---------- HELPERS ---------- */

function stepLayout(
  tour: Tour,
  title: string,
  body: string
) {
  return `
    <div class="tour-header">
      <div class="tour-title">${title}</div>
      ${getProgress(tour)}
    </div>

    <div class="tour-body">
      ${body}
    </div>
  `;
}


function getButtons(
  tour: Tour,
  type: "first" | "middle" | "last" = "middle"
) {

  if (type === "first") {
    return [
      {
        text: "Skip",
        action: () => tour.cancel(),
        classes: "shepherd-button-secondary"
      },
      {
        text: "Next",
        action: () => tour.next()
      }
    ];
  }

  if (type === "last") {
    return [
      {
        text: "Back",
        action: () => tour.back(),
        classes: "shepherd-button-secondary"
      },
      {
        text: "Finish Tour",
        action: () => tour.cancel()
      }
    ];
  }

  return [
    {
      text: "Back",
      action: () => tour.back(),
      classes: "shepherd-button-secondary"
    },
    {
      text: "Skip",
      action: () => tour.cancel(),
      classes: "shepherd-button-secondary"
    },
    {
      text: "Next",
      action: () => tour.next()
    }
  ];
}


function addStep(
  tour: Tour,
  id: string,
  title: string,
  body: string,
  element?: string,
  position: any = "right",
  type: "first" | "middle" | "last" = "middle"
) {

  const step: any = {
    id,

    text: () =>
      stepLayout(
        tour,
        title,
        body
      ),

    buttons: getButtons(
      tour,
      type
    )
  };

  if (element) {
    step.attachTo = {
      element,
      on: position
    };
  }

  tour.addStep(step);
}


/* ---------- MAIN EXPORT ---------- */

export function addTourSteps(tour: Tour) {

  addStep(
    tour,
    "intro",
    "Template Playground Tour",
    "Welcome to the Template Playground. This short guide will help you explore the main tools and features.",
    undefined,
    undefined,
    "first"
  );

  addStep(
    tour,
    "template-dropdown",
    "Template Selection",
    "Choose a template from this dropdown to edit and experiment with different configurations.",
    ".samples-element",
    "bottom"
  );

  addStep(
    tour,
    "toggle-editor",
    "Editor Panel",
    "Toggle the editor panel on or off. It contains the Concerto Model, TemplateMark, and JSON Data editors.",
    ".tour-editor"
  );

  addStep(
    tour,
    "toggle-preview",
    "Preview Window",
    "Show or hide the live preview to see the results of your template in real time.",
    ".tour-preview"
  );

  addStep(
    tour,
    "toggle-problems",
    "Problems Panel",
    "View compilation errors and warnings here to help debug your template.",
    ".tour-problems"
  );

  addStep(
    tour,
    "fullscreen-modal",
    "Fullscreen Preview",
    "Open the preview in fullscreen mode for better visibility.",
    ".tour-fullscreen"
  );

  addStep(
    tour,
    "template-share",
    "Share Template",
    "Generate a shareable link for your templates and collaborate easily.",
    ".tour-share"
  );

  addStep(
    tour,
    "start-tour-button",
    "Restart Tour",
    "Restart the guided tour anytime to review the Playground features.",
    ".tour-start-tour"
  );

  addStep(
    tour,
    "editor-settings",
    "Editor Settings",
    "Customize editor settings and configure your editing experience.",
    ".tour-settings"
  );

  addStep(
    tour,
    "ai-assistant",
    "AI Assistant",
    "Use the AI assistant to get help creating and editing templates.",
    ".tour-ai-assistant",
    "left"
  );

  addStep(
    tour,
    "concerto-model",
    "Concerto Model",
    "Define the data model including concepts, types, and relationships.",
    ".tour-concerto-model",
    "top"
  );

  addStep(
    tour,
    "template-mark",
    "TemplateMark Editor",
    "Write your natural language template with variables and logic.",
    ".tour-template-mark",
    "top"
  );

  addStep(
    tour,
    "json-data",
    "JSON Data",
    "Provide sample data matching your Concerto model to test templates.",
    ".tour-json-data",
    "top"
  );

  addStep(
    tour,
    "preview-panel",
    "Live Preview",
    "View the rendered output of your template.",
    ".tour-preview-panel",
    "top"
  );

  addStep(
    tour,
    "learn-button",
    "Learning Pathway",
    "Access documentation and tutorials to learn how to create templates effectively.",
    ".learnNow-button",
    "bottom",
    "last"
  );

}