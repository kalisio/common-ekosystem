---
title: normalize
---

# normalize


## normalizeCoordinates

### Signature
```javascript
normalizeCoordinates(longitude, latitude, precision)
```

### Description

Normalizes geographic coordinates to valid ranges and truncates to specified precision.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| longitude | number | yes | Longitude value to normalize |
| latitude | number | yes | Latitude value to normalize |
| precision | number | no | Number of decimal places (0-8). Default: 7
- Precision levels correspond to approximate distances:
  - 0: ~111 km (country/region)
  - 1: ~11 km (large city)
  - 2: ~1.1 km (neighborhood)
  - 3: ~110 m (village)
  - 4: ~11 m (parcel/field)
  - 5: ~1.1 m (street/building)
  - 6: ~11 cm (GPS precision)
  - 7: ~1.1 cm (geodesy - default)
  - 8: ~1.1 mm (topography) |

### Returns

| Type | Description |
|------|-------------|
| Object | Object with normalized and truncated &#x60;longitude&#x60; and &#x60;latitude&#x60; properties, or &#x60;null&#x60; if validation fails |

### Examples

```javascript
// Normalize coordinates within valid ranges
normalizeCoordinates(2.3522, 48.8566, 5)
// { longitude: 2.3522, latitude: 48.8566 }
```

```javascript
// Normalize longitude > 180
normalizeCoordinates(185, 48.8567, 2)
// { longitude: -175, latitude: 48.86 }
```

```javascript
// Normalize latitude > 90 (crossing north pole)
normalizeCoordinates(10, 95, 2)
// { longitude: -170, latitude: 85 }
```

```javascript
// Normalize latitude < -90 (crossing south pole)
normalizeCoordinates(10, -100, 2)
// { longitude: -170, latitude: -80 }
```

```javascript
// Invalid input returns null
normalizeCoordinates('invalid', 48.8566)
// null
```

```javascript
// Out of range precision returns null
normalizeCoordinates(2.3522, 48.8566, 10)
// null
```


---


