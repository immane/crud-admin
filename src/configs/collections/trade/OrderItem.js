import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  OrderItem: {
    form: {
      fields: [
        'quantity',
        { property: 'unitPrice', type: 'currency', required: false, help: t('OrderItem unitPrice help'), type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'price', type: 'currency', required: false, help: t('OrderItem price help'), type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'cost', type: 'currency', required: false, help: t('OrderItem cost help'), type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'profit', type: 'currency', required: false, help: t('OrderItem profit help'), type_options: { multiplier: 100, currency: 'CNY' }},
        { property: 'specSnapshot', type: 'json', required: false, help: t('OrderItem specSnapshot help') },
        { property: 'productSnapshot', type: 'json', required: false, help: t('OrderItem productSnapshot help') },
        { property: 'metadata', type: 'json', required: false, help: t('OrderItem metadata help') }
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
