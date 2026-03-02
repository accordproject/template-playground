import { render } from "@testing-library/react";
import Shepherd from "shepherd.js";

import Tour from "../../components/Tour";
import { addTourSteps } from "../../tour/tourSteps";
import { getProgress } from "../../tour/tourUtils";


describe("Template Playground Tour", () => {

  /* ----------------------------
     Component Test
  -----------------------------*/

  test("renders Tour component without crashing", () => {

    render(<Tour />);

  });


  /* ----------------------------
     Steps Test
  -----------------------------*/

  test("adds all 15 tour steps", () => {

    const tour = new Shepherd.Tour();

    addTourSteps(tour);

    expect(tour.steps.length).toBe(15);

  });


  /* ----------------------------
     Step IDs Test
  -----------------------------*/

  test("tour contains expected step ids", () => {

    const tour = new Shepherd.Tour();

    addTourSteps(tour);

    const ids = tour.steps.map(step => step.id);

    expect(ids).toContain("intro");
    expect(ids).toContain("template-dropdown");
    expect(ids).toContain("toggle-editor");
    expect(ids).toContain("toggle-preview");
    expect(ids).toContain("toggle-problems");
    expect(ids).toContain("fullscreen-modal");
    expect(ids).toContain("template-share");
    expect(ids).toContain("start-tour-button");
    expect(ids).toContain("editor-settings");
    expect(ids).toContain("ai-assistant");
    expect(ids).toContain("concerto-model");
    expect(ids).toContain("template-mark");
    expect(ids).toContain("json-data");
    expect(ids).toContain("preview-panel");
    expect(ids).toContain("learn-button");

  });


  /* ----------------------------
     Progress Utility Test
  -----------------------------*/

  test("getProgress returns step progress string", () => {

    const tour = new Shepherd.Tour();

    addTourSteps(tour);

    tour.start();

    const progress = getProgress(tour);

    expect(progress).toContain("Step");

  });


  /* ----------------------------
     Tour Navigation Test
  -----------------------------*/

  test("tour next step works", () => {

    const tour = new Shepherd.Tour();

    addTourSteps(tour);

    tour.start();

    const firstStep = tour.currentStep?.id;

    tour.next();

    const secondStep = tour.currentStep?.id;

    expect(firstStep).not.toBe(secondStep);

  });

});