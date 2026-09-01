import { t } from '@/i18n'
import axios from '@/utils/request'
import { API_PREFIX, apiPath } from '@/api/prefix'

export default {
  Category: {
    form: {
      fields: [
        'name',
        { property: 'slug', required: false, help: t('Category slug help') },
        { property: 'description', type: 'text', required: false },
        { property: 'parent', required: false, help: t('Category parent help') },
        { property: 'sortOrder', required: false, default_value: 0, help: t('Category sortOrder help') },
        { property: 'enabled', type: 'boolean', required: false, default_value: true, help: t('Category enabled help') }
      ]
    },
    list: {
      query: { '@order': 'entity.sortOrder|ASC, entity.id|DESC' },
      list_filter: {
        name: t('Category Name'),
        enabled: {
          label: t('Enabled'),
          type: 'boolean',
          expression: 'entity.getEnabled() == :value'
        },
        'parent.id': () => axios
          .get(apiPath(API_PREFIX, 'manage/categories'))
          .then(res => Object.assign({ __label: t('Parent Category') }, ...res.data.map(v => ({ [v.id]: v.name }))))
      },
      list_display: ['id', 'name', 'slug', 'parent', 'enabled', 'sortOrder', 'createdAt']
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
