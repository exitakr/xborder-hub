// Metro configuration for a package inside an npm workspace.
//
// Without this, Metro only watches apps/mobile and cannot resolve @kura/core,
// which lives at the workspace root and is symlinked into node_modules.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so edits to @kura/core trigger a rebuild.
config.watchFolders = [workspaceRoot];

// Resolve from the app first, then the hoisted workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// @kura/core is published as TypeScript source with explicit .ts import
// specifiers, so Metro must treat those as resolvable source extensions.
config.resolver.sourceExts = [...config.resolver.sourceExts, "ts", "tsx"];

// Prefer a single copy of React; two copies break hooks at runtime.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
