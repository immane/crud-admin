import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * RoleFieldGrant (authorization_role_field_grant)
 *
 * Backend source:
 *   - Entity: App\Authorization\Entity\RoleFieldGrant
 *     @Table(name: 'authorization_role_field_grant')
 *     @UniqueConstraint(['role_id','resource','action'])
 *     fields: json  (list<string> deduplicated and sorted)
 *   - Service: App\Authorization\Service\FieldAuthorizationService / AuthorizationResourceRegistry
 *   - Admin entry: nested inside RoleController:
 *       PUT /manage/roles/{uuid}/field-grants/{resource}/{action}
 *     Body: { fields: ["title","body",...] } or directly ["title",...]
 *     Validation: AuthorizationResourceRegistry::assertValidFields(), unknown resource:action or invalid field returns 400
 *
 * Current Registry default data (AuthorizationResourceRegistry constructor):
 *   {
 *     'common:content': {
 *       create: ['title','body','category','tags','metadata'],
 *       update: ['title','body','category','tags','metadata']
 *     }
 *   }
 * Can be extended via Symfony service parameters for more resources/actions.
 *
 * Seed data example (SeedAuthorizationCommand::getFieldGrantsData):
 *   - role=store_content_editor, resource=common:content, action=create, fields=[title,body,category,tags]
 *   - role=store_content_editor, resource=common:content, action=update, fields=[title,body,category,tags]
 *   - role=store_content_metadata_editor, resource=common:content, action=create, fields=[title,body,category,tags,metadata]
 *   - role=store_content_metadata_editor, resource=common:content, action=update, fields=[title,body,category,tags,metadata]
 * Difference is whether metadata field is visible/writable: metadata_editor can operate on metadata, others cannot.
 *
 * Semantics:
 *   - field grant is an allowlist: only fields in the set can be written by the corresponding role in the corresponding action.
 *   - evaluated at runtime by FieldAuthorizationService combined with AuthorizationService.effectivePermissions.
 *   - missing grant for a registered resource/action throws Unknown resource action if not registered; if registered but no grant, default deny or open depends on voter.
 *
 * Frontend notes:
 *   - RoleFieldGrant has no standalone manage list endpoint (no ListApiViewMixin), so this config provides two usages:
 *     1) as Role form sub-resource: embed custom component in Role detail/edit and call PUT sub-resource endpoint
 *     2) as standalone entity for testing: if backend separately exposes /manage/role-field-grants list, this config can be reused directly
 *   - for EasyAdmin reuse, this config provides full CRUD with entity plural 'role-field-grants',
 *     if backend does not expose that prefix, point entity.prefix to Role sub-resource or override via custom component.
 *   - constraint: system role field-grant modification forbidden (403)
 */

const resourceOptions = [
  { value: 'common:content', label: 'common:content' }
]
const actionOptions = [
  { value: 'create', label: 'create' },
  { value: 'update', label: 'update' }
]
// Optional fields aligned with Registry
const allowedFields = ['title', 'body', 'category', 'tags', 'metadata']

export default {
  RoleFieldGrant: {
    // If backend does not expose standalone prefix, change to { name: 'RoleFieldGrant', prefix: '/api/v1/manage/roles', plural: 'field-grants' }
    // Keep standalone plural here for future direct exposure of /manage/role-field-grants
    entity: { name: 'RoleFieldGrant', plural: 'role-field-grants' },

    form: {
      fields: [
        {
          property: 'id',
          type: 'integer',
          required: false,
          field_options: { disabled: true }
        },
        {
          property: 'role',
          type: 'RelationToOne',
          required: true,
          type_options: { entity_name: 'Role' },
          field_options: { placeholder: t('Please select') }
        },
        {
          property: 'resource',
          type: 'select',
          required: true,
          type_options: { options: resourceOptions }
        },
        {
          property: 'action',
          type: 'select',
          required: true,
          type_options: { options: actionOptions }
        },
        {
          property: 'fields',
          type: 'array',
          required: true,
          help: t('Role field grant fields help'),
          type_options: {
            options: allowedFields.map(v => ({ value: v, label: v }))
          }
        }
      ]
    },

    list: {
      query: orderByIdDesc,
      list_filter: {
        resource: {
          __label: t('Resource'),
          'common:content': 'common:content'
        },
        action: {
          __label: t('Action'),
          create: 'create',
          update: 'update'
        },
        'role.code': t('Role Code')
      },
      list_display: [
        'id',
        { property: 'role', type: 'RelationToOne' },
        'resource',
        'action',
        { property: 'fields', type: 'array' },
        { property: 'createdAt', type: 'datetime' },
        { property: 'updatedAt', type: 'datetime' }
      ]
    },

    detail: {
      detail_display: [
        'id',
        { property: 'role', type: 'RelationToOne' },
        'resource',
        'action',
        { property: 'fields', type: 'array' },
        { property: 'createdAt', type: 'datetime' },
        { property: 'updatedAt', type: 'datetime' }
      ]
    }
  }
}
