export const orderByIdDesc = {
  '@order': 'entity.id|DESC'
}

export const statusFilter = {
  active: 'Active',
  inactive: 'Inactive'
}

export const statusFilterLabel = (label = 'Status') => ({
  __label: label,
  ...statusFilter
})
