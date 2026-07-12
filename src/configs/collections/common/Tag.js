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
        name: 'Tag Name',
        slug: 'Slug'
      },
      list_display: [
        'id',
        'name',
        'slug',
        'color',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'name',
        'slug',
        'color',
        'type',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
