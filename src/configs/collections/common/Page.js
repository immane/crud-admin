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
            { value: 'draft', label: t('dashboard.status.draft') },
            { value: 'published', label: t('dashboard.status.published') }
          ]
        }}
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        title: t('entity.title'),
        status: {
          __label: t('entity.status'),
          draft: t('dashboard.status.draft'),
          published: t('dashboard.status.published')
        }
      },
      list_display: ['id', 'title', 'slug', 'status', 'publishedAt', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
