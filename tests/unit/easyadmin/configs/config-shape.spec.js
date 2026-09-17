import { describe, it, expect, vi } from 'vitest'

// Mock i18n FIRST, before importing any entity collection, to avoid store
// side-effects from the real i18n module (localStorage/navigator access).
vi.mock('@/i18n', () => ({ t: (k) => k }))

import entities from '@/configs/entities'
import CategoryModule from '@/configs/collections/common/Category'
import ContentModule from '@/configs/collections/common/Content'

const KNOWN_ACTIONS = ['new', 'detail', 'edit', 'delete', 'batch_edit', 'batch_delete', 'lines', 'pager', 'export']

// Component-only .jsx collection files (AssignmentRoleField, AssignmentScopeField,
// RolePermissionsAction, RolePermissionsDetail, RoleSystemLockedInput,
// RoleSystemLockedScope, RoleUuidField) export a Vue component as default. Since
// entities.js merges every first-level collection file via Object.assign, those
// component keys (name/props/setup/__hmrId, all lowercase) pollute the entities
// map. Real entities are PascalCase; only they are subject to shape assertions.
const NON_ENTITY_KEYS = new Set(['__hmrId', 'name', 'props', 'setup'])

function realEntries() {
  return Object.entries(entities).filter(([key]) => !NON_ENTITY_KEYS.has(key))
}

function collectAll(node, key, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectAll(item, key, out)
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === key) out.push(v)
      collectAll(v, key, out)
    }
  }
}

describe('configs entity shapes', () => {
  it('registers at least 30 entities', () => {
    expect(Object.keys(entities).length).toBeGreaterThanOrEqual(30)
    expect(realEntries().length).toBeGreaterThanOrEqual(30)
  })

  it('holds an object config for every entity', () => {
    for (const [key, value] of realEntries()) {
      expect(typeof value, key).toBe('object')
      expect(value, key).not.toBeNull()
    }
  })

  it('keeps every list_filter value as string|null|function|shaped object', () => {
    for (const [entityName, config] of realEntries()) {
      const filters = config?.list?.list_filter
      if (!filters) continue
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        const label = `${entityName}.${filterKey}`
        if (typeof filterValue === 'string' || filterValue === null || typeof filterValue === 'function') continue
        expect(typeof filterValue, label).toBe('object')
        const keys = Object.keys(filterValue)
        const shaped =
          'expression' in filterValue ||
          '__label' in filterValue ||
          '__default' in filterValue ||
          'label' in filterValue ||
          'type' in filterValue ||
          keys.length > 0
        expect(shaped, label).toBe(true)
      }
    }
  })

  it('restricts every disabled_actions entry to the known set', () => {
    for (const [entityName, config] of realEntries()) {
      const found = []
      collectAll(config, 'disabled_actions', found)
      for (const actions of found) {
        expect(Array.isArray(actions), `${entityName}.disabled_actions`).toBe(true)
        for (const action of actions) {
          expect(KNOWN_ACTIONS, `${entityName}.${action}`).toContain(action)
        }
      }
    }
  })

  it('keeps every detail_display as __all__ or an array', () => {
    for (const [entityName, config] of realEntries()) {
      const found = []
      collectAll(config, 'detail_display', found)
      for (const display of found) {
        expect(
          display === '__all__' || Array.isArray(display),
          `${entityName}.detail_display`
        ).toBe(true)
      }
    }
  })

  it('keeps every batch_edit.fields as a non-empty array', () => {
    for (const [entityName, config] of realEntries()) {
      const found = []
      collectAll(config, 'batch_edit', found)
      for (const batchEdit of found) {
        expect(Array.isArray(batchEdit?.fields), `${entityName}.batch_edit.fields`).toBe(true)
        expect(batchEdit.fields.length, `${entityName}.batch_edit.fields`).toBeGreaterThan(0)
      }
    }
  })

  it('gives every list.query an @order or @filter key when present', () => {
    for (const [entityName, config] of realEntries()) {
      const query = config?.list?.query
      if (!query) continue
      expect(
        '@order' in query || '@filter' in query,
        `${entityName}.list.query`
      ).toBe(true)
    }
  })

  it('registers the distinctive entities by name', () => {
    for (const name of [
      'Assignment', 'AuditLog', 'Permission', 'Role', 'User', 'Profile',
      'Order', 'OrderItem', 'Product', 'Specification',
      'Category', 'Comment', 'Content', 'Setting',
      'Stock', 'Store', 'Wallet', 'Media'
    ]) {
      expect(entities, name).toHaveProperty(name)
    }
  })

  it('keeps the Setting 3-key sort order', () => {
    expect(entities.Setting.list.query).toEqual({
      '@order': 'entity.groupName|ASC, entity.sortOrder|ASC, entity.id|DESC'
    })
  })

  it('keeps the InventoryStock custom prefix identity', () => {
    expect(entities.Stock.entity).toEqual({
      name: 'Stock',
      prefix: '/api/v1/manage/inventory',
      plural: 'stocks'
    })
  })

  it('uses json_schema fields for Store contact/address', () => {
    const fields = entities.Store.form.fields
    const byProperty = Object.fromEntries(
      fields.filter((f) => typeof f === 'object').map((f) => [f.property, f])
    )
    expect(byProperty.contact.type).toBe('json_schema')
    expect(byProperty.address.type).toBe('json_schema')
  })

  it('marks Wallet balance as hidden', () => {
    const fields = entities.Wallet.form.fields
    const balance = fields.find((f) => typeof f === 'object' && f.property === 'balance')
    expect(balance.hidden).toBe(true)
  })

  it('leaves Media without a form config', () => {
    expect(entities.Media.form).toBeUndefined()
  })

  it('owns async Category/Content filters as factory functions (axios never invoked)', () => {
    expect(typeof CategoryModule.Category.list.list_filter['parent.id']).toBe('function')
    expect(typeof ContentModule.Content.list.list_filter['category.id']).toBe('function')
  })
})
