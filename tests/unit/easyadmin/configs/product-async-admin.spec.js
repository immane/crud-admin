// Guards the eager module cycle FormAdmin -> entities -> Product.jsx ->
// ListAdmin -> FormAdmin, which surfaced as
// "Cannot access 'FormAdmin' before initialization" and blanked the async
// json_schema form plugins. Product.jsx must only reference the admin UI
// through async boundaries so the entities graph stays SFC-free.
import ProductModule from '@/configs/collections/trade/Product.jsx'

describe('trade/Product.jsx module graph', () => {
  it('exposes the Product entity config', () => {
    expect(Object.keys(ProductModule)).toContain('Product')
    expect(ProductModule.Product.form.fields).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'specifications' })])
    )
  })

  it('resolves ListAdmin/FormAdmin lazily instead of static SFC imports', async() => {
    const { default: ProductConfig } = await import('@/configs/collections/trade/Product.jsx')
    const manager = ProductConfig.Product.form.fields
      .find(field => field?.property === 'specifications')
    const { ListAdmin, FormAdmin } = manager?.component?.components ?? {}
    expect(ListAdmin?.__asyncLoader).toBeTypeOf('function')
    expect(FormAdmin?.__asyncLoader).toBeTypeOf('function')

    const [listResolved, formResolved] = await Promise.all([
      ListAdmin.__asyncLoader(),
      FormAdmin.__asyncLoader()
    ])
    expect(listResolved?.name).toBe('ListAdmin')
    expect(formResolved?.name).toBe('FormAdmin')
  })
})
