export const elements = {
  input: document.querySelector('#input'),
  fileInput: document.querySelector('#file-input'),
  fileName: document.querySelector('#file-name'),
  dropZone: document.querySelector('#drop-zone'),
  validateButton: document.querySelector('#validate'),
  fixButton: document.querySelector('#fix'),
  exportButton: document.querySelector('#export'),
  codeTab: document.querySelector('#code-tab'),
  mapTab: document.querySelector('#map-tab'),
  codePanel: document.querySelector('#code-panel'),
  mapPanel: document.querySelector('#map-panel'),
  status: document.querySelector('#status'),
  errorsTab: document.querySelector('#errors-tab'),
  warningsTab: document.querySelector('#warnings-tab'),
  errorsPanel: document.querySelector('#errors-panel'),
  warningsPanel: document.querySelector('#warnings-panel'),
  errors: document.querySelector('#errors'),
  warnings: document.querySelector('#warnings'),
  errorsCount: document.querySelector('#errors-count'),
  warningsCount: document.querySelector('#warnings-count'),
  statistics: document.querySelector('#statistics'),
  correctionsTab: document.querySelector('#corrections-tab'),
  unfixedTab: document.querySelector('#unfixed-tab'),
  correctionsPanel: document.querySelector('#corrections-panel'),
  unfixedPanel: document.querySelector('#unfixed-panel'),
  corrections: document.querySelector('#corrections'),
  unfixed: document.querySelector('#unfixed'),
  correctionsCount: document.querySelector('#corrections-count'),
  unfixedCount: document.querySelector('#unfixed-count')
}

export function selectView (name) {
  const showCode = name === 'code'
  elements.codeTab.classList.toggle('active', showCode)
  elements.mapTab.classList.toggle('active', !showCode)
  elements.codePanel.classList.toggle('active', showCode)
  elements.mapPanel.classList.toggle('active', !showCode)
}

export function selectValidationResult (name) {
  const showErrors = name === 'errors'
  elements.errorsTab.classList.toggle('active', showErrors)
  elements.warningsTab.classList.toggle('active', !showErrors)
  elements.errorsPanel.classList.toggle('active', showErrors)
  elements.warningsPanel.classList.toggle('active', !showErrors)
}

export function selectFixResult (name) {
  const showCorrections = name === 'corrections'
  elements.correctionsTab.classList.toggle('active', showCorrections)
  elements.unfixedTab.classList.toggle('active', !showCorrections)
  elements.correctionsPanel.classList.toggle('active', showCorrections)
  elements.unfixedPanel.classList.toggle('active', !showCorrections)
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

export function renderValidation (result) {
  const errors = result.errors ?? []
  const warnings = result.warnings ?? []
  elements.status.textContent = result.valid ? 'Valid' : 'Invalid'
  elements.status.className = result.valid ? 'valid' : 'invalid'
  elements.errorsCount.textContent = errors.length
  elements.warningsCount.textContent = warnings.length
  renderIssues(elements.errors, errors)
  renderIssues(elements.warnings, warnings)
  elements.statistics.textContent = JSON.stringify(
    result.statistics ?? {},
    null,
    2
  )
  if (errors.length) selectValidationResult('errors')
  else if (warnings.length) selectValidationResult('warnings')
  else selectValidationResult('errors')
}

export function renderFix (result) {
  const corrections = result.corrections ?? []
  const unfixed = result.unfixed ?? []
  elements.correctionsCount.textContent = corrections.length
  elements.unfixedCount.textContent = unfixed.length
  renderIssues(elements.corrections, corrections)
  renderIssues(elements.unfixed, unfixed)
  selectFixResult(unfixed.length ? 'unfixed' : 'corrections')
}

export function renderError (error) {
  elements.status.textContent = 'Invalid JSON'
  elements.status.className = 'invalid'
  elements.errorsCount.textContent = '1'
  elements.warningsCount.textContent = '0'
  renderIssues(elements.errors, [{
    code: 'INVALID_JSON',
    message: error.message
  }])
  renderIssues(elements.warnings, [])
  elements.statistics.textContent = ''
  selectValidationResult('errors')
}

export function clearFixResult () {
  elements.correctionsCount.textContent = '0'
  elements.unfixedCount.textContent = '0'
  renderIssues(elements.corrections, [])
  renderIssues(elements.unfixed, [])
  selectFixResult('corrections')
}
