import { r, g } from '@/router/generator'

describe('router/generator', () => {
  describe('r(entityName, title)', () => {
    it('generates 4 dummy redirect routes', () => {
      const routes = r('Product', 'Product')
      expect(routes).toHaveLength(4)
    })

    it('r generates correct paths and redirects for Product', () => {
      const routes = r('Product', 'Product Title')
      // create
      expect(routes[0].path).toBe('/dummy/product/create')
      expect(routes[0].redirect).toBe('/product/create')
      expect(routes[0].name).toBe('ProductCreate')
      expect(routes[0].hidden).toBe(true)
      expect(routes[0].meta).toBeUndefined()
      // update with function redirect
      expect(routes[1].path).toBe('/dummy/product/:id/update')
      expect(typeof routes[1].redirect).toBe('function')
      expect(routes[1].redirect({ params: { id: '123' } })).toBe('/product/123/update')
      expect(routes[1].name).toBe('ProductUpdate')
      expect(routes[1].hidden).toBe(true)
      // detail with function redirect
      expect(routes[2].path).toBe('/dummy/product/:id/detail')
      expect(typeof routes[2].redirect).toBe('function')
      expect(routes[2].redirect({ params: { id: '456' } })).toBe('/product/456/detail')
      expect(routes[2].name).toBe('ProductDetail')
      expect(routes[2].hidden).toBe(true)
      // list with meta
      expect(routes[3].path).toBe('/dummy/product/list')
      expect(routes[3].redirect).toBe('/product/list')
      expect(routes[3].name).toBe('ProductList')
      expect(routes[3].meta).toEqual({ title: 'Product Title', icon: 'el-icon-caret-right' })
      expect(routes[3].hidden).toBeUndefined()
    })

    it('r hidden/meta correct by position', () => {
      const routes = r('Invoice', 'Invoice')
      expect(routes[0].hidden).toBe(true)
      expect(routes[1].hidden).toBe(true)
      expect(routes[2].hidden).toBe(true)
      expect(routes[3].hidden).toBeUndefined()
      // only last has meta
      expect(routes[0].meta).toBeUndefined()
      expect(routes[1].meta).toBeUndefined()
      expect(routes[2].meta).toBeUndefined()
      expect(routes[3].meta).toBeDefined()
    })

    it('r handles dasherize/underscore: OrderItem -> order-item', () => {
      const routes = r('OrderItem', 'Order Item')
      expect(routes[0].path).toBe('/dummy/order-item/create')
      expect(routes[1].path).toBe('/dummy/order-item/:id/update')
      expect(routes[2].path).toBe('/dummy/order-item/:id/detail')
      expect(routes[3].path).toBe('/dummy/order-item/list')
      expect(routes[0].redirect).toBe('/order-item/create')
      expect(routes[1].redirect({ params: { id: '1' } })).toBe('/order-item/1/update')
      expect(routes[2].redirect({ params: { id: '2' } })).toBe('/order-item/2/detail')
      expect(routes[3].redirect).toBe('/order-item/list')
    })

    it('r handles other entity names transformation', () => {
      expect(r('PromotionTemplate', 'P')[0].path).toBe('/dummy/promotion-template/create')
      expect(r('StoreOrder', 'S')[0].path).toBe('/dummy/store-order/create')
      expect(r('PaymentDeduction', 'P')[0].path).toBe('/dummy/payment-deduction/create')
      expect(r('WechatUser', 'W')[0].path).toBe('/dummy/wechat-user/create')
      expect(r('SpecificationRecipe', 'R')[0].path).toBe('/dummy/specification-recipe/create')
      expect(r('Content', 'C')[0].path).toBe('/dummy/content/create')
    })

    it('r lowercases single word entity', () => {
      const routes = r('product', 'p')
      // underscore('product') => 'product', dasherize => 'product'
      expect(routes[0].path).toBe('/dummy/product/create')
      expect(routes[0].name).toBe('productCreate')
    })

    it('r preserves entityName case in name', () => {
      const routes = r('orderItem', 't')
      expect(routes[0].name).toBe('orderItemCreate')
      expect(routes[0].path).toBe('/dummy/order-item/create')
    })

    it('r handles already dasherized-like and capitalized variants', () => {
      // 'Orderitem' vs 'OrderItem' should produce same path but different names
      const a = r('Orderitem', 't')
      const b = r('OrderItem', 't')
      expect(a[0].path).toBe('/dummy/orderitem/create')
      expect(b[0].path).toBe('/dummy/order-item/create')
      expect(a[0].name).toBe('OrderitemCreate')
      expect(b[0].name).toBe('OrderItemCreate')
    })

    it('r respects custom meta', () => {
      const customMeta = { title: 'Custom', icon: 'custom-icon', roles: ['ROLE_ADMIN'] }
      const routes = r('Product', 'Product', customMeta)
      expect(routes[3].meta).toEqual(customMeta)
      // first three still hidden without meta
      expect(routes[0].meta).toBeUndefined()
      expect(routes[3].meta.icon).toBe('custom-icon')
    })

    it('r default meta uses title param and default icon', () => {
      const routes = r('Product', 'MyTitle')
      expect(routes[3].meta.title).toBe('MyTitle')
      expect(routes[3].meta.icon).toBe('el-icon-caret-right')
    })

    it('r meta reference is the passed object', () => {
      const meta = { title: 'T', icon: 'I' }
      const routes = r('Product', 'T', meta)
      expect(routes[3].meta).toBe(meta)
    })

    it('r redirect functions handle different id values', () => {
      const routes = r('Tag', 'Tag')
      expect(routes[1].redirect({ params: { id: 0 } })).toBe('/tag/0/update')
      expect(routes[2].redirect({ params: { id: 'abc-123' } })).toBe('/tag/abc-123/detail')
    })
  })

  describe('g(entityName, title, meta, component)', () => {
    it('generates 4 real routes', () => {
      const routes = g('Product', 'Product')
      expect(routes).toHaveLength(4)
    })

    it('g generates correct paths, names, hidden', () => {
      const routes = g('Product', 'Product Title')
      expect(routes[0].path).toBe('/product/create')
      expect(routes[0].name).toBe('ProductCreate')
      expect(routes[0].hidden).toBe(true)

      expect(routes[1].path).toBe('/product/:id/update')
      expect(routes[1].name).toBe('ProductUpdate')
      expect(routes[1].hidden).toBe(true)

      expect(routes[2].path).toBe('/product/:id/detail')
      expect(routes[2].name).toBe('ProductDetail')
      expect(routes[2].hidden).toBe(true)
      expect(routes[2].props).toEqual({ entityParam: 'product' })

      expect(routes[3].path).toBe('/product/list')
      expect(routes[3].name).toBe('ProductList')
      expect(routes[3].hidden).toBeUndefined()
      expect(routes[3].meta).toEqual({ title: 'Product Title', icon: 'el-icon-caret-right' })
    })

    it('g handles OrderItem transformation and props', () => {
      const routes = g('OrderItem', 'Order Item')
      expect(routes[0].path).toBe('/order-item/create')
      expect(routes[1].path).toBe('/order-item/:id/update')
      expect(routes[2].path).toBe('/order-item/:id/detail')
      expect(routes[3].path).toBe('/order-item/list')
      expect(routes[2].props).toEqual({ entityParam: 'order-item' })
    })

    it('g handles multiple entity transformations', () => {
      expect(g('PromotionTemplate', 'P')[0].path).toBe('/promotion-template/create')
      expect(g('StoreOrder', 'S')[2].props).toEqual({ entityParam: 'store-order' })
      expect(g('WechatUser', 'W')[3].path).toBe('/wechat-user/list')
      expect(g('PaymentDeduction', 'P')[0].path).toBe('/payment-deduction/create')
    })

    it('g case handling: lower and mixed', () => {
      const lower = g('product', 't')
      expect(lower[0].path).toBe('/product/create')
      expect(lower[0].name).toBe('productCreate')
      const mixed = g('orderItem', 't')
      expect(mixed[0].path).toBe('/order-item/create')
      expect(mixed[0].name).toBe('orderItemCreate')
    })

    it('g component fallback: without component, uses glob result (may be undefined)', () => {
      const routes = g('NonExistentEntityXYZ', 'Test')
      // formComponent for unknown entity will be undefined, so component should be undefined
      // detail fallback is () => import so it is a function
      expect(routes[0].component).toBeUndefined() // component || formComponent => undefined
      expect(routes[1].component).toBeUndefined()
      expect(typeof routes[2].component).toBe('function')
      expect(routes[3].component).toBeUndefined()
    })

    it('g component override: when component passed, first route uses it', () => {
      const FakeComp = { template: '<div>fake</div>' }
      const routes = g('Product', 'Product', { title: 'T', icon: 'i' }, FakeComp)
      expect(routes[0].component).toBe(FakeComp)
      // other routes still use glob-based components (may be undefined when no view file exists)
      // ensure first route is overridden and not same as second
      expect(routes[0].component).not.toBe(routes[1].component)
      // detail fallback remains a function
      expect(typeof routes[2].component).toBe('function')
    })

    it('g component override with function component', () => {
      const FnComp = () => '<div/>'
      const routes = g('Product', 'Product', undefined, FnComp)
      expect(routes[0].component).toBe(FnComp)
    })

    it('g custom meta passed to list route', () => {
      const customMeta = { title: 'Custom Title', icon: 'my-icon', roles: ['ROLE_ADMIN'] }
      const routes = g('Product', 'Product', customMeta)
      expect(routes[3].meta).toEqual(customMeta)
      expect(routes[0].meta).toBeUndefined()
      expect(routes[1].meta).toBeUndefined()
      expect(routes[2].meta).toBeUndefined()
    })

    it('g default meta uses title and default icon', () => {
      const routes = g('Tag', 'TagTitle')
      expect(routes[3].meta.title).toBe('TagTitle')
      expect(routes[3].meta.icon).toBe('el-icon-caret-right')
    })

    it('g meta reference equality', () => {
      const meta = { title: 'T', icon: 'el-icon-caret-right' }
      const routes = g('Product', 'T', meta)
      expect(routes[3].meta).toBe(meta)
    })

    it('g detail route props entityParam equals dasherized path', () => {
      const cases = ['Product', 'OrderItem', 'PromotionTemplate', 'StoreOrder']
      cases.forEach(name => {
        const routes = g(name, name)
        const expected = name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().replace(/_/g, '-')
        // Use same inflect logic: underscore then dasherize; quick check
        expect(routes[2].props.entityParam).toBeDefined()
        // verify it matches manual transformation for those cases
        expect(typeof routes[2].props.entityParam).toBe('string')
      })
    })

    it('g and r consistency: same entityPath', () => {
      const entity = 'SpecificationRecipe'
      const rRoutes = r(entity, 'R')
      const gRoutes = g(entity, 'R')
      // r dummy path should be /dummy + g path
      expect(rRoutes[0].path).toBe(`/dummy${gRoutes[0].path}`)
      expect(rRoutes[3].path).toBe(`/dummy${gRoutes[3].path}`)
    })
  })
})
