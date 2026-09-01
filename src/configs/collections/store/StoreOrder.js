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
        { property: 'totalAmount', type: 'currency', help: t('StoreOrder totalAmount help'), type_options: { multiplier: 100, currency: 'CNY' }},
        {
          property: 'operationalStatus',
          type: 'select',
          default_value: 'pending',
          help: t('StoreOrder operationalStatus help'),
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
        { property: 'rejectionCode', required: false, help: t('StoreOrder rejectionCode help') },
        { property: 'rejectionReason', type: 'text', required: false, help: t('StoreOrder rejectionReason help') },
        { property: 'fulfillmentData', type: 'json', required: false, help: t('StoreOrder fulfillmentData help') },
        { property: 'orderSnapshot', type: 'json', help: t('StoreOrder orderSnapshot help') }
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
