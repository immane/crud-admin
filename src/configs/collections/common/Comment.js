import { orderByIdDesc } from '../helpers'

export default {
  Comment: {
    form: {
      fields: [
        { property: 'body', type: 'text' },
        'entityType',
        'entityId',
        { property: 'status', type: 'select', default_value: 'pending', type_options: {
          options: [
            { value: 'pending', label: 'Pending Review' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ]
        }},
        { property: 'parent', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        body: 'Comment Body',
        status: {
          __label: 'Status',
          pending: 'Pending Review',
          approved: 'Approved',
          rejected: 'Rejected'
        }
      },
      list_display: [
        'id',
        'body',
        'entityType',
        'entityId',
        'status',
        'author',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'author',
        'status',
        { property: 'body', type: 'text', full_width: true },
        'entityType',
        'entityId',
        'parent',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
