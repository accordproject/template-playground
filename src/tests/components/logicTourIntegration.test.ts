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

import { describe, it, expect, beforeEach, vi } from "vitest";
import tour from "../../components/Tour";
import useAppStore from "../../store/store";

describe("Tour integration", () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      isLogicFeatureEnabled: true,
      logicTs: "contract Logic {}",
      isLogicPanelVisible: false,
      isContractRunnerVisible: false,
      isEditorsVisible: true,
      isPreviewVisible: true,
    });
  });

  it("exports a valid Shepherd Tour instance containing general and logic steps", () => {
    expect(tour).toBeDefined();
    expect(tour.steps).toBeDefined();
    expect(tour.steps.length).toBeGreaterThanOrEqual(20);

    const stepIds = tour.steps.map((s: any) => s.id);

    expect(stepIds).toContain("intro");
    expect(stepIds).toContain("preview-panel");
    expect(stepIds).toContain("logic-transition-prompt");
    expect(stepIds).toContain("logic-editor");
    expect(stepIds).toContain("apply-compile");
    expect(stepIds).toContain("init-contract");
    expect(stepIds).toContain("request-editor");
    expect(stepIds).toContain("send-request");
    expect(stepIds).toContain("view-results");
    expect(stepIds).toContain("learn-button");
  });

  it("opens logic panel when Start Logic Tour is triggered from transition prompt step", async () => {
    const promptStep = tour.steps.find((s: any) => s.id === "logic-transition-prompt");
    expect(promptStep).toBeDefined();

    const buttons = promptStep?.options?.buttons ?? [];
    const startLogicButton = buttons.find((b: any) => b.text === "Start Logic Tour");
    expect(startLogicButton).toBeDefined();

    const showSpy = vi.spyOn(tour, "show").mockImplementation(() => tour as any);

    if (startLogicButton?.action) {
      startLogicButton.action.call(tour);
    }

    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(useAppStore.getState().isLogicPanelVisible).toBe(true);
    expect(useAppStore.getState().isContractRunnerVisible).toBe(true);
    expect(showSpy).toHaveBeenCalledWith("logic-editor");
    expect(localStorage.getItem("hasVisitedLogicTour")).toBe("true");
  });

  it("cancels tour and sets hasVisitedLogicTour when Skip is selected at transition prompt", () => {
    const promptStep = tour.steps.find((s: any) => s.id === "logic-transition-prompt");
    expect(promptStep).toBeDefined();

    const buttons = promptStep?.options?.buttons ?? [];
    const skipButton = buttons.find((b: any) => b.text === "Skip");
    expect(skipButton).toBeDefined();

    const cancelSpy = vi.spyOn(tour, "cancel").mockImplementation(() => tour as any);

    if (skipButton?.action) {
      skipButton.action.call(tour);
    }

    expect(cancelSpy).toHaveBeenCalled();
    expect(localStorage.getItem("hasVisitedLogicTour")).toBe("true");
  });

  it("automatically triggers logic tour on first-time load of a logic sample", async () => {
    localStorage.removeItem("hasVisitedLogicTour");
    const showSpy = vi.spyOn(tour, "show").mockImplementation(() => tour as any);

    await useAppStore.getState().loadSample("Counter Contract (with Logic)");
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(localStorage.getItem("hasVisitedLogicTour")).toBe("true");
    expect(showSpy).toHaveBeenCalledWith("logic-transition-prompt");
  }, 20000);
});
