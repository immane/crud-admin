import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  Material: {
    entity: { name: 'Material', prefix: '/api/v1/manage/inventory', plural: 'materials' },
    form: {
      fields: [
        'code',
        'name',
        {
          property: 'kind',
          type: 'select',
          default_value: 'raw',
          help: t('Material kind help'),
          type_options: {
            options: [
              { value: 'raw', label: t('Raw') },
              { value: 'finished', label: t('Finished') },
              { value: 'packaging', label: t('Packaging') }
            ]
          }
        },
        'unit',
        {
          property: 'status',
          type: 'select',
          default_value: 'active',
          help: t('Material status help'),
          type_options: {
            options: [
              { value: 'active', label: t('Active') },
              { value: 'inactive', label: t('Inactive') }
            ]
          }
        },
        { property: 'metadata', type: 'json', required: false, help: t('Material metadata help') }
      ]
    },
    list: {
      query: orderByIdDesc,
      list_filter: {
        code: t('Code'),
        name: t('Name'),
        kind: {
          __label: t('Kind'),
          raw: t('Raw'),
          finished: t('Finished'),
          packaging: t('Packaging')
        },
        status: {
          __label: t('Status'),
          active: t('Active'),
          inactive: t('Inactive')
        }
      },
      list_display: [
        'id',
        'code',
        'name',
        'kind',
        'unit',
        'status',
        'createdAt',
        'updatedAt'
      ]
    },
    detail: {
      detail_display: '__all__'
    }
  }
}
