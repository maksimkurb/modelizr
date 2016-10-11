import _ from 'lodash'
import { SET_ENTITIES } from '../actions/index'

const combineReducers = reducers => (state, action) => {
    const combine = (reducers, state) => {
        return {
            ...state,
            ..._.mapValues(reducers, (value, key) => {
                if (typeof value === 'function') {
                    return value(state ? state[key] : state, action)
                } else {
                    return combine(reducers[key], state ? state[key] : undefined)
                }
            })
        }
    }

    return combine(reducers, state)
}

const entityReducer = entityType => (state = {}, action) => {
    switch (action.type) {
        case SET_ENTITIES:
            if (action.entity == entityType) {
                return {...state, ...action.collection}
            }
            return state

        default:
            return state
    }
}

export default combineReducers({
    entities: {
        users: entityReducer('users'),
        books: entityReducer('books')
    }
})