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
          __label: 'Type',
          deduction: 'Deduction',
          reversal: 'Reversal',
          release: 'Release',
          refund: 'Refund'
        },
        status: {
          __label: 'Status',
          pending: 'Pending',
          applied: 'Applied',
          released: 'Released',
          refunded: 'Refunded',
          reversed: 'Reversed'
        }
      },
      list_display: [
        'id',
        'invoiceNo',
        'amount',
        'type',
        'status',
        'wallet',
        'referenceId',
        'createdAt'
      ]
    },
    detail: {
      detail_display: [
        'id',
        'invoiceNo',
        'amount',
        'currency',
        'type',
        'status',
        'wallet',
        'referenceId',
        'referenceType',
        'metadata',
        'createdAt',
        'updatedAt'
      ]
    }
  }
}
