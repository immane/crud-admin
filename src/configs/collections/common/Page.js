import { orderByIdDesc } from '../helpers'

export default {
  Page: {
    form: {
      fields: [
        'title',
        'slug',
        { property: 'body', type: 'text' },
        { property: 'metaTitle', required: false },
        { property: 'metaDescription', type: 'text', required: false },
        { property: 'status', type: 'select', default_value: 'draft', type_options: {
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: 'Title',
        status: {
          __label: 'Status',
          draft: 'Draft',
          published: 'Published'
        }
      },
      list_display: [
        'id',
        'title',
        'slug',
        'status',
        'publishedAt',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'title',
        'slug',
        'status',
        { property: 'body', type: 'text', full_width: true },
        'metaTitle',
        { property: 'metaDescription', type: 'text', full_width: true },
        'author',
        'publishedAt',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
