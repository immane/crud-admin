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
            { value: 'pending', label: '待审核' },
            { value: 'approved', label: '已通过' },
            { value: 'rejected', label: '已拒绝' }
          ]
        }},
        { property: 'parent', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        body: '评论内容',
        status: {
          __label: '状态',
          pending: '待审核',
          approved: '已通过',
          rejected: '已拒绝'
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
    }
  }
}
