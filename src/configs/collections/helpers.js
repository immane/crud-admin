export const orderByIdDesc = {
  '@order': 'entity.id|DESC'
}

export const statusFilter = {
  active: '启用',
  inactive: '停用'
}

export const statusFilterLabel = (label = '状态') => ({
  __label: label,
  ...statusFilter
})
