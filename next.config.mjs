import path from "path";

// `output: 'export'` is incompatible with `next dev` (it changes how webpack
// emits chunk manifests and causes ChunkLoadError in the browser dev server).
// Only apply static-export settings during `next build`.
const isStaticBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStaticBuild && {
    output: "export",
    distDir: "out",
  }),
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-native-async-storage/async-storage": path.resolve(
        "./src/shims/asyncStorage.ts"
      ),
    };

    // ENOSPC fix: switch to polling in dev so inotify watchers are not consumed.
    // Safe to remove once `fs.inotify.max_user_watches` is raised system-wide.
    if (dev) {
      config.watchOptions = {
        poll: 1000,           // check for changes every 1 second
        aggregateTimeout: 300, // debounce rebuilds by 300 ms
        ignored: ["**/node_modules/**", "**/.git/**", "**/out/**"],
      };
    }

    return config;
  },
};

export default nextConfig;
