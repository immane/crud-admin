import { t } from '@/i18n'
import { orderByIdDesc } from '../helpers'

/**
 * RoleFieldGrant (authorization_role_field_grant)
 *
 * 后端来源:
 *   - Entity: App\Authorization\Entity\RoleFieldGrant
 *     @Table(name: 'authorization_role_field_grant')
 *     @UniqueConstraint(['role_id','resource','action'])
 *     fields: json  (list<string> 去重排序)
 *   - Service: App\Authorization\Service\FieldAuthorizationService / AuthorizationResourceRegistry
 *   - 管理入口: 嵌套在 RoleController 中:
 *       PUT /manage/roles/{uuid}/field-grants/{resource}/{action}
 *     Body: { fields: ["title","body",...] } 或直接 ["title",...]
 *     校验: AuthorizationResourceRegistry::assertValidFields()，未知 resource:action 或非法字段返回 400
 *
 * 当前 Registry 默认数据 (AuthorizationResourceRegistry 构造):
 *   {
 *     'common:content': {
 *       create: ['title','body','category','tags','metadata'],
 *       update: ['title','body','category','tags','metadata']
 *     }
 *   }
 * 可通过 Symfony 服务参数扩展更多资源/动作。
 *
 * 种子数据示例 (SeedAuthorizationCommand::getFieldGrantsData):
 *   - role=store_content_editor, resource=common:content, action=create, fields=[title,body,category,tags]
 *   - role=store_content_editor, resource=common:content, action=update, fields=[title,body,category,tags]
 *   - role=store_content_metadata_editor, resource=common:content, action=create, fields=[title,body,category,tags,metadata]
 *   - role=store_content_metadata_editor, resource=common:content, action=update, fields=[title,body,category,tags,metadata]
 * 区别在于 metadata 字段是否可见/可写：metadata_editor 可操作 metadata，其余不可。
 *
 * 语义:
 *   - 字段授权是“白名单”，仅允许集合内的字段被对应角色在对应动作中写入。
 *   - 运行时由 FieldAuthorizationService 结合 AuthorizationService.effectivePermissions 判定。
 *   - 空或缺失 grant 的资源/动作在 registry 中未注册会抛 Unknown resource action；已注册但无 grant 则按默认拒绝或全开放取决于 voter。
 *
 * 前端注意:
 *   - RoleFieldGrant 无独立 manage 列表端点 (无 ListApiViewMixin)，因此本配置提供两种用法:
 *     1) 作为 Role 表单的子资源：在 Role 详情/编辑中嵌入自定义 component，调用 PUT 子资源接口
 *     2) 作为独立实体测试：若后端另行暴露 /manage/role-field-grants 列表，则本配置可直接复用
 *   - 为便于 EasyAdmin 直接复用，此处提供 entity plural 'role-field-grants' 的完整 CRUD 配置，
 *     若后端未暴露该前缀，请将 entity.prefix 指向 Role 子资源或通过自定义 component 覆写。
 *   - 约束: system 角色的 field-grant 禁止修改 (403)
 */

const resourceOptions = [
  { value: 'common:content', label: 'common:content' }
]
const actionOptions = [
  { value: 'create', label: 'create' },
  { value: 'update', label: 'update' }
]
// 与 Registry 对齐的可选字段
const allowedFields = ['title', 'body', 'category', 'tags', 'metadata']

export default {
  RoleFieldGrant: {
    // 若后端实际未暴露独立前缀，可改为 { name: 'RoleFieldGrant', prefix: '/api/v1/manage/roles', plural: 'field-grants' }
    // 此处保留独立 plural 以便将来直接暴露 /manage/role-field-grants
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
