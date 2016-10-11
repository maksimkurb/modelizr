import { QueryBase, QueryMutators } from './bases'
import { query, mutation, request } from './index'
import { model, union } from './model'
import _ from 'lodash'

if (typeof navigator === 'undefined' || navigator.product != 'ReactNative') {
    require('isomorphic-fetch')
}

export const mapValid = (array, map) => _.map(_.pickBy(array, element => element && element.continue !== false), map)
export const extractMockedObjects = array => {
    let response = {}
    _.forEach(array, element => {
        response = {
            ...response,
            ...element
        }
    })

    return response
}
export const hasValuesOf = (response, model) => {
    const filtered = _.filter(response, value => {
        return (model.required && model.required.length && _.filter(model.required, field => value[field]).length === model.required.length) || false
    })
    return filtered.length == _.size(response)
}

export const getLogger = name => {
    const group = []
    const time = Date.now()

    return {
        add: (output, name) => group.push({output, name}),
        print: () => {
            if (typeof console.groupCollapsed === 'function') console.groupCollapsed(`${name} [${(Date.now() - time) / 1000}s]`)
            _.forEach(group, ({name, output}) => {
                if (typeof console.groupCollapsed === 'function') console.groupCollapsed(name)
                console.log(output)
                if (typeof console.groupEnd === 'function') console.groupEnd()
            })
            if (typeof console.groupEnd === 'function') console.groupEnd()
        }
    }
}

export const base = custom => {
    let res = (...models) => new res.Class(models, res._mutations)
    res.Class = QueryBase
    res._mutations = {}
    res = Object.assign(res, new QueryMutators(res))

    _.forEach(custom, (mutator, key) => res[key] = mutator)

    return res
}

export const warn = message => {
    if (typeof console.warn === 'function') {
        console.warn(message)
    } else {
        console.log(message)
    }
}

export const prepare = mutators => {
    const apply = (obj, target) => {
        const _target = target

        _target._mutations = {
            ...obj._mutations,
            custom: mutators
        }
        return _target
    }

    return base({
        query: function() {
            warn("Calling .query() is deprecated. Please use .get() instead")
            return apply(this, query)
        },

        mutation: function() {
            warn("Calling .mutation() is deprecated. Please use .get() instead")
            return apply(this, mutation)
        },

        request: function() {
            warn("Calling .request() is deprecated. Please use .get() instead")
            return apply(this, request)
        },

        get: function() {
            return {
                query: apply(this, query),
                mutation: apply(this, mutation),
                request: apply(this, request)
            }
        }
    })
}

export const api = ({body, path, contentType, headers, method = "POST"}) => {
    let status = 200

    return fetch(path, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': contentType || 'application/json',
            ...headers || {}
        },
        method: method,
        ...(
            method.toLowerCase() != "get" && method.toLowerCase() != "head" ?
            {body} : {}
        )
    }).then(res => {
        status = res.status
        return res.json()
    }).then(res => {
        const response = {
            status,
            body: res
        }
        if (res.json) {
            if (res.json.data) {
                response.body = res.json.data
                return response
            }
            response.body = res.json
            return response
        } else if (res.data) {
            response.body = res.data
        }
        return response
    })
}

export const alias = (source, key) => {
    if (source.unionOf) {
        const _union = union(key, source.models, source.options)
        return _union
    } else {
        const _model = model(key, _.omit(source.schema, ["key"]))
        return _model
    }
}

export const v4 = () => {
    let uuid = ''
    for (let i = 0; i < 32; i++) {
        let value = Math.random() * 16 | 0
        if (i > 4 && i < 21 && !(i % 4)) uuid += '-'
        uuid += ((i === 12) ? 4 : ((i === 16) ? (value & 3 | 8) : value)).toString(16)
    }
    return uuid
}

export const applyMiddleware = (middleware, res) => {
    return new Promise((resolve, reject) => {
        const callNext = (index = 0, nextRes = res) => {
            if (middleware.length - 1 == index) return middleware[index](nextRes, (res = nextRes) => resolve(res), reject)
            middleware[index](nextRes, (res = nextRes) => callNext(index + 1, res), reject)
        }

        if (middleware && middleware.length) {
            callNext()
        } else {
            resolve(res)
        }
    })
}