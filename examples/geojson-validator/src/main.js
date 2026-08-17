import './style.css'

import {
  parseGeoJson,
  processGeoJson,
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
  renderCrs,
  renderValidation,
  renderFix,
  renderError,
  clearFixResult,
  updateActions
} from './view.js'

let current = {
  sourceCrs: null,
  outputCrs: null,
  geoJson: null,
  validation: null
}

let validationTimer

function resetCurrent () {
  current = {
    sourceCrs: null,
    outputCrs: null,
    geoJson: null,
    validation: null
  }

  clearMap()
  renderCrs()
  updateActions(null)
}

function processInput ({ replaceInput = true, sourceCrs } = {}) {
  try {
    const geoJson = parseGeoJson(elements.input.value)
    const result = processGeoJson(geoJson)
    current = {
      ...result,
      sourceCrs: sourceCrs ?? result.sourceCrs
    }
    renderCrs(current.sourceCrs, result.outputCrs)
    renderValidation(result.validation)
    if (!result.validation.valid) {
      clearMap()
      updateActions(result.validation, false)
      return
    }
    if (replaceInput) {
      elements.input.value = serializeGeoJson(result.geoJson)
    }
    updateActions(result.validation, true)
    updateMap(result.geoJson)
  } catch (error) {
    resetCurrent()
    renderError(error)
  }
}

function fixInput () {
  if (!current.geoJson || !current.validation) return
  try {
    const sourceCrs = current.sourceCrs
    const result = fix(current.geoJson, current.validation)
    renderFix(result)
    elements.input.value = serializeGeoJson(result.fixed)
    processInput({ sourceCrs })
  } catch (error) {
    resetCurrent()
    renderError(error)
    clearFixResult()
  }
}

function exportGeoJson () {
  if (!current.geoJson || !current.validation?.valid) return

  const blob = new Blob(
    [serializeGeoJson(current.geoJson)],
    { type: 'application/geo+json' }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const name = elements.fileName.textContent

  link.href = url
  link.download = name && name !== 'or click to select a file'
    ? name.replace(/(\.geojson|\.json)$/i, '-wgs84.geojson')
    : 'wgs84.geojson'

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

function loadFile (file) {
  const reader = new FileReader()

  reader.addEventListener('load', () => {
    elements.fileName.textContent = file.name
    elements.input.value = reader.result

    clearFixResult()
    updateActions(null)

    processInput()
  })

  reader.addEventListener('error', () => {
    resetCurrent()
    renderError(new Error(`Unable to read ${file.name}`))
  })

  reader.readAsText(file)
}

elements.input.addEventListener('input', () => {
  clearTimeout(validationTimer)
  updateActions(null)

  validationTimer = setTimeout(() => {
    clearFixResult()
    processInput({ replaceInput: false })
  }, 400)
})

elements.codeTab.addEventListener('click', () => {
  selectView('code')
})

elements.mapTab.addEventListener('click', () => {
  selectView('map')

  requestAnimationFrame(() => {
    resizeMap()

    if (current.geoJson && current.validation?.valid) {
      updateMap(current.geoJson)
    } else {
      clearMap()
    }
  })
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

for (const eventName of ['dragenter', 'dragover']) {
  elements.dropZone.addEventListener(eventName, event => {
    event.preventDefault()
    event.stopPropagation()

    elements.dropZone.classList.add('dragging')
  })
}

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

initializeMap(null)
updateActions(null)
processInput()
