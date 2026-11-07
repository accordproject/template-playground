// ❕ learning module steps/paths

export interface LearningStep {
  title: string;
  link: string;
  /** Sample template associated with this learning module to load in the Playground */
  sampleName?: string;
}

export const steps: LearningStep[] = [
  { title: "Overview", link: "/learn/intro", sampleName: "Hello World" },
  { title: "Module 1", link: "/learn/module1", sampleName: "Hello World" },
  { title: "Module 2", link: "/learn/module2", sampleName: "Hello World" },
  { title: "Module 3", link: "/learn/module3", sampleName: "Hello World" },
];
