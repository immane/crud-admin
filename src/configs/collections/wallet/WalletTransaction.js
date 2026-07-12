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
          __label: t('entity.type'),
          deposit: t('entity.deposit'),
          withdrawal: t('entity.withdrawal'),
          transfer: t('entity.transfer'),
          fee: t('entity.fee'),
          refund: t('entity.refund')
        },
        status: {
          __label: t('entity.status'),
          pending: t('entity.pending'),
          completed: t('entity.completed'),
          failed: t('entity.failed'),
          reversed: t('entity.reversed')
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
