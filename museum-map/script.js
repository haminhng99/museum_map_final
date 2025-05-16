const map = L.map('map').setView([40.7831, -73.9712], 12);

// Base layers
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd'
}).addTo(map);

const overlays = {};

// Geocoder
L.Control.geocoder({
  defaultMarkGeocode: true,
  position: 'topright'
}).addTo(map);

const layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(map);

var markers = L.markerClusterGroup();
map.addLayer(markers);

// Data storage
let allGeoJsonFeatures = [];
let genreCounts = {};
let museumImages = {};
let currentGenre = 'all';

const subwayIcon = L.icon({
  iconUrl: 'assets/icons/station.svg',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -10]
});

const purpleIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// MUSEUM POINTS
fetch('data/museum-points.geojson')
  .then(res => res.json())
  .then(data => {
    allGeoJsonFeatures = data.features;
    genreCounts = allGeoJsonFeatures.reduce((acc, feature) => {
      const genre = feature.properties.Genre?.toLowerCase() || 'unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      acc['all'] = (acc['all'] || 0) + 1;
      return acc;
    }, {});
    generateGenreButtons(genreCounts);
    renderFilteredFeatures('all');
  });

fetch('data/museum-images.json')
  .then(res => res.json())
  .then(imgData => {
    museumImages = imgData;
    renderFilteredFeatures(currentGenre);
  });

// SUBWAY STATIONS

fetch('data/subway_station.geojson')
  .then(res => res.json())
  .then(data => {
    const subwayStationLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.marker(latlng, { icon: subwayIcon }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<strong>${feature.properties.name || 'Subway Station'}</strong>`);
      }
    });
    overlays["Subway Stations"] = subwayStationLayer;
    layerControl.addOverlay(subwayStationLayer, "Subway Stations");
  });

// SUBWAY LINES
fetch('data/subway_lines.geojson')
  .then(res => res.json())
  .then(data => {
    const subwayLineLayer = L.geoJSON(data, {
      style: feature => {
        const group = (feature.properties.Subway_Group || '').toUpperCase().replace(/\.\s*/g, ', ');
        const colorMap = {
          '1, 2, 3': '#EE352E',
          '4, 5, 6': '#00933C',
          'A, C, E': '#0039A6',
          'B, D, F, M': '#FF6319',
          'G': '#6CBE45',
          'J, Z': '#996633',
          'L': '#A7A9AC',
          'N, Q, R, W': '#FCCC0A',
          'S': '#808183',
          '7': '#B933AD'
        };
        return {
          color: colorMap[group] || '#888',
          weight: 2
        };
      },
      onEachFeature: (feature, layer) => {
        const groupName = (feature.properties.Subway_Group || 'Subway Line').toUpperCase().replace(/\.\s*/g, ', ');
        layer.bindPopup(`<strong>${groupName}</strong>`);
      }
    }).addTo(map);
    overlays["Subway Lines"] = subwayLineLayer;
    layerControl.addOverlay(subwayLineLayer, "Subway Lines");
  });

// CULTURAL ORGS
fetch('data/cultural_org.geojson')
  .then(res => res.json())
  .then(data => {
    const culturalOrgLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        radius: 5,
        fillColor: '#e76f51',
        color: '#fff',
        weight: 1,
        fillOpacity: 0.9
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<strong>${feature.properties.name || 'Cultural Organization'}</strong>`);
      }
    });
    overlays["Cultural Orgs"] = culturalOrgLayer;
    layerControl.addOverlay(culturalOrgLayer, "Cultural Orgs");
  });

// HOTEL DENSITY
fetch('data/hotel_density.geojson')
  .then(res => res.json())
  .then(data => {
    const counts = data.features.map(f =>
      f.properties.Join_Count ?? f.properties.join_count ?? 0
    );
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    const hotelDensityLayer = L.geoJSON(data, {
      style: feature => {
        const count = feature.properties.Join_Count ?? feature.properties.join_count ?? 0;
        const ratio = (count - minCount) / (maxCount - minCount || 1);
        return {
          fillColor: '#66C7E9',
          color: '#66C7E9',
          weight: 0.5,
          fillOpacity: count === 0 ? 0 : 0.2 + 0.6 * ratio
        };
      },
      onEachFeature: (feature, layer) => {
        const count = feature.properties.Join_Count ?? feature.properties.join_count ?? 'N/A';
        if (count > 0) {
          layer.bindPopup(`# of Hotels: ${count}`);
        }
      }
    });
    overlays["Hotel Density"] = hotelDensityLayer;
    layerControl.addOverlay(hotelDensityLayer, "Hotel Density");
  });
// Gallery density
fetch('data/gallery_density.geojson')
  .then(res => res.json())
  .then(data => {
    const counts = data.features.map(f =>
      f.properties.Join_Count ?? f.properties.join_count ?? 0
    );
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    const hotelDensityLayer = L.geoJSON(data, {
      style: feature => {
        const count = feature.properties.Join_Count ?? feature.properties.join_count ?? 0;
        const ratio = (count - minCount) / (maxCount - minCount || 1);
        return {
          fillColor: '#FFFAB4',
          color: '#FFFAB4',
          weight: 0.5,
          fillOpacity: count === 0 ? 0 : 0.2 + 0.6 * ratio
        };
      },
      onEachFeature: (feature, layer) => {
        const count = feature.properties.Join_Count ?? feature.properties.join_count ?? 'N/A';
        if (count > 0) {
          layer.bindPopup(`# of Hotels: ${count}`);
        }
      }
    });
    overlays["Hotel Density"] = hotelDensityLayer;
    layerControl.addOverlay(hotelDensityLayer, "Gallery Density");
  });

// Gallery Points
fetch('data/gallery_points.geojson')
  .then(res => res.json())
  .then(data => {
    const galleryLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        radius: 5,
        fillColor: '#ADC9FF',
        color: '#fff',
        weight: 1,
        fillOpacity: 0.9
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const name = props.NAME || 'Unnamed Hotel';
        const address = `${props.ADDRESS1 || ''}, ${props.CITY || ''}, ${props.ZIP || ''}`.replace(/(,\s*)+/g, ', ').trim();
        const link = props.URL ? `<br/><a href="${props.URL}" target="_blank">Website</a>` : '';

        layer.bindPopup(`
          <strong>${name}</strong><br/>
          ${address}<br/>
          ${link}
        `);
              }
    });
    overlays["Galleries"] = galleryLayer;
    layerControl.addOverlay(galleryLayer, "Galleries");
    
  });

  // Hotel Points
  fetch('data/hotel_points.geojson')
  .then(res => res.json())
  .then(data => {
    const hotelLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        radius: 5,
        fillColor: '#4B9CFF',
        color: '#fff',
        weight: 1,
        fillOpacity: 0.9
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const name = props.name || 'Unnamed Hotel';
        const address = `${props.address1 || ''}, ${props.city || ''}, ${props.state_province || ''} ${props.postal_code || ''}`.replace(/(,\s*)+/g, ', ').trim();
        const stars = props.star_rating ? `${props.star_rating} star${props.star_rating > 1 ? 's' : ''}` : 'No rating';
        
        layer.bindPopup(`
          <strong>${name}</strong><br/>
          ${address}<br/>
          ${stars}
        `);
              }
    });
    overlays["Hotels"] = hotelLayer;
    layerControl.addOverlay(hotelLayer, "Hotels");
  });

  // Attractions
  //Free
  fetch('data/free-attractions.geojson')
  .then(res => res.json())
  .then(data => {
    const hotelLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        radius: 5,
        fillColor: '#4B9CFF',
        color: '#fff',
        weight: 1,
        fillOpacity: 0.9
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const name = props.Name || 'Unnamed Attraction';
        const description = props.description || 'No Description';

      
        layer.bindPopup(`
          <strong>${name}</strong><br/>
          ${description}
        `);
              }
    });
    overlays["Attractions"] = hotelLayer;
    layerControl.addOverlay(hotelLayer, "Attractions");
  });






//FILTERS START HERE!!!!
// Genre
function generateGenreButtons(counts) {
  const primaryGenres = ['all', 'art', 'culture', 'history'];
  const primaryDiv = document.getElementById('filters-primary');
  const moreDiv = document.getElementById('filters-more');
  primaryDiv.innerHTML = '';
  moreDiv.innerHTML = '';
  const genres = Object.keys(counts).sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return a.localeCompare(b);
  });
  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.innerText = `${capitalize(genre)} (${counts[genre]})`;
    btn.onclick = () => filterByGenre(genre);
    (primaryGenres.includes(genre) ? primaryDiv : moreDiv).appendChild(btn);
  });
}

// filter
function renderFilteredFeatures(selectedGenre) {
  markers.clearLayers();
  const minPriceValue = parseInt(minInput.value);
  const maxPriceValue = parseInt(maxInput.value);
  const minTimeValue = parseInt(minTimeInput.value);
  const maxTimeValue = parseInt(maxTimeInput.value);

  const filtered = allGeoJsonFeatures.filter(f => {
    const genreMatch = selectedGenre === 'all' || f.properties.Genre?.toLowerCase() === selectedGenre;
    let priceStr = f.properties.ticket_price || '';
    priceStr = priceStr.toLowerCase().includes('free') ? '0' : priceStr.replace(/[^0-9.]/g, '');
    const price = parseFloat(priceStr);    
    const priceMatch = !isNaN(price) && price >= minPriceValue && price <= maxPriceValue;
    const openTime = parseInt(f.properties.opening_time?.split(':')[0]);
    const closeTime = parseInt(f.properties.closing_time?.split(':')[0]);
    const timeMatch = !isNaN(openTime) && !isNaN(closeTime) && openTime >= minTimeValue && closeTime <= maxTimeValue;
    return genreMatch && priceMatch && timeMatch;
  });

  const geoJsonLayer = L.geoJSON(filtered, {
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      const imageUrl = museumImages[props.OBJECTID];
      const imageTag = imageUrl
        ? `<img src="${imageUrl}" alt="${props.Name}" style="width:100%; max-height:150px; object-fit:cover; border-radius:8px; margin-bottom: 0.75em;">`
        : '';
      const popupContent = `
        ${imageTag}
        <strong style="font-size: 1.1em; text-transform: uppercase;">${props.Name}</strong>
        <div>${props.Address}, ${props.City} ${props.ZIP}</div>
        <div style="margin-top: 0.5em;">
          <img src="assets/icons/genre.svg" alt="Genre" style="width: 16px; vertical-align: middle; margin-right: 6px;">
          ${capitalize(props.Genre)}
        </div>
        <div>
          <img src="assets/icons/ticket.svg" alt="Price" style="width: 16px; vertical-align: middle; margin-right: 6px;">
          ${props.ticket_price}
        </div>
        <div style="margin-bottom: 0.5em;">
          <img src="/assets/icons/time.svg" alt="Open Time" style="width: 16px; vertical-align: middle; margin-right: 6px;">
          ${props.opening_days}, ${props.opening_time}–${props.closing_time}
        </div>
        <a href="${props.Link}" target="_blank">More info</a>
      `;
      layer.bindPopup(popupContent);
    },
    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: purpleIcon })
  });

  markers.addLayer(geoJsonLayer);
}

function filterByGenre(genre) {
  currentGenre = genre;
  renderFilteredFeatures(genre);
  const mapContainer = document.querySelector('.map-container');
  const colorMap = {
    all: '#8874E3',
    art: '#E08AD1',
    culture: '#35B09D',
    history: '#F4B440'
  };
  mapContainer.style.backgroundColor = colorMap[genre] || '#F56542';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

//SLIDERS!!
// Price
const minInput = document.getElementById('min-price');
const maxInput = document.getElementById('max-price');
const track = document.querySelector('.price-slider-track');
const priceContainer = document.querySelector('.price-slider-container');
const valueDisplay = document.createElement('div');
valueDisplay.className = 'price-values';
priceContainer.appendChild(valueDisplay);

function updatePriceDisplay() {
  const min = parseInt(minInput.value);
  const max = parseInt(maxInput.value);
  if (min > max - 1) minInput.value = max - 1;
  if (max < min + 1) maxInput.value = min + 1;
  const rangeMin = parseInt(minInput.min);
  const rangeMax = parseInt(maxInput.max);
  const percentMin = ((min - rangeMin) / (rangeMax - rangeMin)) * 100;
  const percentMax = ((max - rangeMin) / (rangeMax - rangeMin)) * 100;
  track.style.background = `linear-gradient(to right, #ddd ${percentMin}%, #8874E3 ${percentMin}%, #8874E3 ${percentMax}%, #ddd ${percentMax}%)`;
  valueDisplay.innerHTML = `<span>$${min}</span><span>$${max}</span>`;
}

minInput.addEventListener('input', () => {
  updatePriceDisplay();
  renderFilteredFeatures(currentGenre);
});
maxInput.addEventListener('input', () => {
  updatePriceDisplay();
  renderFilteredFeatures(currentGenre);
});
updatePriceDisplay();

// time
const minTimeInput = document.getElementById('min-time');
const maxTimeInput = document.getElementById('max-time');
const timeTrack = document.querySelector('.time-slider-track');
const timeContainer = document.getElementById('time-slider-container');
const timeValueDisplay = document.createElement('div');
timeValueDisplay.className = 'price-values';
timeContainer.appendChild(timeValueDisplay);

function updateTimeDisplay() {
  const min = parseInt(minTimeInput.value);
  const max = parseInt(maxTimeInput.value);
  if (min > max - 1) minTimeInput.value = max - 1;
  if (max < min + 1) maxTimeInput.value = min + 1;
  const percentMin = (min / 24) * 100;
  const percentMax = (max / 24) * 100;
  timeTrack.style.background = `linear-gradient(to right, #ddd ${percentMin}%, #8874E3 ${percentMin}%, #8874E3 ${percentMax}%, #ddd ${percentMax}%)`;
  timeValueDisplay.innerHTML = `<span>${min}:00</span><span>${max}:00</span>`;
}

minTimeInput.addEventListener('input', () => {
  updateTimeDisplay();
  renderFilteredFeatures(currentGenre);
});
maxTimeInput.addEventListener('input', () => {
  updateTimeDisplay();
  renderFilteredFeatures(currentGenre);
});
updateTimeDisplay();