function exportExcelCsv(title, data, fileName) {
  let tables = ''
  let row = ''
  const typeArray = {
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.ms-excel',
    csv: 'text/csv'
  }
  for (const item in title) {
    if (title[item]) {
      row += title[item] + ','
    }
  }
  row = row.slice(0, -1)
  tables += row + '\r\n'
  for (let i = 0; i < data.length; i++) {
    let row = ''
    for (const j in title) {
      if (title[j]) {
        row += '"' + (data[i][j] ? data[i][j] : '') + '",'
      }
    }
    row.slice(0, row.length - 1)
    tables += row + '\r\n'
  }
  if (tables === '') {
    alert('Invalid data')
    return
  }
  const fileType = fileName.split('.')
  const uri = new Blob(['\ufeff' + tables], { type: typeArray[fileType[1]] })
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    // for IE
    window.navigator.msSaveOrOpenBlob(tables, fileName)
  } else {
    // for Non-IE（chrome、firefox etc.）
    const link = document.createElement('a')
    link.href = URL.createObjectURL(uri)
    link.style = 'visibility:hidden'
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export default exportExcelCsv
