import defaultSettings from '@/settings'

const title = defaultSettings.title || 'Vue Admin Skeleton'

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
