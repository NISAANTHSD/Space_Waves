const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "vite",
  "dist",
  "node",
  "chunks",
  "chunk.js"
);

if (fs.existsSync(target)) {
  process.exit(0);
}

const viteRoot = path.join(__dirname, "..", "node_modules", "vite");
if (!fs.existsSync(viteRoot)) {
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });

const content = `import { createRequire } from "node:module";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (all, symbols) => {
\tlet target = {};
\tfor (var name in all) {
\t\t__defProp(target, name, {
\t\t\tget: all[name],
\t\t\tenumerable: true
\t\t});
\t}
\tif (symbols) {
\t\t__defProp(target, Symbol.toStringTag, { value: "Module" });
\t}
\treturn target;
};
var __copyProps = (to, from, except, desc) => {
\tif (from && typeof from === "object" || typeof from === "function") {
\t\tfor (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
\t\t\tkey = keys[i];
\t\t\tif (!__hasOwnProp.call(to, key) && key !== except) {
\t\t\t\t__defProp(to, key, {
\t\t\t\t\tget: ((k) => from[k]).bind(null, key),
\t\t\t\t\tenumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
\t\t\t\t});
\t\t\t}
\t\t}
\t}
\treturn to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
\tvalue: mod,
\tenumerable: true
}) : target, mod));
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __toDynamicImportESM = (isNodeMode) => (mod) => __toESM(mod.default, isNodeMode);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

//#endregion
export { __toCommonJS as a, __require as i, __esmMin as n, __toDynamicImportESM as o, __export as r, __toESM as s, __commonJSMin as t };
`;

fs.writeFileSync(target, content, "utf8");
