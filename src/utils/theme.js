export const THEME_STORAGE_KEY = 'app_theme'

export const themes = ['ocean', 'mist', 'dark']

export function getTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return themes.includes(stored) ? stored : 'ocean'
}

export function applyTheme(theme) {
  const nextTheme = themes.includes(theme) ? theme : 'ocean'
  document.documentElement.dataset.theme = nextTheme
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  window.dispatchEvent(new CustomEvent('app-theme-change'))
  return nextTheme
}
