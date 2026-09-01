import { t } from '@/i18n'

export default {
  Setting: {
    form: {
      fields: [
        { property: 'key', field_options: { label: t('Key') }, help: t('Setting key help') },
        { property: 'value', type: 'textarea', required: false, help: t('Setting value help') },
        { property: 'type', help: t('Setting type help') },
        { property: 'groupName', help: t('Setting groupName help') },
        { property: 'label', required: false },
        { property: 'description', type: 'text', required: false },
        { property: 'sortOrder', required: false, default_value: 0, help: t('Setting sortOrder help') }
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
