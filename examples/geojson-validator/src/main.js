import './style.css'

import {
  parseGeoJson,
  validate,
  fix,
  serializeGeoJson
} from './validator.js'

import {
  initializeMap,
  updateMap,
  clearMap,
  resizeMap
} from './map.js'

import {
  elements,
  selectView,
  selectValidationResult,
  selectFixResult,
  renderValidation,
  renderFix,
  renderError,
  clearFixResult
} from './view.js'

function validateInput () {
  try {
    const geoJson = parseGeoJson(elements.input.value)
    updateMap(geoJson)
    const result = validate(geoJson)
    renderValidation(result)
    return result
  } catch (error) {
    clearMap()
    renderError(error)
    return null
  }
}

function fixInput () {
  try {
    const geoJson = parseGeoJson(elements.input.value)
    const validation = validate(geoJson)
    const result = fix(geoJson, validation)
    elements.input.value = serializeGeoJson(result.fixed)
    renderFix(result)
    updateMap(result.fixed)
    renderValidation(validate(result.fixed))
  } catch (error) {
    clearMap()
    renderError(error)
    clearFixResult()
  }
}

function exportGeoJson () {
  try {
    const geoJson = parseGeoJson(elements.input.value)
    const blob = new Blob(
      [serializeGeoJson(geoJson)],
      { type: 'application/geo+json' }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const name = elements.fileName.textContent
    link.href = url
    link.download = name && name !== 'or click to select a file'
      ? name.replace(/(\.geojson|\.json)$/i, '-fixed.geojson')
      : 'fixed.geojson'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    renderError(error)
  }
}

function loadFile (file) {
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    elements.fileName.textContent = file.name
    elements.input.value = reader.result
    clearFixResult()
    validateInput()
  })
  reader.addEventListener('error', () => {
    clearMap()
    renderError(new Error(`Unable to read ${file.name}`))
  })
  reader.readAsText(file)
}

elements.codeTab.addEventListener('click', () => {
  selectView('code')
})

elements.mapTab.addEventListener('click', () => {
  selectView('map')
  requestAnimationFrame(() => {
    resizeMap()
    try {
      updateMap(parseGeoJson(elements.input.value))
    } catch {
      clearMap()
    }
  })
})

elements.validateButton.addEventListener('click', () => {
  clearFixResult()
  validateInput()
})

elements.fixButton.addEventListener('click', fixInput)
elements.exportButton.addEventListener('click', exportGeoJson)

elements.errorsTab.addEventListener('click', () => {
  selectValidationResult('errors')
})

elements.warningsTab.addEventListener('click', () => {
  selectValidationResult('warnings')
})

elements.correctionsTab.addEventListener('click', () => {
  selectFixResult('corrections')
})

elements.unfixedTab.addEventListener('click', () => {
  selectFixResult('unfixed')
})

elements.fileInput.addEventListener('change', () => {
  const [file] = elements.fileInput.files
  if (file) loadFile(file)
})

elements.dropZone.addEventListener('click', () => {
  elements.fileInput.click()
})

elements.dropZone.addEventListener('dragenter', event => {
  event.preventDefault()
  event.stopPropagation()
  elements.dropZone.classList.add('dragging')
})

elements.dropZone.addEventListener('dragover', event => {
  event.preventDefault()
  event.stopPropagation()
  elements.dropZone.classList.add('dragging')
})

elements.dropZone.addEventListener('dragleave', event => {
  event.preventDefault()
  event.stopPropagation()
  elements.dropZone.classList.remove('dragging')
})

elements.dropZone.addEventListener('drop', event => {
  event.preventDefault()
  event.stopPropagation()
  elements.dropZone.classList.remove('dragging')
  const [file] = event.dataTransfer.files
  if (file) loadFile(file)
})

document.addEventListener('dragover', event => {
  event.preventDefault()
})

document.addEventListener('drop', event => {
  event.preventDefault()
})

let initialGeoJson
try {
  initialGeoJson = parseGeoJson(elements.input.value)
} catch {
  initialGeoJson = null
}

initializeMap(initialGeoJson)
validateInput()
