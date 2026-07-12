import { t } from '@/i18n'

export default {
  Specification: {
    form: {
      fields: [
        'name',
        'price',
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
