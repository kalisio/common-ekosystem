import './style.css'
import { validateGeoJson, fixGeoJson } from '@kalisio/common-geospatial'

const input = document.querySelector('#input')
const fileInput = document.querySelector('#file-input')
const fileName = document.querySelector('#file-name')
const dropZone = document.querySelector('#drop-zone')

const validateButton = document.querySelector('#validate')
const fixButton = document.querySelector('#fix')

const status = document.querySelector('#status')

const errorsTab = document.querySelector('#errors-tab')
const warningsTab = document.querySelector('#warnings-tab')
const errorsPanel = document.querySelector('#errors-panel')
const warningsPanel = document.querySelector('#warnings-panel')

const errors = document.querySelector('#errors')
const warnings = document.querySelector('#warnings')
const errorsCount = document.querySelector('#errors-count')
const warningsCount = document.querySelector('#warnings-count')

const statistics = document.querySelector('#statistics')

const correctionsTab = document.querySelector('#corrections-tab')
const unfixedTab = document.querySelector('#unfixed-tab')
const correctionsPanel = document.querySelector('#corrections-panel')
const unfixedPanel = document.querySelector('#unfixed-panel')

const corrections = document.querySelector('#corrections')
const unfixed = document.querySelector('#unfixed')
const correctionsCount = document.querySelector('#corrections-count')
const unfixedCount = document.querySelector('#unfixed-count')

function selectValidationTab (name) {
  const showErrors = name === 'errors'

  errorsTab.classList.toggle('active', showErrors)
  warningsTab.classList.toggle('active', !showErrors)

  errorsPanel.classList.toggle('active', showErrors)
  warningsPanel.classList.toggle('active', !showErrors)
}

function selectFixTab (name) {
  const showCorrections = name === 'corrections'

  correctionsTab.classList.toggle('active', showCorrections)
  unfixedTab.classList.toggle('active', !showCorrections)

  correctionsPanel.classList.toggle('active', showCorrections)
  unfixedPanel.classList.toggle('active', !showCorrections)
}

function renderIssues (container, issues) {
  container.replaceChildren()

  if (!issues.length) {
    const empty = document.createElement('p')
    empty.className = 'empty'
    empty.textContent = 'None'

    container.appendChild(empty)
    return
  }

  for (const issue of issues) {
    const item = document.createElement('div')
    item.className = 'issue'

    if (issue.code) {
      const code = document.createElement('code')
      code.textContent = issue.code
      item.appendChild(code)
    }

    if (issue.message) {
      const message = document.createElement('span')
      message.textContent = issue.message
      item.appendChild(message)
    }

    if (issue.path) {
      const path = document.createElement('small')
      path.textContent = issue.path
      item.appendChild(path)
    }

    if (issue.params) {
      const params = document.createElement('small')
      params.textContent = JSON.stringify(issue.params)
      item.appendChild(params)
    }

    container.appendChild(item)
  }
}

function clearFixResult () {
  correctionsCount.textContent = '0'
  unfixedCount.textContent = '0'

  renderIssues(corrections, [])
  renderIssues(unfixed, [])

  selectFixTab('corrections')
}

function renderValidationResult (result) {
  const resultErrors = result.errors ?? []
  const resultWarnings = result.warnings ?? []

  status.textContent = result.valid ? 'Valid' : 'Invalid'
  status.className = result.valid ? 'valid' : 'invalid'

  errorsCount.textContent = resultErrors.length
  warningsCount.textContent = resultWarnings.length

  renderIssues(errors, resultErrors)
  renderIssues(warnings, resultWarnings)

  statistics.textContent = JSON.stringify(
    result.statistics ?? {},
    null,
    2
  )

  if (resultErrors.length > 0) {
    selectValidationTab('errors')
  } else if (resultWarnings.length > 0) {
    selectValidationTab('warnings')
  } else {
    selectValidationTab('errors')
  }
}

function renderFixResult (result) {
  const resultCorrections = result.corrections ?? []
  const resultUnfixed = result.unfixed ?? []

  correctionsCount.textContent = resultCorrections.length
  unfixedCount.textContent = resultUnfixed.length

  renderIssues(corrections, resultCorrections)
  renderIssues(unfixed, resultUnfixed)

  if (resultUnfixed.length > 0) {
    selectFixTab('unfixed')
  } else {
    selectFixTab('corrections')
  }
}

function renderJsonError (error) {
  status.textContent = 'Invalid JSON'
  status.className = 'invalid'

  errorsCount.textContent = '1'
  warningsCount.textContent = '0'

  renderIssues(errors, [{
    code: 'INVALID_JSON',
    message: error.message
  }])

  renderIssues(warnings, [])

  statistics.textContent = ''

  selectValidationTab('errors')
}

function validate () {
  try {
    const geoJson = JSON.parse(input.value)
    const validation = validateGeoJson(geoJson)

    renderValidationResult(validation)

    return validation
  } catch (error) {
    renderJsonError(error)
    return null
  }
}

function fix () {
  try {
    const geoJson = JSON.parse(input.value)
    const validation = validateGeoJson(geoJson)

    const result = fixGeoJson(geoJson, {
      validation
    })

    input.value = JSON.stringify(result.fixed, null, 2)

    renderFixResult(result)

    // Validate the fixed GeoJSON again
    const fixedValidation = validateGeoJson(result.fixed)
    renderValidationResult(fixedValidation)
  } catch (error) {
    renderJsonError(error)
    clearFixResult()
  }
}

function loadFile (file) {
  const reader = new FileReader()

  reader.addEventListener('load', () => {
    fileName.textContent = file.name
    input.value = reader.result

    clearFixResult()
    validate()
  })

  reader.addEventListener('error', () => {
    renderJsonError(new Error(`Unable to read ${file.name}`))
  })

  reader.readAsText(file)
}

validateButton.addEventListener('click', () => {
  clearFixResult()
  validate()
})

fixButton.addEventListener('click', fix)

errorsTab.addEventListener('click', () => {
  selectValidationTab('errors')
})

warningsTab.addEventListener('click', () => {
  selectValidationTab('warnings')
})

correctionsTab.addEventListener('click', () => {
  selectFixTab('corrections')
})

unfixedTab.addEventListener('click', () => {
  selectFixTab('unfixed')
})

fileInput.addEventListener('change', () => {
  const [file] = fileInput.files

  if (file) loadFile(file)
})

dropZone.addEventListener('click', () => {
  fileInput.click()
})

dropZone.addEventListener('dragover', event => {
  event.preventDefault()
  dropZone.classList.add('dragging')
})

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragging')
})

dropZone.addEventListener('drop', event => {
  event.preventDefault()
  dropZone.classList.remove('dragging')

  const [file] = event.dataTransfer.files

  if (file) loadFile(file)
})

// Validate the initial GeoJSON
validate()
