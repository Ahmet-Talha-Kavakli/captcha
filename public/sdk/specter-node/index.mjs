/**
 * @veylify/node — ESM entry point.
 * Re-exports the CommonJS implementation so `import { VeylifyClient } from
 * "@veylify/node"` works in native ESM projects.
 *
 * `SpecterClient` / `SpecterError` remain exported as back-compat aliases.
 */
import mod from "./veylify.js";

export const VeylifyClient = mod.VeylifyClient;
export const VeylifyError = mod.VeylifyError;
// Back-compat aliases.
export const SpecterClient = mod.VeylifyClient;
export const SpecterError = mod.VeylifyError;
export const DEFAULT_BASE_URL = mod.DEFAULT_BASE_URL;
export default mod.VeylifyClient;
