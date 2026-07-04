export const crsObjects = {
  validName: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  validLink: { type: 'link', properties: { href: 'https://example.com/crs', type: 'proj4' } },
  validLinkNoType: { type: 'link', properties: { href: 'https://example.com/crs' } },
  unknownType: { type: 'unknown' },
  missingType: { properties: { name: 'EPSG:4326' } },
  nameMissingProperties: { type: 'name' },
  nameEmptyString: { type: 'name', properties: { name: '' } },
  nameEmptyProperties: { type: 'name', properties: {} },
  nameNullProperties: { type: 'name', properties: null },
  linkMissingHref: { type: 'link', properties: {} },
  linkEmptyHref: { type: 'link', properties: { href: '' } },
  linkMissingProperties: { type: 'link' },
  linkNullProperties: { type: 'link', properties: null }
}
