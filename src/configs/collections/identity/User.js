import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  User: {
    form: {
      fields: [
        { property: 'username', field_options: { label: t('Username') }},
        { property: 'email', type: 'email', field_options: { label: t('Email') }},
        {
          property: 'plainPassword',
          type: 'password',
          required: false,
          field_options: { label: t('Password'), placeholder: t('Password') },
          help: t('User password help')
        },
        { property: 'phone', required: false },
        { property: 'phoneVerified', type: 'boolean', required: false },
        { property: 'roles', type: 'json', required: false, default_value: ['ROLE_USER'], help: t('User roles help') }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        username: t('Username'),
        email: t('Email'),
        phone: t('Phone'),
        uuid: t('UUID'),
        phoneVerified: {
          label: t('Phone Verified'),
          type: 'boolean',
          expression: 'entity.getPhoneVerified() == :value'
        }
      },
      list_display: [
        'id',
        'uuid',
        'username',
        'email',
        'phone',
        { property: 'phoneVerified', editable: true },
        { property: 'roles', type: 'array' },
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: ['id', 'uuid', 'username', 'email', 'phone', 'phoneVerified', { property: 'roles', type: 'array' }, 'createdAt', 'updatedAt']
    }
  }
}
