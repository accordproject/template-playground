/**
 * Node conversion utilities for serializing between TemplateMark JSON and TipTap.
 * 
 * This file re-exports from the focused converter modules for backward compatibility.
 * New code should import directly from './converters'.
 * 
 * @see ./converters/tmToTiptap.ts - TemplateMark → TipTap conversion
 * @see ./converters/tiptapToTm.ts - TipTap → TemplateMark conversion
 */
export { tmNodeToTipTap, convertChildren } from './converters/tmToTiptap';
export { tipTapNodeToTM, convertTipTapChildren } from './converters/tiptapToTm';
