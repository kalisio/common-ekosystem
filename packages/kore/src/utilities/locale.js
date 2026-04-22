export const locale = {

  get () {
    if (typeof navigator !== 'undefined') {
      return navigator.languages?.[0] ?? navigator.language
    }
    return Intl.DateTimeFormat().resolvedOptions().locale
  },

  getCodes () {
    const { language, script, region } = new Intl.Locale(this.get())
    return { language, script, region }
  }

}
