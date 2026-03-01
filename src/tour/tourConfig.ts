import Shepherd from "shepherd.js";
import { addTourSteps } from "./tourSteps";

export function createTour() {

  const tour = new Shepherd.Tour({

    defaultStepOptions: {
      classes: "shepherd-theme-arrows",
      scrollTo: true
    },

    useModalOverlay: true

  });

  addTourSteps(tour);

  return tour;

}