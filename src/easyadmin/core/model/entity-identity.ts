// Canonical entity identity.
// Pure: the pluralize strategy is injected so core never imports inflect,
// axios, Vuex, or browser globals.

export type EntityConf =
  | string
  | {
      name: string
      prefix?: string
      plural?: string
    }

export interface EntityIdentity {
  name: string
  prefix: string
  plural: string
}

export interface IdentityOptions {
  defaultPrefix: string
  parameterize: (name: string) => string
}

export function resolveEntityIdentity(conf: EntityConf, options: IdentityOptions): EntityIdentity {
  if (typeof conf === 'string') {
    return {
      name: conf,
      prefix: options.defaultPrefix,
      plural: options.parameterize(conf)
    }
  }
  return {
    name: conf.name,
    prefix: conf.prefix || options.defaultPrefix,
    plural: conf.plural || options.parameterize(conf.name)
  }
}
