/**
 * @veylify/node — legacy CommonJS entry point (back-compat).
 * =========================================================
 * This file used to hold the implementation when the SDK was named "Specter".
 * The implementation now lives in ./veylify.js. This shim re-exports it so any
 * code still doing `require("@specter/node")` / `require(".../specter.js")`
 * keeps working. New code should import from "@veylify/node".
 */

"use strict";

module.exports = require("./veylify.js");
