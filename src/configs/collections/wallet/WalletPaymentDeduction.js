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
          __label: t('entity.type'),
          deduction: t('entity.deduction'),
          reversal: t('entity.reversal'),
          release: t('entity.release'),
          refund: t('entity.refund')
        },
        status: {
          __label: t('entity.status'),
          pending: t('entity.pending'),
          applied: t('entity.applied'),
          released: t('entity.released'),
          refunded: t('entity.refunded'),
          reversed: t('entity.reversed')
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
