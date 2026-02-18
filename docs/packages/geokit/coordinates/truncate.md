---
title: truncate
---

# truncate


## truncateCoordinates

### Signature
```javascript
truncateCoordinates(longitude, latitude, precision)
```

### Description

Truncates geographic coordinates to a specified decimal precision.

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| longitude | number | yes | Longitude value to truncate |
| latitude | number | yes | Latitude value to truncate |
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
| Object | Object with &#x60;longitude&#x60; and &#x60;latitude&#x60; properties rounded to specified precision, or &#x60;null&#x60; if validation fails |

### Examples

```javascript
// Truncate to default precision (7 decimal places)
truncateCoordinates(2.35222229876, 48.85666669432)
// { longitude: 2.3522223, latitude: 48.8566667 }
```

```javascript
// Truncate to neighborhood level (2 decimal places)
truncateCoordinates(2.35222229876, 48.85666669432, 2)
// { longitude: 2.35, latitude: 48.86 }
```

```javascript
// Truncate to GPS precision (6 decimal places)
truncateCoordinates(-74.0060, 40.7128, 6)
// { longitude: -74.006, latitude: 40.7128 }
```

```javascript
// Invalid input returns null
truncateCoordinates('invalid', 48.8566)
// null
```

```javascript
// Out of range precision returns null
truncateCoordinates(2.3522, 48.8566, 10)
// null
```


---


