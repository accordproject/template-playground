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

/**
 * Minimal shape for a tour navigation button.
 * Matches the subset of {@link Shepherd.StepOptionsButton} that this module produces.
 */
export interface TourNavButton {
  text: string;
  action: () => void;
  classes?: string;
}

/**
 * Returns a lazy title function that resolves to "Step X/total" when called.
 * The total is read from {@link tour.steps.length} at call time, so it always
 * reflects the actual number of configured steps — never a hardcoded value.
 *
 * @param stepIndex - 1-based display index for this step.
 * @param tour - The Shepherd tour instance (accessed at display time).
 */
export const makeStepTitle = (
  stepIndex: number,
  tour: ShepherdTourInstance
): (() => string) =>
  () => `Step ${stepIndex}/${tour.steps.length}`;

/**
 * Builds the standard navigation buttons for a tour step.
 *
 * - Step 1 (isFirstStep): Skip, Next
 * - All other steps:       Back, Skip, Next
 *
 * @param stepIndex - 1-based display index for this step.
 * @param tour - The Shepherd tour instance.
 */
export const buildNavButtons = (
  stepIndex: number,
  tour: ShepherdTourInstance
): TourNavButton[] => {
  const isFirstStep = stepIndex === 1;

  const backButton: TourNavButton = {
    text: "Back",
    action: () => tour.back(),
    classes: "shepherd-button-secondary",
  };

  const skipButton: TourNavButton = {
    text: "Skip",
    action: () => void tour.cancel(),
    classes: "shepherd-button-secondary",
  };

  const nextButton: TourNavButton = {
    text: "Next",
    action: () => tour.next(),
  };

  return isFirstStep
    ? [skipButton, nextButton]
    : [backButton, skipButton, nextButton];
};
