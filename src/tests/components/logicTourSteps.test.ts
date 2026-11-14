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
import { getLogicPromptStep, getLogicWorkflowSteps } from "../../components/logicTourSteps";

describe("logicTourSteps", () => {
  it("generates universal logic prompt step with correct text and action buttons", () => {
    const onStartLogic = vi.fn();
    const onFinish = vi.fn();

    const step = getLogicPromptStep(onStartLogic, onFinish);

    expect(step.id).toBe("logic-transition-prompt");
    expect(step.text).toContain("Ready to bring your contract to life?");
    expect(step.text).toContain("run and execute smart contract logic directly in the Playground");
    expect(step.buttons).toHaveLength(2);

    expect(step.buttons[0].text).toBe("Skip");
    expect(step.buttons[0].classes).toBe("shepherd-button-secondary");
    step.buttons[0].action({} as any);
    expect(onFinish).toHaveBeenCalled();

    expect(step.buttons[1].text).toBe("Start Logic Tour");
    step.buttons[1].action({} as any);
    expect(onStartLogic).toHaveBeenCalled();
  });

  it("generates 6 logic workflow step definitions with valid selectors and buttons", () => {
    const onCancel = vi.fn();
    const onNext = vi.fn();

    const steps = getLogicWorkflowSteps(onCancel, onNext);

    expect(steps).toHaveLength(6);

    const expectedIds = [
      "logic-editor",
      "apply-compile",
      "init-contract",
      "request-editor",
      "send-request",
      "view-results",
    ];

    steps.forEach((step, index) => {
      expect(step.id).toBe(expectedIds[index]);
      expect(step.text.length).toBeGreaterThan(10);
      expect(step.attachTo).toBeDefined();
      expect(step.attachTo?.element).toMatch(/^\.tour-/);
      expect(step.buttons.length).toBeGreaterThanOrEqual(1);
    });

    // Test button actions on first step
    steps[0].buttons[0].action({} as any);
    expect(onCancel).toHaveBeenCalled();

    steps[0].buttons[1].action({} as any);
    expect(onNext).toHaveBeenCalled();
  });
});
