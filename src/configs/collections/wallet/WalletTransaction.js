import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  WalletTransaction: {
    entity: { name: 'WalletTransaction', plural: 'transactions' },
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'edit', 'delete'],
      list_filter: {
        type: {
          __label: t('Type'),
          deposit: t('Deposit'),
          withdrawal: t('Withdrawal'),
          transfer: t('Transfer'),
          fee: t('Fee'),
          refund: t('Refund')
        },
        status: {
          __label: t('Status'),
          pending: t('Pending'),
          completed: t('Completed'),
          failed: t('Failed'),
          reversed: t('Reversed')
        }
      },
      list_display: [
        'id', 'uuid', 'amount', 'type', 'status',
        'fromWallet', 'toWallet', 'referenceId', 'createdAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
