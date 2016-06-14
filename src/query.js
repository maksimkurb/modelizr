import { _, base, debug } from './utils'
import mock from './mock'

const query = base()
query.Class = class extends query.Class {

    generate() {
        return (this._query = `{${_.mapValid(this._models, model => this.makeQuery(model.build(), this.getModification('spaces')))}\n}`)
    }

    response() {
        this.generate()

        if (this.getModification('debug')) {
            debug(this._query, `[query: ${_.map(this._models, ({_schema: {key}}) => key)}]`)
        }

        return this.callApi(mock)
    }
}

export { query as default, query }