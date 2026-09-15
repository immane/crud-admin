import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Comment: {
    form: {
      fields: [
        { property: 'body', type: 'text' },
        { property: 'entityType', help: t('Comment entityType help') }, { property: 'entityId', help: t('Comment entityId help') },
        { property: 'status', type: 'select', default_value: 'pending', help: t('Comment status help'), type_options: {
          options: [
            { value: 'pending', label: t('Pending Review') },
            { value: 'approved', label: t('Approved') },
            { value: 'rejected', label: t('Rejected') }
          ]
        }},
        { property: 'parent', required: false, help: t('Comment parent help') }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        body: t('Comment Body'),
        entityType: t('Entity Type'),
        entityId: t('Entity ID'),
        'author.username': t('Author'),
        'parent.id': {
          label: t('Parent'),
          type: 'input',
          expression: 'entity.getParent().getId() == :value'
        },
        status: {
          __label: t('Status'),
          pending: t('Pending Review'),
          approved: t('Approved'),
          rejected: t('Rejected')
        }
      },
      list_display: [
        'id', 'body', 'entityType', 'entityId', 'status', 'author', 'parent', 'createdAt', 'updatedAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
