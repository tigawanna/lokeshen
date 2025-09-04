// @ts-nocheck
const { withProjectBuildGradle, withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');

const withSpatialiteModule = (config) => {
  // Add JitPack repository and Google maven repository to project build.gradle
  config = withProjectBuildGradle(config, (config) => {
    // Add JitPack repository if not already present
    if (!config.modResults.contents.includes('jitpack.io')) {
      // Add JitPack repository to allprojects block
      const newContents = config.modResults.contents.replace(
        /(allprojects\s*{[^}]*repositories\s*{)/,
        `$1
        maven { url 'https://www.jitpack.io' }`
      );

      // If allprojects block doesn't exist or replacement failed, add it to the end
      if (newContents === config.modResults.contents) {
        config.modResults.contents = config.modResults.contents.replace(
          /}\s*$/,
          `allprojects {
    repositories {
        maven { url 'https://www.jitpack.io' }
        google()
    }
}
}`
        );
      } else {
        config.modResults.contents = newContents;
      }
    }

    // Add Google maven repository if not already present
    if (!config.modResults.contents.includes('google()')) {
      config.modResults.contents = config.modResults.contents.replace(
        /(allprojects\s*{[^}]*repositories\s*{)/,
        `$1
        google()`
      );
    }

    return config;
  });

  // Add dependency to app build.gradle and handle AndroidX migration
  config = withAppBuildGradle(config, (config) => {
    // Add the dependency to dependencies block
    if (!config.modResults.contents.includes('com.github.mvits:Geo-Spatialite-Android')) {
      config.modResults.contents = config.modResults.contents.replace(
        /(dependencies\s*{)/,
        `$1
    implementation 'com.github.mvits:Geo-Spatialite-Android:1.0.2'
    implementation 'androidx.appcompat:appcompat:1.6.1'`
      );
    }

    // Add packaging options to resolve duplicate file conflicts
    if (!config.modResults.contents.includes('packagingOptions')) {
      config.modResults.contents = config.modResults.contents.replace(
        /(android\s*{)/,
        `$1
    packagingOptions {
        pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
        pickFirst 'META-INF/androidx.versionedparcelable_versionedparcelable.version'
    }`
      );
    }

    return config;
  });

  // Modify AndroidManifest to handle manifest merger issues
  config = withAndroidManifest(config, (config) => {
    // Find the application element
    const application = config.modResults.manifest.application[0];
    
    // Add tools namespace if not present
    if (!config.modResults.manifest.$['xmlns:tools']) {
      config.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }
    
    // Add tools:replace attribute to handle manifest merger issues
    if (!application.$['tools:replace']) {
      application.$['tools:replace'] = 'android:appComponentFactory';
    }
    
    // Add the appComponentFactory attribute
    if (!application.$['android:appComponentFactory']) {
      application.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    }
    
    return config;
  });

  return config;
};

module.exports = withSpatialiteModule;