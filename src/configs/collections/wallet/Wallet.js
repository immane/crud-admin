import { orderByIdDesc } from '../helpers'

export default {
  Wallet: {
    form: {
      fields: [
        'user',
        { property: 'currency', default_value: 'CNY' },
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: '启用' },
            { value: 'frozen', label: '冻结' }
          ]
        }},
        { property: 'label', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: '状态',
          active: '启用',
          frozen: '冻结'
        }
      },
      list_display: [
        'id',
        'user',
        'currency',
        {
          property: 'balance',
          component: {
            props: ['data'],
            render(h) {
              return (<span>$ {(this.data / 100).toFixed(2)}</span>)
            }
          }
        },
        'status',
        'version',
        'label'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'user',
        'currency',
        {
          property: 'balance',
          component: {
            props: ['data'],
            render(h) {
              return (<span style='font-size: 28px; font-weight: 700; color: #2d5aa0;'>$ {(this.data / 100).toFixed(2)}</span>)
            }
          }
        },
        'status',
        'version',
        'label',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
