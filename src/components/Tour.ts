import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

const style = document.createElement("style");
style.textContent = `
  .shepherd-button-secondary {
    background-color: #6c757d !important;
  }
  .shepherd-button {
    background-color: #050c40 !important; 
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
