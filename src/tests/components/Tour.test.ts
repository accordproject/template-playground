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
import tour from "../../components/Tour";

describe("Guided Tour - Step Counter and Back Button Navigation", () => {
  it("includes dynamic step counter titles on every step", () => {
    expect(tour.steps.length).toBeGreaterThan(0);
    const totalSteps = tour.steps.length;

    tour.steps.forEach((step: any, index: number) => {
      const expectedTitle = `Step ${index + 1}/${totalSteps}`;
      expect(step.options.title).toBe(expectedTitle);
    });
  });

  it("does not include a Back button on the first step (intro)", () => {
    const firstStep = tour.steps[0];
    expect(firstStep.id).toBe("intro");

    const buttons = firstStep.options.buttons || [];
    const buttonTexts = buttons.map((b: any) => b.text);

    expect(buttonTexts).toContain("Skip");
    expect(buttonTexts).toContain("Next");
    expect(buttonTexts).not.toContain("Back");
  });

  it("includes a Back button on step 2 through the second-to-last step", () => {
    const totalSteps = tour.steps.length;

    for (let i = 1; i < totalSteps - 1; i++) {
      const step = tour.steps[i];
      const buttons = step.options.buttons || [];
      const buttonTexts = buttons.map((b: any) => b.text);

      expect(buttonTexts).toContain("Back");
      const backButton = buttons.find((b: any) => b.text === "Back");
      expect(backButton.classes).toBe("shepherd-button-secondary");

      // Verify Back is the first button in the step's button array
      expect(buttons[0].text).toBe("Back");
    }
  });

  it("includes a Back button and Finish Tour button on the final step", () => {
    const lastStep = tour.steps[tour.steps.length - 1];
    expect(lastStep.id).toBe("learn-button");

    const buttons = lastStep.options.buttons || [];
    const buttonTexts = buttons.map((b: any) => b.text);

    expect(buttonTexts).toEqual(["Back", "Finish Tour"]);
    const backButton = buttons.find((b: any) => b.text === "Back");
    expect(backButton.classes).toBe("shepherd-button-secondary");
  });

  it("triggers tour.back() when the Back button is clicked", () => {
    const secondStep = tour.steps[1];
    const backButton = secondStep.options.buttons.find((b: any) => b.text === "Back");
    expect(backButton).toBeDefined();

    const backSpy = vi.spyOn(tour, "back").mockImplementation(() => {});
    backButton.action.call(tour);

    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });
});
