import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  PromotionTemplate: {
    form: {
      fields: [
        'name',
        { property: 'description', type: 'text', required: false },
        'type',
        { property: 'phase', default_value: 0 },
        { property: 'enabled', type: 'boolean', required: false, default_value: false },
        { property: 'dsl', type: 'text' },
        { property: 'fields', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: t('Template Name'),
        type: t('Type'),
        enabled: {
          label: t('Enabled'),
          type: 'boolean',
          expression: 'entity.getEnabled() == :value'
        }
      },
      list_display: ['id', 'name', 'type', 'enabled', 'phase', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
