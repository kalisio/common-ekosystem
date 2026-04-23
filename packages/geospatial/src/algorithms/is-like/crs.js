import { is } from '@kalisio/common-core'

export const CRS_TYPES = {
  NAME: 'name',
  LINK: 'link'
}

export function isLikeCRS (object) {
  if (!is.plainObject(object)) return false
  if (object.type === CRS_TYPES.NAME) {
    return is.nonEmptyString(object.properties?.name)
  }
  if (object.type === CRS_TYPES.LINK) {
    return is.nonEmptyString(object.properties?.href)
  }
  return false
}
