export interface FieldOption {
  property: string
  label?: string
  type?: string
  required?: boolean
  editable?: boolean
  tab?: string
  default_value?: unknown
  field_options?: Record<string, unknown>
  field_events?: Record<string, unknown>
  type_options?: Record<string, unknown>
  type_events?: Record<string, unknown>
  relation_filter?: Record<string, unknown>
  component?: unknown
  [key: string]: unknown
}

export type FieldConfig = string | FieldOption

export interface FormConfig {
  fields: FieldConfig[] | '__all__'
  batch_edit?: {
    fields: FieldConfig[]
  }
}

export interface ListConfig {
  list_display?: FieldConfig[]
  list_filter?: Record<string, unknown>
  query?: Record<string, unknown>
  disabled_actions?: Array<'new' | 'detail' | 'edit' | 'delete' | 'batch_edit' | 'batch_delete' | 'lines' | 'pager' | 'export'>
  data_processor?: (...args: unknown[]) => unknown
  actions?: Array<Record<string, unknown>>
  export?: Record<string, unknown>
}

export interface EntityConfig {
  entity?: string
  form?: FormConfig
  list?: ListConfig
}

export type EntityConfigMap = Record<string, EntityConfig>
