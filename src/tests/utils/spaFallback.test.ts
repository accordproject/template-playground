import { describe, it, expect } from "vitest";
import { steps } from "../../constants/learningSteps/steps";
import {
  getStaticSpaRoutes,
  spaFallbackIndexPaths,
} from "../../utils/spaRoutes";

describe("getStaticSpaRoutes", () => {
  it("includes /learn and every learning step path", () => {
    const routes = getStaticSpaRoutes();
    expect(routes).toContain("/learn");
    for (const step of steps) {
      expect(routes).toContain(step.link);
    }
    expect(routes).not.toContain("/");
  });
});

describe("spaFallbackIndexPaths", () => {
  it("maps known routes to dist-relative index.html files", () => {
    expect(spaFallbackIndexPaths()).toEqual(
      expect.arrayContaining([
        "learn/index.html",
        "learn/intro/index.html",
        "learn/module1/index.html",
        "learn/module2/index.html",
        "learn/module3/index.html",
      ]),
    );
    expect(spaFallbackIndexPaths(["/", "/learn/intro/"])).toEqual([
      "learn/intro/index.html",
    ]);
  });
});
