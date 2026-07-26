import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  StoreOrder: {
    entity: { name: 'StoreOrder', plural: 'store-orders' },
    form: {
      fields: [
        'storeCodeSnapshot',
        'storeNameSnapshot',
        { property: 'customerUserUuid', required: false },
        { property: 'currency', default_value: 'CNY' },
        { property: 'totalAmount', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        {
          property: 'operationalStatus',
          type: 'select',
          default_value: 'pending',
          type_options: {
            options: [
              { value: 'pending', label: t('Pending') },
              { value: 'accepted', label: t('Accepted') },
              { value: 'rejected', label: t('Rejected') },
              { value: 'fulfilled', label: t('Fulfilled') },
              { value: 'cancelled', label: t('Cancelled') }
            ]
          }
        },
        { property: 'rejectionCode', required: false },
        { property: 'rejectionReason', type: 'text', required: false },
        { property: 'fulfillmentData', type: 'json', required: false },
        { property: 'orderSnapshot', type: 'json' }
      ]
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'delete', 'edit'],
      list_filter: {
        operationalStatus: {
          __label: t('Operational Status'),
          pending: t('Pending'),
          accepted: t('Accepted'),
          rejected: t('Rejected'),
          fulfilled: t('Fulfilled'),
          cancelled: t('Cancelled')
        }
      },
      list_display: [
        'id',
        'uuid',
        'storeCodeSnapshot',
        'storeNameSnapshot',
        { property: 'totalAmount', type: 'currency', type_options: { multiplier: 100, currency: 'CNY' }},
        'currency',
        'operationalStatus',
        'customerUserUuid',
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
