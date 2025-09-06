#!/usr/bin/env node

// This script generates a preloaded Spatialite database with Kenya wards data
// It should be run during the build process to create the database file

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if spatialite-tools is installed
try {
  execSync('spatialite --version', { stdio: 'pipe' });
} catch (error) {
  console.error('Error: spatialite-tools is not installed or not in PATH');
  console.error('Please install spatialite-tools:');
  console.error('  Ubuntu/Debian: sudo apt-get install spatialite-bin');
  console.error('  macOS: brew install libspatialite');
  console.error('  Windows: Download from https://www.gaia-gis.it/gaia-sins/');
  process.exit(1);
}

// Create the database file
const dbPath = path.join(__dirname, '..', '..', 'assets', 'kenya_wards.db');
const sqlPath = path.join(__dirname, '..', '..', 'kenya_wards.sql');

console.log('Generating preloaded Spatialite database...');

// Create the SQL file first
console.log('Creating SQL file...');
execSync(`node ${path.join(__dirname, 'generate-sql.js')} > ${sqlPath}`, { stdio: 'inherit' });

// Create the database and load the data
console.log('Creating Spatialite database...');
try {
  execSync(`spatialite ${dbPath} < ${sqlPath}`, { stdio: 'inherit' });
  console.log('Database created successfully!');
  
  // Clean up the SQL file
  fs.unlinkSync(sqlPath);
  
  console.log(`Preloaded database created at: ${dbPath}`);
} catch (error) {
  console.error('Error creating database:', error);
  process.exit(1);
}