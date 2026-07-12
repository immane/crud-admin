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
            { value: 'pending', label: t('entity.pendingReview') },
            { value: 'approved', label: t('entity.approved') },
            { value: 'rejected', label: t('entity.rejected') }
          ]
        }},
        { property: 'parent', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        body: t('entity.commentBody'),
        status: {
          __label: t('entity.status'),
          pending: t('entity.pendingReview'),
          approved: t('entity.approved'),
          rejected: t('entity.rejected')
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
