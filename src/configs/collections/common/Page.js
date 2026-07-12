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
            { value: 'draft', label: '草稿' },
            { value: 'published', label: '已发布' }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: '标题',
        status: {
          __label: '状态',
          draft: '草稿',
          published: '已发布'
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
