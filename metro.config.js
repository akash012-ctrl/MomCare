const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Create shims for problematic dependencies
const frameworkMotionShim = path.resolve(__dirname, './shims/framer-motion-shim.js');
const tslibShim = path.resolve(__dirname, './shims/tslib.js');
const nanoidNonSecureShim = path.resolve(__dirname, './shims/nanoid-non-secure.js');

// Map problematic packages to shims
config.resolver.alias = {
    ...(config.resolver.alias || {}),
    'framer-motion': frameworkMotionShim,
    'tslib': tslibShim,
    'nanoid/non-secure': nanoidNonSecureShim,
};

// Ensure proper source extensions
config.resolver.sourceExts = [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'mjs',
    'cjs',
];

// Block web-only CSS modules
config.resolver.blockList = [
    ...(config.resolver.blockList || []),
    /\.css$/,
    /\.module\.css$/,
    /\.web\.css$/,
];

// Fix for InternalBytecode.js error in React Native new architecture
config.transformer = {
    ...config.transformer,
    getTransformOptions: async () => ({
        transform: {
            experimentalImportSupport: false,
            inlineRequires: true,
        },
    }),
    // Disable Hermes bytecode to prevent InternalBytecode.js errors
    hermesParser: false,
};

// Enable unstable_allowRequireContext for expo-router
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
