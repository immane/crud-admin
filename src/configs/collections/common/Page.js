import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Page: {
    form: {
      fields: [
        'title', 'slug',
        { property: 'body', type: 'text' },
        { property: 'metaTitle', required: false },
        { property: 'metaDescription', type: 'text', required: false },
        { property: 'status', type: 'select', default_value: 'draft', type_options: {
          options: [
            { value: 'draft', label: t('Draft') },
            { value: 'published', label: t('Published') }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: t('Title'),
        status: {
          __label: t('Status'),
          draft: t('Draft'),
          published: t('Published')
        }
      },
      list_display: ['id', 'title', 'slug', 'status', 'publishedAt', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
