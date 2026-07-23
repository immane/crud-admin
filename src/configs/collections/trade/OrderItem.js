import { orderByIdDesc } from '../helpers'

export default {
  OrderItem: {
    form: {
      fields: [
        'quantity',
        { property: 'unitPrice', type: 'currency', required: false, type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'price', type: 'currency', required: false, type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'cost', type: 'currency', required: false, type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'profit', type: 'currency', required: false, type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'specSnapshot', type: 'json', required: false },
        { property: 'productSnapshot', type: 'json', required: false },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'delete'],
      list_display: [
        'id',
        'specificationTitle',
        'quantity',
        { property: 'unitPrice', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'price', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'profit', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'order',
        'product',
        'specificationTitle',
        'quantity',
        { property: 'unitPrice', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'price', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'cost', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'profit', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'specSnapshot', type: 'json', full_width: true },
        { property: 'productSnapshot', type: 'json', full_width: true },
        { property: 'metadata', type: 'json', full_width: true },
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
