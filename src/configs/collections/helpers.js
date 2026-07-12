import { t } from '@/i18n'

export const orderByIdDesc = {
  '@order': 'entity.id|DESC'
}

export const statusFilter = {
  active: t('Active'),
  inactive: t('Inactive')
}

export const statusFilterLabel = (label = null) => ({
  __label: label || t('Status'),
  ...statusFilter
})
