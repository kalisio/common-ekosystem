import './style.css'
import { validateGeoJson } from '@kalisio/common-geospatial'

const input = document.querySelector('#input')
const fileInput = document.querySelector('#file-input')
const fileName = document.querySelector('#file-name')
const dropZone = document.querySelector('#drop-zone')
const validateButton = document.querySelector('#validate')

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

function selectTab (name) {
  const showErrors = name === 'errors'

  errorsTab.classList.toggle('active', showErrors)
  warningsTab.classList.toggle('active', !showErrors)

  errorsPanel.classList.toggle('active', showErrors)
  warningsPanel.classList.toggle('active', !showErrors)
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

    container.appendChild(item)
  }
}

function renderResult (result) {
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
    selectTab('errors')
  } else if (resultWarnings.length > 0) {
    selectTab('warnings')
  } else {
    selectTab('errors')
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

  selectTab('errors')
}

function validate () {
  try {
    const geoJson = JSON.parse(input.value)
    const result = validateGeoJson(geoJson)

    renderResult(result)
  } catch (error) {
    renderJsonError(error)
  }
}

function loadFile (file) {
  const reader = new FileReader()

  reader.addEventListener('load', () => {
    fileName.textContent = file.name
    input.value = reader.result
    validate()
  })

  reader.addEventListener('error', () => {
    renderJsonError(new Error(`Unable to read ${file.name}`))
  })

  reader.readAsText(file)
}

validateButton.addEventListener('click', validate)

errorsTab.addEventListener('click', () => {
  selectTab('errors')
})

warningsTab.addEventListener('click', () => {
  selectTab('warnings')
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
