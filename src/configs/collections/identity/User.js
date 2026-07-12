import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  User: {
    form: {
      fields: [
        { property: 'username', field_options: { label: t('entity.username') }},
        { property: 'email', field_options: { label: t('entity.email') }},
        { property: 'phone', required: false },
        { property: 'phoneVerified', type: 'boolean', required: false },
        { property: 'roles', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        username: t('entity.username'),
        email: t('entity.email'),
        phone: t('entity.phone')
      },
      list_display: [
        'id', 'username', 'email', 'phone', 'phoneVerified',
        { property: 'roles', type: 'array' }
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
