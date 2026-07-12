import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  WalletPaymentDeduction: {
    entity: { name: 'WalletPaymentDeduction', plural: 'payment-deductions' },
    form: {
      fields: '__all__'
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['new', 'edit', 'delete'],
      list_filter: {
        type: {
          __label: t('Type'),
          deduction: t('Deduction'),
          reversal: t('Reversal'),
          release: t('Release'),
          refund: t('Refund')
        },
        status: {
          __label: t('Status'),
          pending: t('Pending'),
          applied: t('Applied'),
          released: t('Released'),
          refunded: t('Refunded'),
          reversed: t('Reversed')
        }
      },
      list_display: [
        'id', 'invoiceNo', 'amount', 'type', 'status',
        'wallet', 'referenceId', 'createdAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
