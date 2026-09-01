import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Invoice: {
    form: {
      fields: [
        { property: 'amount', type: 'currency', help: t('Invoice amount help'), type_options: { multiplier: 100, currency: 'CNY' }},
        '__all__'
      ]
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'delete'],
      list_display: [
        'id',
        'payer',
        { property: 'amount', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        'currency',
        'status',
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: [
        { property: 'amount', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        '__all__'
      ]
    }
  }
}
