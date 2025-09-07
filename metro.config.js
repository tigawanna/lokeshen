// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
    ...config.resolver.assetExts,
    'db', // Add this line
    'sqlite',
];

module.exports = config;
