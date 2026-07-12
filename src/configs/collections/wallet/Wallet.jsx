import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Wallet: {
    form: {
      fields: [
        'user',
        { property: 'currency', default_value: 'CNY' },
        { property: 'status', type: 'select', default_value: 'active', type_options: {
          options: [
            { value: 'active', label: t('entity.active') },
            { value: 'frozen', label: t('entity.frozen') }
          ]
        }},
        { property: 'label', required: false }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        status: {
          __label: t('entity.status'),
          active: t('entity.active'),
          frozen: t('entity.frozen')
        }
      },
      list_display: [
        'id', 'user', 'currency',
        {
          property: 'balance',
          component: {
            props: ['data'],
            render() {
              return (<span>$ {(this.data / 100).toFixed(2)}</span>)
            }
          }
        },
        'status', 'version', 'label'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
