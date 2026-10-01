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

import { describe, it, expect, vi } from "vitest";
import { makeStepTitle, buildNavButtons } from "../../components/tourUtils";

/**
 * Minimal mock of a Shepherd tour instance for testing tourUtils helpers.
 * Only the properties and methods actually used by the helpers are mocked.
 */
const makeMockTour = (totalSteps: number) => ({
  steps: Array.from({ length: totalSteps }, (_, i) => ({ id: `step-${i}` })),
  back: vi.fn(),
  cancel: vi.fn(() => Promise.resolve()),
  next: vi.fn(),
});

describe("tourUtils — makeStepTitle (Issue #763: step counter)", () => {
  it("returns a function (title is evaluated lazily)", () => {
    const tour = makeMockTour(22);
    const titleFn = makeStepTitle(1, tour as any);
    expect(typeof titleFn).toBe("function");
  });

  it("step 1/22: title resolves to 'Step 1/22'", () => {
    const tour = makeMockTour(22);
    expect(makeStepTitle(1, tour as any)()).toBe("Step 1/22");
  });

  it("step 2/22: title resolves to 'Step 2/22'", () => {
    const tour = makeMockTour(22);
    expect(makeStepTitle(2, tour as any)()).toBe("Step 2/22");
  });

  it("final step: title resolves to 'Step <total>/<total>'", () => {
    const tour = makeMockTour(22);
    const total = tour.steps.length;
    expect(makeStepTitle(total, tour as any)()).toBe(
      `Step ${total}/${total}`
    );
  });

  it("total is read from tour.steps.length (not hardcoded)", () => {
    // If total were hardcoded the assertion below would fail for different totals
    const tour5 = makeMockTour(5);
    expect(makeStepTitle(3, tour5 as any)()).toBe("Step 3/5");

    const tour10 = makeMockTour(10);
    expect(makeStepTitle(3, tour10 as any)()).toBe("Step 3/10");
  });

  it("title reflects the total at call time (lazy evaluation)", () => {
    const tour = makeMockTour(5);
    const titleFn = makeStepTitle(1, tour as any);

    // Before any change: 5 steps
    expect(titleFn()).toBe("Step 1/5");

    // Simulate steps being added dynamically
    (tour.steps as any[]).push({ id: "extra-step" });
    expect(titleFn()).toBe("Step 1/6");
  });
});

describe("tourUtils — buildNavButtons (Issue #763: Back navigation)", () => {
  it("step 1 has no Back button", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(1, tour as any) ?? [];
    const texts = buttons.map((b: any) => b.text);
    expect(texts).not.toContain("Back");
  });

  it("step 1 has Skip and Next buttons", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(1, tour as any) ?? [];
    const texts = buttons.map((b: any) => b.text);
    expect(texts).toContain("Skip");
    expect(texts).toContain("Next");
  });

  it("step 2 has Back, Skip and Next buttons", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(2, tour as any) ?? [];
    const texts = buttons.map((b: any) => b.text);
    expect(texts).toContain("Back");
    expect(texts).toContain("Skip");
    expect(texts).toContain("Next");
  });

  it("step 10 (mid-tour) has Back, Skip and Next buttons", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(10, tour as any) ?? [];
    const texts = buttons.map((b: any) => b.text);
    expect(texts).toContain("Back");
    expect(texts).toContain("Skip");
    expect(texts).toContain("Next");
  });

  it("step 22 (last step) produced by buildNavButtons has Back, Skip and Next", () => {
    // Note: the actual final step uses a custom button set (Finish Tour), but
    // buildNavButtons itself always produces Back/Skip/Next for non-first steps
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(22, tour as any) ?? [];
    const texts = buttons.map((b: any) => b.text);
    expect(texts).toContain("Back");
    expect(texts).toContain("Next");
  });

  it("Back button action calls tour.back()", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(2, tour as any) ?? [];
    const backButton = (buttons as any[]).find((b) => b.text === "Back");
    expect(backButton).toBeDefined();
    backButton.action();
    expect(tour.back).toHaveBeenCalledOnce();
  });

  it("Skip button action calls tour.cancel()", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(2, tour as any) ?? [];
    const skipButton = (buttons as any[]).find((b) => b.text === "Skip");
    expect(skipButton).toBeDefined();
    skipButton.action();
    expect(tour.cancel).toHaveBeenCalledOnce();
  });

  it("Next button action calls tour.next()", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(2, tour as any) ?? [];
    const nextButton = (buttons as any[]).find((b) => b.text === "Next");
    expect(nextButton).toBeDefined();
    nextButton.action();
    expect(tour.next).toHaveBeenCalledOnce();
  });

  it("step 1 returns exactly 2 buttons (Skip, Next)", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(1, tour as any) ?? [];
    expect(buttons).toHaveLength(2);
  });

  it("step 2+ returns exactly 3 buttons (Back, Skip, Next)", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(2, tour as any) ?? [];
    expect(buttons).toHaveLength(3);
  });

  it("Back button has the shepherd-button-secondary CSS class", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(2, tour as any) ?? [];
    const backButton = (buttons as any[]).find((b) => b.text === "Back");
    expect(backButton?.classes).toBe("shepherd-button-secondary");
  });

  it("Skip button has the shepherd-button-secondary CSS class", () => {
    const tour = makeMockTour(22);
    const buttons = buildNavButtons(1, tour as any) ?? [];
    const skipButton = (buttons as any[]).find((b) => b.text === "Skip");
    expect(skipButton?.classes).toBe("shepherd-button-secondary");
  });
});
