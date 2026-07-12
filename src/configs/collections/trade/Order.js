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
        'id', 'uuid', 'user', 'totalAmount', 'currency',
        'status', 'paymentMethod', 'paidAt', 'createdAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
