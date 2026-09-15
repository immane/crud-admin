import { createMemoryHistory, createRouter } from 'vue-router'
import { adminIdParam, adminUuidParam } from '@/router/admin-identifiers'

const uuid = '550e8400-e29b-41d4-a716-446655440000'
const component = { template: '<div />' }

const createAdminRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: `/:entityParam/${adminIdParam}/update`, name: 'id-update', component },
    { path: `/:entityParam/${adminUuidParam}/update`, name: 'uuid-update', component },
    { path: `/:entityParam/${adminIdParam}/detail`, name: 'id-detail', component },
    { path: `/:entityParam/${adminUuidParam}/detail`, name: 'uuid-detail', component },
    { path: `/:entityParam/${adminIdParam}/list`, name: 'id-list', component },
    { path: `/:entityParam/${adminUuidParam}/list`, name: 'uuid-list', component }
  ]
})

describe('admin identifier routes', () => {
  it.each([
    ['/users/42/update', 'id-update', 'id', '42'],
    [`/users/${uuid}/update`, 'uuid-update', 'uuid', uuid],
    ['/users/42/detail', 'id-detail', 'id', '42'],
    [`/users/${uuid}/detail`, 'uuid-detail', 'uuid', uuid],
    ['/users/42/list', 'id-list', 'id', '42'],
    [`/users/${uuid}/list`, 'uuid-list', 'uuid', uuid]
  ])('matches %s', async(path, name, key, value) => {
    const router = createAdminRouter()
    await router.push(path)

    expect(router.currentRoute.value.name).toBe(name)
    expect(router.currentRoute.value.params[key]).toBe(value)
  })

  it('does not treat a UUID as a numeric ID', async() => {
    const router = createAdminRouter()
    await router.push(`/users/${uuid}/detail`)

    expect(router.currentRoute.value.params.id).toBeUndefined()
  })
})
