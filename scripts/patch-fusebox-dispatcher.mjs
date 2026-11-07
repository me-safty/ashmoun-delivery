import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "node_modules", ".pnpm");
const needle = "setUpFuseboxReactDevToolsDispatcher.js";
const re = /Object\.defineProperty\(global, '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__', \{\s*value: FuseboxReactDevToolsDispatcher,\s*configurable: false,\s*enumerable: false,\s*writable: false,\s*\}\);/;

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (!dir.includes("react-native@") && !e.name.startsWith("react-native@")) continue;
    const p = path.join(dir, e.name);
    if (e.name === "node_modules" || p.includes("react-native")) walk(p, out);
  }
  return out;
}

function findFiles(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name === needle) out.push(p);
    else if (e.isDirectory() && (e.name.startsWith("react-native@") || p.includes(`${path.sep}react-native${path.sep}`) || p.includes(`${path.sep}react-native@`))) findFiles(p, out);
  }
  return out;
}

const files = findFiles(root);
if (!files.length) {
  console.error("No dispatcher files found under node_modules/.pnpm/react-native@*");
  process.exit(1);
}
let patched = 0;
for (const file of files) {
  const t = fs.readFileSync(file, "utf8");
  if (t.includes("if (!global.__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__)")) {
    console.log("Already patched:", file);
    continue;
  }
  if (!re.test(t)) {
    console.log("Pattern not found (skipped):", file);
    continue;
  }
  const next = t.replace(re, `if (!global.__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__) {
  Object.defineProperty(global, '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__', {
    value: FuseboxReactDevToolsDispatcher,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}`);
  fs.writeFileSync(file, next, "utf8");
  console.log("Patched:", file);
  patched++;
}
console.log(`Done. Patched ${patched} file(s).`);
