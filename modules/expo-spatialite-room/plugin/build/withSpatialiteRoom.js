"use strict";
// @ts-nocheck
const { withProjectBuildGradle } = require('@expo/config-plugins');
const withSpatialiteRoom = (config) => {
    // Add JitPack repository to project build.gradle
    config = withProjectBuildGradle(config, (config) => {
        // Add JitPack repository if not already present
        if (!config.modResults.contents.includes('jitpack.io')) {
            // Add JitPack repository to allprojects block
            const newContents = config.modResults.contents.replace(/(allprojects\s*{[^}]*repositories\s*{)/, `$1\n        maven { url 'https://www.jitpack.io' }`);
            // If allprojects block doesn't exist or replacement failed, add it to the end
            if (newContents === config.modResults.contents) {
                config.modResults.contents = config.modResults.contents.replace(/}\s*$/, `allprojects {
    repositories {
        maven { url 'https://www.jitpack.io' }
    }
}\n}`);
            }
            else {
                config.modResults.contents = newContents;
            }
        }
        return config;
    });
    return config;
};
module.exports = withSpatialiteRoom;
