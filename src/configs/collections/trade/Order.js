import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Order: {
    form: {
      fields: [
        { property: 'notes', type: 'text', required: false },
        { property: 'metadata', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: t('Status'),
          draft: t('Draft'),
          pending: t('Pending'),
          confirmed: t('Confirmed'),
          paid: t('Paid'),
          fulfilled: t('Fulfilled'),
          completed: t('Completed'),
          cancelled: t('Cancelled'),
          refunded: t('Refunded')
        }
      },
      list_display: [
        'id', 'uuid', 'user', { property: 'totalAmount', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }}, 'currency',
        'status', 'paymentMethod', 'paidAt', 'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'uuid',
        'user',
        { property: 'totalAmount', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        'currency',
        'status',
        'paymentMethod',
        'paidAt',
        'cancelledAt',
        'completedAt',
        'refundedAt',
        { property: 'items', full_width: true },
        { property: 'notes', type: 'text', full_width: true },
        { property: 'metadata', type: 'json', full_width: true },
        'shippingAddress',
        'billingAddress',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
