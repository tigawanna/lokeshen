import ExpoModulesCore

public class ExpoSpatialiteModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoSpatialite')` in JavaScript.
    Name("ExpoSpatialite")

    // Function to get the Spatialite version (not available on iOS)
    Function("getSpatialiteVersion") {
      throw NSError(domain: "ExpoSpatialite", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "ExpoSpatialite is not available on iOS"
      ])
    }

    // Function to execute a SQL query (not available on iOS)
    AsyncFunction("executeQuery") { (databasePath: String, sql: String, params: [Any]?) in
      throw NSError(domain: "ExpoSpatialite", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "ExpoSpatialite is not available on iOS"
      ])
    }

    // Function to execute a SQL statement (not available on iOS)
    AsyncFunction("executeStatement") { (databasePath: String, sql: String, params: [Any]?) in
      throw NSError(domain: "ExpoSpatialite", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "ExpoSpatialite is not available on iOS"
      ])
    }

    // Function to initialize a database (not available on iOS)
    AsyncFunction("initializeDatabase") { (databasePath: String) in
      throw NSError(domain: "ExpoSpatialite", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "ExpoSpatialite is not available on iOS"
      ])
    }
  }
}
