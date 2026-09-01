import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * Permission (authorization_permission)
 *
 * Backend source: App\Authorization\Entity\Permission (src/Authorization/Entity/Permission.php)
 * Manage API: GET/GET /api/v1/manage/permissions  (App\Authorization\Controller\Manage\PermissionController)
 *   - Only supports List + Detail (ListApiViewMixin + DetailApiViewMixin), no Create/Update/Delete
 *   - Permission routes require ROLE_ADMIN: #[IsGranted('ROLE_ADMIN')] @Route('/manage/permissions')
 *   - List supports @filter / @order / @dql / @select / @expands and other generic queries (BaseService)
 *
 * Permission model: code = "{module}:{resource}:{action}" e.g. "store:product:create"
 *   - module: business module (authorization / common / store / wallet)
 *   - resource: resource (role / assignment / content / product / order / voucher ...)
 *   - action: action (manage / read / create / update / delete / accept / fulfill / manual ...)
 *   - name/description: human-readable display; isSystem: whether system built-in (cannot be freely added/deleted via API)
 *   - permissions are written to DB via SeedAuthorizationCommand seed data, isSystem=true
 *
 * Frontend note: Permission is a read-only dictionary table, no create/edit/delete entry; role permissions are
 * replaced in bulk via Role endpoint POST /manage/roles/{uuid}/permissions.
 */
export default {
  Permission: {
    // entity config: maps to backend /api/v1/manage/permissions
    entity: {
      name: 'Permission',
      // API prefix defaults to /api/v1/manage, plural override avoids pluralization ambiguity
      plural: 'permissions'
    },

    form: {
      fields: [
        {
          property: 'id',
          type: 'integer',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'code',
          required: true,
          field_options: { placeholder: 'authorization:role:manage' }
        },
        {
          property: 'module',
          required: true,
          field_options: { placeholder: 'authorization' }
        },
        {
          property: 'resource',
          required: true,
          field_options: { placeholder: 'role' }
        },
        {
          property: 'action',
          required: true,
          field_options: { placeholder: 'manage' }
        },
        {
          property: 'name',
          required: true,
          field_options: { placeholder: t('Name') }
        },
        {
          property: 'description',
          type: 'textarea',
          required: false,
          field_options: { rows: 3, placeholder: t('Description') }
        },
        {
          property: 'isSystem',
          type: 'boolean',
          required: false,
          default_value: false,
          field_options: { disabled: true }
        }
      ]
    },

    list: {
      query: orderByIdDesc,
      // Read-only entity: disable create/edit/delete/bulk operations
      disabled_actions: ['new', 'edit', 'delete', 'batch_edit', 'batch_delete'],
      list_filter: {
        code: t('Code'),
        module: {
          __label: t('Module'),
          authorization: 'authorization',
          common: 'common',
          store: 'store',
          wallet: 'wallet'
        },
        resource: {
          __label: t('Resource'),
          role: 'role',
          assignment: 'assignment',
          content: 'content',
          product: 'product',
          order: 'order',
          specification: 'specification',
          voucher: 'voucher'
        },
        action: {
          __label: t('Action'),
          manage: 'manage',
          read: 'read',
          create: 'create',
          update: 'update',
          delete: 'delete',
          accept: 'accept',
          reject: 'reject',
          fulfill: 'fulfill',
          manual: 'manual'
        },
        name: t('Name'),
        isSystem: {
          label: t('Is System'),
          type: 'boolean',
          expression: 'entity.isSystem() == :value'
        }
      },
      list_display: [
        'id',
        'code',
        'module',
        'resource',
        'action',
        'name',
        { property: 'isSystem', type: 'boolean' },
        { property: 'createdAt', type: 'datetime' },
        { property: 'updatedAt', type: 'datetime' }
      ]
    },

    detail: {
      detail_display: [
        'id',
        'code',
        'module',
        'resource',
        'action',
        'name',
        { property: 'description', type: 'textarea' },
        { property: 'isSystem', type: 'boolean' },
        { property: 'createdAt', type: 'datetime' },
        { property: 'updatedAt', type: 'datetime' }
      ],
      disabled_actions: ['edit']
    }
  }
}
