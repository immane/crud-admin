import { orderByIdDesc } from '../helpers'

export default {
  User: {
    form: {
      fields: [
        { property: 'username', field_options: { label: 'Username' }},
        { property: 'email', field_options: { label: 'Email' }},
        { property: 'phone', required: false },
        { property: 'phoneVerified', type: 'boolean', required: false },
        { property: 'roles', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        username: 'Username',
        email: 'Email',
        phone: 'Phone'
      },
      list_display: [
        'id',
        'username',
        'email',
        'phone',
        'phoneVerified',
        { property: 'roles', type: 'array' }
      ]
    },
    detail: {
      detail_display: [
        'id',
        'username',
        'email',
        'phone',
        'phoneVerified',
        { property: 'roles', type: 'array', full_width: true },
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
