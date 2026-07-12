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
          __label: t('entity.status'),
          draft: t('dashboard.status.draft'),
          pending: t('dashboard.status.pending'),
          confirmed: t('dashboard.status.confirmed'),
          paid: t('dashboard.status.paid'),
          fulfilled: t('dashboard.status.fulfilled'),
          completed: t('dashboard.status.completed'),
          cancelled: t('dashboard.status.cancelled'),
          refunded: t('dashboard.status.refunded')
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
