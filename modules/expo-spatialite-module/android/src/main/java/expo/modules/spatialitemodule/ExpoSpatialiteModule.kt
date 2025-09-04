package expo.modules.spatialitemodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.os.Environment
import android.util.Log
import java.io.File
import jsqlite.Database
import jsqlite.Constants
import jsqlite.Stmt

class ExpoSpatialiteModule : Module() {
  private var db: Database? = null
  private var isConnected = false
  private var docDir: String? = null
  
  companion object {
    const val NAME = "ExpoSpatialiteModule"
    const val TAG = "ExpoSpatialiteModule"
  }

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoSpatialiteModule')` in JavaScript.
    Name(NAME)

    // Defines a JavaScript function that connects to the database
    AsyncFunction("connect") { params: Map<String, Any> ->
      try {
        val dbName = (params["dbName"] as? String)?.trim() ?: ""
        if (dbName.isEmpty()) {
          throw IllegalArgumentException("DBName can't be empty!")
        }

        val result = mutableMapOf<String, Any>()
        db = Database()

        docDir = if (params.containsKey("localPath")) {
          val localPath = (params["localPath"] as? String)?.trim() ?: ""
          if (localPath.isEmpty()) {
            throw IllegalArgumentException("Local path can't be empty!")
          }
          val mainPath = Environment.getExternalStorageDirectory()
          val directory = File("$mainPath/$localPath")
          if (!directory.isDirectory) directory.mkdirs()
          directory.absolutePath
        } else {
          appContext.reactContext?.getExternalFilesDir(null)?.absolutePath
        }

        val isReadonly = params["readonly"] as? Boolean ?: false
        val isSpatial = params["spatial"] as? Boolean ?: true

        val flags = if (isReadonly) {
          Constants.SQLITE_OPEN_READONLY
        } else {
          Constants.SQLITE_OPEN_READWRITE or Constants.SQLITE_OPEN_CREATE
        }

        db?.open("$docDir/$dbName", flags)
        
        // Check spatial initialized
        var spatialInitialized = false
        if (isSpatial) {
          try {
            spatialInitialized = db?.prepare("SELECT count(1) FROM spatial_ref_sys LIMIT 1")?.step() ?: false
          } catch (e: jsqlite.Exception) {
            if (e.message?.trim()?.startsWith("no such table: spatial_ref_sys") == true) {
              db?.exec("SELECT InitSpatialMetaData(1)", null)
              spatialInitialized = true
            }
          }
        }

        isConnected = true
        result["isConnected"] = isConnected
        result["isSpatial"] = spatialInitialized
        result
      } catch (e: Exception) {
        Log.e(TAG, "Error connecting to database", e)
        throw e
      }
    }

    // Defines a JavaScript function that closes the database connection
    AsyncFunction("close") {
      try {
        db?.close()
        isConnected = false
        val result = mutableMapOf<String, Any>()
        result["isConnected"] = isConnected
        result
      } catch (e: jsqlite.Exception) {
        Log.e(TAG, "Error closing database", e)
        throw e
      }
    }

    // Defines a JavaScript function that executes a query
    AsyncFunction("executeQuery") { query: String ->
      try {
        val stmt = db?.prepare(query)
        val rows = mutableListOf<Map<String, Any?>>()
        var rowCount = 0
        var colCount = 0

        while (stmt?.step() == true) {
          rowCount++
          if (colCount == 0) {
            colCount = stmt.column_count()
          }
          val row = mutableMapOf<String, Any?>()
          for (i in 0 until colCount) {
            val columnName = stmt.column_name(i).toLowerCase()
            when (stmt.column_type(i)) {
              Constants.SQLITE3_TEXT -> row[columnName] = stmt.column_string(i)
              Constants.SQLITE_INTEGER -> row[columnName] = stmt.column_long(i)
              Constants.SQLITE_FLOAT -> row[columnName] = stmt.column_double(i)
              Constants.SQLITE_NULL -> row[columnName] = null
              else -> row[columnName] = stmt.column_string(i)
            }
          }
          rows.add(row)
        }

        val result = mutableMapOf<String, Any>()
        result["rows"] = rowCount
        result["cols"] = colCount
        result["data"] = rows
        result
      } catch (e: jsqlite.Exception) {
        Log.e(TAG, "Error executing query: $query", e)
        throw e
      }
    }
  }
}
