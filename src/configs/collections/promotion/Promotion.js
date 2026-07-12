import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Promotion: {
    form: {
      fields: [
        'name',
        { property: 'description', type: 'text', required: false },
        { property: 'storeCode', required: false },
        { property: 'enabled', type: 'boolean', required: false, default_value: false },
        { property: 'startTime', required: false },
        { property: 'endTime', required: false },
        { property: 'config', type: 'json', required: false },
        { property: 'conflictMode', type: 'select', default_value: 'stackable', type_options: {
          options: [
            { value: 'stackable', label: t('Stackable') },
            { value: 'exclusive', label: t('Exclusive') },
            { value: 'priority', label: t('By Priority') }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: t('Promotion Name'),
        storeCode: t('Store Code'),
        enabled: {
          label: t('Enabled'),
          type: 'boolean',
          expression: 'entity.getEnabled() == :value'
        }
      },
      list_display: ['id', 'name', 'enabled', 'startTime', 'endTime', 'conflictMode', 'template', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
