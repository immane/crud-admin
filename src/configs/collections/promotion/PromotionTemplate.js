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
        name: 'Template Name',
        type: 'Type',
        enabled: {
          label: 'Enabled',
          type: 'boolean',
          expression: 'entity.getEnabled() == :value'
        }
      },
      list_display: [
        'id',
        'name',
        'type',
        'enabled',
        'phase',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'name',
        'type',
        'enabled',
        'phase',
        { property: 'description', type: 'text', full_width: true },
        { property: 'dsl', type: 'text', full_width: true },
        { property: 'fields', type: 'json', full_width: true },
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
