import { t } from '@/i18n'

export default {
  Stock: {
    entity: { name: 'Stock', prefix: '/api/v1/manage/inventory', plural: 'stocks' },
    form: {
      fields: [
        'storeUuid',
        'material',
        'onHandQuantity',
        'reservedQuantity',
        'allowNegativeStock'
      ]
    },
    list: {
      query: { '@order': 'entity.storeUuid|ASC, entity.id|DESC' },
      // The stock API uses storeUuid + materialUuid as a composite key, which
      // the generic /{id} detail route cannot address.
      disabled_actions: ['new', 'detail', 'edit', 'delete'],
      list_filter: {
        storeUuid: t('Store UUID'),
        material: t('Material')
      },
      list_display: [
        'id',
        'storeUuid',
        'material',
        'onHandQuantity',
        'reservedQuantity',
        'allowNegativeStock',
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
