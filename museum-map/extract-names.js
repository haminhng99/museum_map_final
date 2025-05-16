const fs = require('fs');

// Load the geojson
const geojson = JSON.parse(fs.readFileSync('data/museum-points.geojson', 'utf8'));

// Extract just ID and Name
const simplified = geojson.features.map(f => ({
  id: f.properties.OBJECTID,
  name: f.properties.Name
}));

// Save it
fs.writeFileSync('data/museum-names.json', JSON.stringify(simplified, null, 2));
console.log('Saved to museum-names.json');
