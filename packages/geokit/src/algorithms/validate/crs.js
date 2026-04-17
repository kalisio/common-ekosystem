import { is } from '@kalisio/check'

export const CRS_TYPES = {
  NAME: 'name',
  LINK: 'link'
}

export function validateCrs (crs, path = '/crs') {
  if (!is.plainObject(crs)) {
    return {
      valid: false,
      errors: [{ message: 'Invalid crs: must be an object', path }],
      warnings: []
    }
  }
  switch (crs.type) {
    case CRS_TYPES.NAME: {
      if (!is.nonEmptyString(crs.properties?.name)) {
        return {
          valid: false,
          errors: [{ message: 'Invalid crs: linked crs must have a non-empty properties.name string', path }],
          warnings: []
        }
      }
      return { valid: true, errors: [], warnings: [] }
    }
    case CRS_TYPES.LINK: {
      if (!is.nonEmptyString(crs.properties?.href)) {
        return {
          valid: false,
          errors: [{ message: 'Invalid crs: linked crs must have a non-empty properties.href string', path }],
          warnings: []
        }
      }
      return { valid: true, errors: [], warnings: [] }
    }
    default:
      return {
        valid: false,
        errors: [{ message: `Invalid crs: unknown type: ${crs.type}`, path }],
        warnings: []
      }
  }
}
