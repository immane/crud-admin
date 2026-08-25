import exportExcelCsv from '@/utils/exportExcelCsv'

describe('Utils:exportExcelCsv', () => {
  let originalCreateObjectURL
  let originalBlob
  let mockCreateElement
  let mockAppendChild
  let mockRemoveChild
  let mockClick
  let mockLink
  let originalAlert

  beforeEach(() => {
    // Mock Blob
    originalBlob = globalThis.Blob
    globalThis.Blob = jest.fn(function (content, options) {
      this.content = content
      this.options = options
    })

    // Mock URL.createObjectURL
    originalCreateObjectURL = URL.createObjectURL
    URL.createObjectURL = jest.fn(() => 'blob:mock-url')

    // Mock document.createElement / body append/remove and click
    mockClick = jest.fn()
    mockLink = {
      href: '',
      style: '',
      download: '',
      click: mockClick
    }
    mockCreateElement = jest.spyOn(document, 'createElement').mockImplementation(tag => {
      if (tag === 'a') return mockLink
      return document.createElement(tag)
    })
    mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(node => node)
    mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation(node => node)

    // Mock alert
    originalAlert = globalThis.alert
    globalThis.alert = jest.fn()

    // Ensure non-IE by default (msSaveOrOpenBlob undefined)
    if (window.navigator.msSaveOrOpenBlob) {
      delete window.navigator.msSaveOrOpenBlob
    }
  })

  afterEach(() => {
    globalThis.Blob = originalBlob
    URL.createObjectURL = originalCreateObjectURL
    mockCreateElement.mockRestore()
    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
    globalThis.alert = originalAlert
    // clean msSaveOrOpenBlob if set
    if (window.navigator.msSaveOrOpenBlob) {
      delete window.navigator.msSaveOrOpenBlob
    }
    vi.restoreAllMocks()
  })

  it('creates Blob with BOM and correct type for csv', () => {
    const title = { name: 'Name', age: 'Age' }
    const data = [{ name: 'Alice', age: 30 }]
    exportExcelCsv(title, data, 'test.csv')

    expect(globalThis.Blob).toHaveBeenCalledTimes(1)
    const [content, opts] = globalThis.Blob.mock.calls[0]
    expect(content[0].startsWith('\ufeff')).toBe(true)
    expect(content[0]).toContain('Name,Age')
    expect(content[0]).toContain('"Alice"')
    expect(opts.type).toBe('text/csv')
  })

  it('creates Blob with correct type for xls/xlsx', () => {
    const title = { col: 'Col' }
    const data = [{ col: 'val' }]
    exportExcelCsv(title, data, 'file.xls')
    expect(globalThis.Blob.mock.calls[0][1].type).toBe('application/vnd.ms-excel')

    globalThis.Blob.mockClear()
    exportExcelCsv(title, data, 'file.xlsx')
    expect(globalThis.Blob.mock.calls[0][1].type).toBe('application/vnd.ms-excel')
  })

  it('handles title filtering (falsy values skipped)', () => {
    const title = { a: 'A', b: '', c: null, d: 'D' }
    const data = [{ a: '1', b: '2', c: '3', d: '4' }]
    exportExcelCsv(title, data, 'test.csv')
    const content = globalThis.Blob.mock.calls[0][0][0]
    // Only A and D columns should appear
    expect(content).toContain('A,D')
    expect(content).toContain('"1"')
    expect(content).toContain('"4"')
    expect(content).not.toContain('"2"')
    expect(content).not.toContain('"3"')
  })

  it('handles data rows with missing values as empty string', () => {
    const title = { name: 'Name', age: 'Age' }
    const data = [{ name: 'Bob' }, { age: 25 }, {}]
    exportExcelCsv(title, data, 'test.csv')
    const content = globalThis.Blob.mock.calls[0][0][0]
    // Bob row: "Bob",""
    expect(content).toContain('"Bob",""')
    // second row: "","25"
    expect(content).toContain('"","25"')
    // third row: "",""
    expect(content).toContain('"",""')
  })

  it('uses non-IE branch: creates link, clicks, appends and removes', () => {
    const title = { name: 'Name' }
    const data = [{ name: 'Alice' }]
    exportExcelCsv(title, data, 'test.csv')

    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(mockLink.href).toBe('blob:mock-url')
    expect(mockLink.download).toBe('test.csv')
    expect(mockLink.style).toBe('visibility:hidden')
    expect(mockAppendChild).toHaveBeenCalledWith(mockLink)
    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(mockRemoveChild).toHaveBeenCalledWith(mockLink)
  })

  it('uses IE branch when msSaveOrOpenBlob exists', () => {
    window.navigator.msSaveOrOpenBlob = jest.fn()
    const title = { name: 'Name' }
    const data = [{ name: 'Alice' }]

    exportExcelCsv(title, data, 'test.csv')

    expect(window.navigator.msSaveOrOpenBlob).toHaveBeenCalledTimes(1)
    // IE branch passes tables (string) and fileName, not Blob
    const [tablesArg, nameArg] = window.navigator.msSaveOrOpenBlob.mock.calls[0]
    expect(typeof tablesArg).toBe('string')
    expect(tablesArg).toContain('Name')
    expect(nameArg).toBe('test.csv')
    // Non-IE link should NOT be used
    expect(mockClick).not.toHaveBeenCalled()
  })

  it('IE branch still creates Blob before branching (per source)', () => {
    window.navigator.msSaveOrOpenBlob = jest.fn()
    exportExcelCsv({ a: 'A' }, [{ a: '1' }], 'file.csv')
    // Blob is created before the if check in source
    expect(globalThis.Blob).toHaveBeenCalledTimes(1)
  })

  it('handles empty data array (only header)', () => {
    const title = { name: 'Name', age: 'Age' }
    exportExcelCsv(title, [], 'test.csv')
    const content = globalThis.Blob.mock.calls[0][0][0]
    expect(content).toContain('Name,Age')
    // Should still trigger download
    expect(mockClick).toHaveBeenCalled()
    expect(globalThis.alert).not.toHaveBeenCalled()
  })

  it('does not call alert for normal data (tables !== empty)', () => {
    exportExcelCsv({ a: 'A' }, [{ a: '1' }], 'test.csv')
    expect(globalThis.alert).not.toHaveBeenCalled()
  })

  it('alert branch is unreachable with empty title but still testable - documents dead code', () => {
    // With current implementation, tables never equals '' because header adds '\r\n'
    // So alert is never called even with empty title/data
    exportExcelCsv({}, [], 'test.csv')
    // Tables will be '\r\n' not ''
    expect(globalThis.alert).not.toHaveBeenCalled()
    // But Blob still created
    expect(globalThis.Blob).toHaveBeenCalled()
  })

  it('handles multiple rows correctly', () => {
    const title = { id: 'ID', val: 'Value' }
    const data = [{ id: 1, val: 'a' }, { id: 2, val: 'b' }, { id: 3, val: 'c' }]
    exportExcelCsv(title, data, 'multi.csv')
    const content = globalThis.Blob.mock.calls[0][0][0]
    const lines = content.split('\r\n').filter(l => l)
    // First line header + 3 data lines; first line has BOM prefix
    expect(lines.length).toBe(4)
    expect(lines[0]).toBe('\ufeffID,Value')
  })
})
