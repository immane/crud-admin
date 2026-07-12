import { orderByIdDesc } from '../helpers'

export default {
  User: {
    form: {
      fields: [
        { property: 'username', field_options: { label: '用户名' }},
        { property: 'email', field_options: { label: 'Email' }},
        { property: 'phone', required: false },
        { property: 'phoneVerified', type: 'boolean', required: false },
        { property: 'roles', type: 'json', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        username: '用户名',
        email: 'Email',
        phone: '手机号'
      },
      list_display: [
        'id',
        'username',
        'email',
        'phone',
        'phoneVerified',
        { property: 'roles', type: 'array' }
      ]
    }
  }
}
