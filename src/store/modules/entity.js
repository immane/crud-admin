const EntitiesKey = 'dream_studio_entities'
const StructuresKey = 'dream_studio_structures'

const getDefaultEntities = () => {
  try {
    return {
      entities: JSON.parse(sessionStorage.getItem(EntitiesKey)),
      structures: JSON.parse(sessionStorage.getItem(StructuresKey))
    }
  } catch (e) {
    return {
      entities: [],
      structures: {}
    }
  }
}

const state = getDefaultEntities()

const mutations = {
  RESET_STATE: (state) => {
    sessionStorage.removeItem(EntitiesKey)
    sessionStorage.removeItem(StructuresKey)

    Object.assign(state, getDefaultEntities())
  },

  SET_STRUCTURES: (state, { entity, structure }) => {
    if (!state.structures) state.structures = {}
    state.structures[entity] = structure
    sessionStorage.setItem(StructuresKey, JSON.stringify(state.structures))
  },

  SET_ENTITIES: (state, data) => {
    if (data instanceof Array) {
      state.entities = data
      sessionStorage.setItem(EntitiesKey, JSON.stringify(state.entities))
    }
  }
}

const actions = {
  set_structures({ commit }, data) {
    commit('SET_STRUCTURES', data)
  },

  set_entities({ commit }, data) {
    commit('SET_ENTITIES', data)
  },

  // remove entities
  reset({ commit }) {
    return new Promise(resolve => {
      commit('RESET_STATE')
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

