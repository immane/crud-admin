import { orderByIdDesc } from '../helpers'

export default {
  Tag: {
    form: {
      fields: [
        'name',
        { property: 'slug', required: false },
        { property: 'color', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        name: '标签名称',
        slug: 'Slug'
      },
      list_display: [
        'id',
        'name',
        'slug',
        'color',
        'createdAt'
      ]
    }
  }
}
