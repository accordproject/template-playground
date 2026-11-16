import agentInstructions from "./agents.md?raw";
import editorExtensions from "./extensions.json";

export const AGENT_INSTRUCTIONS = agentInstructions;

export const EDITOR_EXTENSIONS = JSON.stringify(editorExtensions, null, 2);