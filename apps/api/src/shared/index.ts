/**
 * Shared cross-module utilities (re-export barrel).
 * Add module-agnostic helpers here as the codebase grows.
 */
export { sendError, sendSuccess, asyncHandler } from '../utils/index.js';
export { AppError } from '../errors/index.js';
