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
      action: tour.cancel,
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: tour.next,
    },
  ],
});

tour.addStep({
  id: "samples",
  text: "Here is the 'Templates' dropdown. This dropdown contains various templates that you can edit and experiment with. Select a template to see and modify its details.",
  attachTo: {
    element: ".samples-element",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: tour.cancel,
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: tour.next,
    },
  ],
});

tour.addStep({
  id: "share",
  text: "Use this 'Share' button to generate and share a link for any created or edited templates. Share your work with others easily.",
  attachTo: {
    element: ".share-element",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: tour.cancel,
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: tour.next,
    },
  ],
});

tour.addStep({
  id: "preview",
  text: "This section shows the live preview of your template. View the results of your edits and see how your template renders.",
  attachTo: {
    element: ".preview-component",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: tour.cancel,
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: tour.next,
    },
  ],
});

tour.addStep({
  id: "darkmode",
  text: "Toggle between light and dark mode for a comfortable viewing experience. Switch themes to suit your preference while working on your template.",
  attachTo: {
    element: ".dark-mode-toggle",
    on: "bottom",
  },
  buttons: [
    {
      text: "Skip",
      action: tour.cancel,
      classes: "shepherd-button-secondary",
    },
    {
      text: "Next",
      action: tour.next,
    },
  ],
});

tour.addStep({
  id: "learnNow",
  text: 'Click the "Learn Now" button to access the Learning Pathway. Here, you will find comprehensive documentation and tutorials to help you create templates effectively.',
  attachTo: {
    element: ".learnNow-button",
    on: "bottom",
  },
  buttons: [
    {
      text: "Finish Tour",
      action: tour.cancel,
    },
  ],
});

export default tour;
