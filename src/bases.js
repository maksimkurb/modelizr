import { api, warn, mapValid, applyMiddleware } from './utils'
import normalize from './normalizer'
import _ from 'lodash'

class QueryMutators {
    constructor(target) {
        this._mutations = {
            spaces: 3,
            mockDelay: 0,
            mockError: false,
            query: true,
            api
        }

        this._this = target || this
    }

    applyModification = (key, value) => {
        this._this._mutations[key] = value
        return this._this
    }
    getModification = key => {
        return this._this._mutations[key]
    }

    spaces = spaces => this.applyModification('spaces', spaces)
    api = api => this.applyModification('api', api)
    path = path => this.applyModification('path', path)
    headers = headers => this.applyModification('headers', {...this.getModification('headers'), ...headers})
    debug = debug => this.applyModification('debug', debug === undefined ? true : debug)
    custom = func => func(this.applyModification, this.getModification)

    mockConfig = opts => this.applyModification('mockConfig', {...this.getModification('mockConfig'), ...opts})
    mock = (mock, opts) => {
        if (opts) this.applyModification('mockConfig', {...this.getModification('mockConfig'), ...opts})
        return this.applyModification('mock', mock === undefined ? true : mock)
    }

    error = error => {
        warn("the .error() modifier is deprecated. Please rather specify errors via mockConfig")
        return this.applyModification('mockConfig', {
            ...this.getModification('mockConfig') || {},
            error: error === undefined ? 'throw' : error
        })
    }

    delay = delay => {
        warn("the .delay() modifier is deprecated. Please rather specify a delay via mockConfig")
        return this.applyModification('mockConfig', {
            ...this.getModification('mockConfig') || {},
            delay: delay || 500
        })
    }

    middleware = middleware => this.applyModification('middleware', [...this.getModification('middleware') || [], ...middleware])
}

class QueryBase extends QueryMutators {
    constructor(models, mutations) {
        super()

        if (_.uniqBy(models, model => (model._schema || {}).key).length !== models.length) {
            warn("You are making a query or mutation with duplicate top level keys. Was this a mistake?")
        }

        this._models = models
        this._mutations = {
            ...this._mutations,
            ...mutations
        }

        _.forEach(mutations.custom, (mutator, key) => this[key] = mutator(this.applyModification, this.getModification))
    }

    spacer(amount) {
        return _.join(_.map(_.range(0, amount), () => ''), ' ')
    }

    makeParams(params) {
        if (!_.isEmpty(params)) {
            return `(${_.map(_.pickBy(params, param => param || param === false), (param, key) => `${key}: ${JSON.stringify(param).replace(/\"([^(\")"]+)\":/g, "$1:")}`)})`
        }
        return ''
    }

    makeQuery(model, spaces = 3, indent = 1, prefix = false) {
        const mapProps = (props, indent) => {
            const currentIndent = `\n${this.spacer(spaces * indent)}`

            return mapValid(props, (prop, key) => {
                if (prop.model) return this.makeQuery(prop, spaces, indent, model._isUnion)

                if (prop.type == 'object') {
                    return this.makeQuery({
                        ...{
                            key: key
                        },
                        ...prop
                    }, spaces, indent)
                }

                return `${currentIndent}${key}${prop.alias ? `: ${prop.alias}` : ''}`
            })
        }

        const currentIndent = this.spacer(spaces * indent)

        return `\n${currentIndent}${prefix ? '... on ' : ''}${model.key}${this.makeParams(model.params)} {${mapProps(model.properties, indent + 1)}\n${currentIndent}}`
    }

    then(cb) {
        cb = cb || function() {
            }

        const normalizr = res => normalize(
            res,
            ...this._models
        )

        return this.response()
            .then(res => {
                if (this.debugger) {
                    this.debugger.add(res, "response")
                    this.debugger.print()
                }

                return res
            })
            .catch(e => {
                if (this.debugger) {
                    this.debugger.add(e, "error")
                    this.debugger.print()
                }
                throw e
            })
            .then(res => applyMiddleware(this.getModification('middleware'), res))
            .then(res => cb(res, normalizr))
    }

    normalize(cb) {
        cb = cb || function() {
            }

        return this.response()
            .then(res => applyMiddleware(this.getModification('middleware'), res))
            .then(res => {
                if (this.debugger) this.debugger.add(res, "response")
                const response = normalize(
                    res.body,
                    ...this._models
                )
                if (this.debugger) {
                    this.debugger.add(response, "normalized response")
                    this.debugger.print()
                }
                return response
            })
            .catch(e => {
                if (this.debugger) {
                    this.debugger.add(e, "error")
                    this.debugger.print()
                }
                throw e
            })
            .then(cb)
    }

    response() {
        return this._models
    }

    generate() {
        return '{}'
    }

    callApi(mock, body) {
        if (this.getModification('mock')) {
            if (this.getModification('query')) {
                return mock(this._models)
                    .mockConfig(this.getModification('mockConfig'))
                    .response()
            }
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(true)
                }, (this.getModification('mockConfig') || {delay: 0}).delay)
            })
        }
        return this.getModification('api')({
            ...this._mutations,
            body: body ? body : JSON.stringify({query: this._query})
        })
    }
}

class ModelBase {
    build() {
        const _build = {
            ...this._schema,
            properties: {
                ...this._schema.properties,
                ..._.mapKeys(_.mapValues(this._models, model => model.build()), model => model.key)
            }
        }

        if (_.size(_build.properties)) {
            _build.type = 'object'
        }

        return _build
    }

    applyModification(key, value) {
        this._schema[key] = value
        return this
    }

    as = key => this.applyModification('key', key)
    params = params => this.applyModification('params', params)

    valuesOf = () => this.applyModification('_modelType', 'valuesOf')
    arrayOf = () => this.applyModification('_modelType', 'arrayOf')
}

export { ModelBase, QueryBase, QueryMutators }