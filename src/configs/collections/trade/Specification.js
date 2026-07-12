import { t } from '@/i18n'

export default {
  Specification: {
    form: {
      fields: [
        'name',
        'price',
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: t('entity.active') },
            { value: 'inactive', label: t('entity.inactive') }
          ]
        }},
        { property: 'sort', default_value: 0 }
      ]
    },
    list: {
      list_filter: {
        name: t('entity.specName'),
        status: {
          __label: t('entity.status'),
          active: t('entity.active'),
          inactive: t('entity.inactive')
        }
      },
      list_display: [
        'id',
        'name',
        { property: 'price', editable: true },
        { property: 'status', editable: true },
        { property: 'sort', editable: true },
        'createdAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
