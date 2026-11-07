import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const shimPath = path.join(
  root,
  "node_modules",
  "react-native",
  "Libraries",
  "Renderer",
  "shims",
  "ReactNative.js",
);

if (fs.existsSync(shimPath)) process.exit(0);

const dir = path.dirname(shimPath);
if (!fs.existsSync(dir)) process.exit(0);

fs.writeFileSync(
  shimPath,
  `/**
 * Shim for libraries that still import react-native/Libraries/Renderer/shims/ReactNative.
 * RN 0.88+ removed this file; re-export from RendererImplementation.
 */
export {
  findHostInstance_DEPRECATED,
  findNodeHandle,
} from '../../ReactNative/RendererImplementation';
`,
  "utf8",
);
