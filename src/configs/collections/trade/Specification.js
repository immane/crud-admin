import { t } from '@/i18n'

export default {
  Specification: {
    form: {
      fields: [
        'name',
        { property: 'price', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: t('Active') },
            { value: 'inactive', label: t('Inactive') }
          ]
        }},
        { property: 'sort', default_value: 0 }
      ]
    },
    list: {
      list_filter: {
        name: t('Spec Name'),
        status: {
          __label: t('Status'),
          active: t('Active'),
          inactive: t('Inactive')
        }
      },
      list_display: [
        'id',
        'name',
        { property: 'price', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'status', editable: true },
        { property: 'sort', editable: true },
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        { property: 'price', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        '__all__'
      ]
    }
  }
}
