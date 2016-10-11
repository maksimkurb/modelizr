import { base, getLogger, mapValid } from './utils'
import mock from './mock'
import _ from 'lodash'

const query = base()
query.Class = class extends query.Class {

    generate() {
        return (this._query = `{${mapValid(this._models, model => this.makeQuery(model.build(), this.getModification('spaces')))}\n}`)
    }

    response() {
        this.generate()

        if (this.getModification('debug')) {
            this.debugger = getLogger(`[query: ${_.map(this._models, ({_schema: {key}}) => key)}]`)
            this.debugger.add(this._query, "query")
        }

        return this.callApi(mock)
    }
}

export { query as default, query }