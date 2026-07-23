import { t } from '@/i18n'

export default {
  Setting: {
    form: {
      fields: [
        { property: 'key', field_options: { label: t('Key') }},
        { property: 'value', type: 'textarea', required: false },
        'type', 
        'groupName',
        { property: 'label', required: false },
        { property: 'description', type: 'text', required: false },
        { property: 'sortOrder', required: false, default_value: 0 }
      ]
    },
    list: {
      query: { '@order': 'entity.groupName|ASC, entity.sortOrder|ASC, entity.id|DESC' },
      list_filter: {
        key: t('Key'),
        groupName: t('Group')
      },
      list_display: ['id', 'key', 'value', 'type', 'groupName', 'label', 'sortOrder']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
