import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const EMPTY_GEOJSON = {
  type: 'FeatureCollection',
  features: []
}

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm'
      }
    ]
  },
  center: [2.35, 48.86],
  zoom: 10
})

map.addControl(new maplibregl.NavigationControl(), 'top-right')

function visitCoordinates (coordinates, visitor) {
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  ) {
    visitor(coordinates)
    return
  }
  if (!Array.isArray(coordinates)) return
  for (const item of coordinates) visitCoordinates(item, visitor)
}

function visitGeometry (geometry, visitor) {
  if (!geometry) return
  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries ?? []) {
      visitGeometry(child, visitor)
    }
    return
  }
  visitCoordinates(geometry.coordinates, visitor)
}

function visitGeoJsonCoordinates (geoJson, visitor) {
  if (!geoJson) return
  switch (geoJson.type) {
    case 'FeatureCollection':
      for (const feature of geoJson.features ?? []) {
        visitGeometry(feature.geometry, visitor)
      }
      break
    case 'Feature':
      visitGeometry(geoJson.geometry, visitor)
      break
    default:
      visitGeometry(geoJson, visitor)
  }
}

function getBounds (geoJson) {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  visitGeoJsonCoordinates(geoJson, ([lon, lat]) => {
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  })
  if (![minLon, minLat, maxLon, maxLat].every(Number.isFinite)) return null
  return [[minLon, minLat], [maxLon, maxLat]]
}

function fitGeoJson (geoJson) {
  const bounds = getBounds(geoJson)
  if (!bounds) return
  const [[west, south], [east, north]] = bounds
  if (west === east && south === north) {
    map.easeTo({
      center: [west, south],
      zoom: 14
    })
    return
  }
  map.fitBounds(bounds, {
    padding: 50,
    maxZoom: 16,
    duration: 500
  })
}

function addGeoJsonLayers () {
  map.addSource('geojson', {
    type: 'geojson',
    data: EMPTY_GEOJSON
  })
  map.addLayer({
    id: 'geojson-fill',
    type: 'fill',
    source: 'geojson',
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'fill-color': '#2563eb',
      'fill-opacity': 0.2
    }
  })
  map.addLayer({
    id: 'geojson-line',
    type: 'line',
    source: 'geojson',
    filter: ['in', '$type', 'LineString', 'Polygon'],
    paint: {
      'line-color': '#2563eb',
      'line-width': 2
    }
  })
  map.addLayer({
    id: 'geojson-point',
    type: 'circle',
    source: 'geojson',
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': 6,
      'circle-color': '#2563eb',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2
    }
  })
}

export function initializeMap (geoJson) {
  map.on('load', () => {
    addGeoJsonLayers()
    if (geoJson) updateMap(geoJson)
  })
}

export function updateMap (geoJson, fit = true) {
  const source = map.getSource('geojson')
  if (!source) return
  source.setData(geoJson)
  if (fit) fitGeoJson(geoJson)
}

export function clearMap () {
  const source = map.getSource('geojson')
  if (!source) return
  source.setData(EMPTY_GEOJSON)
}

export function resizeMap () {
  map.resize()
}
