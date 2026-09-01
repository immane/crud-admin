import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  PromotionTemplate: {
    form: {
      fields: [
        'name',
        { property: 'description', type: 'text', required: false },
        { property: 'type', help: t('PromotionTemplate type help') },
        { property: 'phase', default_value: 0, help: t('PromotionTemplate phase help') },
        { property: 'enabled', type: 'boolean', required: false, default_value: false, help: t('PromotionTemplate enabled help') },
        { property: 'dsl', type: 'code', help: t('PromotionTemplate dsl help') },
        { property: 'fields', type: 'json', required: false, help: t('PromotionTemplate fields help') }
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
