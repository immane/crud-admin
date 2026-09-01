import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

export default {
  SpecificationRecipe: {
    entity: { name: 'SpecificationRecipe', prefix: '/api/v1/manage/inventory', plural: 'recipes' },
    form: {
      fields: [
        { property: 'specificationUuid', help: t('SpecificationRecipe specificationUuid help') },
        {
          property: 'status',
          type: 'select',
          default_value: 'active',
          help: t('SpecificationRecipe status help'),
          type_options: {
            options: [
              { value: 'active', label: t('Active') },
              { value: 'inactive', label: t('Inactive') }
            ]
          }
        },
        { property: 'lines', full_width: true, help: t('SpecificationRecipe lines help') }
      ]
    },
    list: {
      query: orderByIdDesc,
      disabled_actions: ['delete'],
      list_filter: {
        specificationUuid: t('Specification UUID'),
        status: {
          __label: t('Status'),
          active: t('Active'),
          inactive: t('Inactive')
        }
      },
      list_display: [
        'id',
        'uuid',
        'specificationUuid',
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
