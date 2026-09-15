import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Picture: {
    form: {
      fields: [
        { property: 'user', required: false },
        { property: 'title', required: false },
        'category',
        { property: 'image', type: 'image', required: true, help: t('Picture image help') },
        { property: 'metadata', type: 'json', required: false, help: t('Picture metadata help') }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: t('Title'),
        'user.username': t('User'),
        'category.name': t('Category')
      },
      list_display: [
        'id',
        { property: 'image', type: 'image' },
        'title',
        'user',
        'category',
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'uuid',
        'title',
        'user',
        'category',
        { property: 'metadata', type: 'json', full_width: true },
        'createdAt',
        'updatedAt',
        { property: 'image', type: 'image', full_width: true }
      ]
    }
  }
}
