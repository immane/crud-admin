import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Comment: {
    form: {
      fields: [
        { property: 'body', type: 'text' },
        'entityType', 'entityId',
        { property: 'status', type: 'select', default_value: 'pending', type_options: {
          options: [
            { value: 'pending', label: t('Pending Review') },
            { value: 'approved', label: t('Approved') },
            { value: 'rejected', label: t('Rejected') }
          ]
        }},
        { property: 'parent', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        body: t('Comment Body'),
        status: {
          __label: t('Status'),
          pending: t('Pending Review'),
          approved: t('Approved'),
          rejected: t('Rejected')
        }
      },
      list_display: [
        'id', 'body', 'entityType', 'entityId', 'status', 'author', 'createdAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
