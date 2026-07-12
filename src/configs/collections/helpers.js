import { t } from '@/i18n'

export const orderByIdDesc = {
  '@order': 'entity.id|DESC'
}

export const statusFilter = {
  active: t('entity.active'),
  inactive: t('entity.inactive')
}

export const statusFilterLabel = (label = null) => ({
  __label: label || t('entity.status'),
  ...statusFilter
})
