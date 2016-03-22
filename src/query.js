import { _, prepare, debug } from './utils'
import mock from './mock'

const query = prepare()
query.Class = class extends query.Class {
    
    generate() {
        return (this._query = `{${_.mapValid(this._models, model => this.makeQuery(model.build(), this._spaces))}\n}`)
    }

    response() {
        this.generate()

        if (this._debug) {
            debug(this._query, '[query]')
        }
        
        if (this._mock) {
            return mock(this._models).response()
        }
        return this._api(this._path, this._query, this._headers)
    }
}

export { query as default, query }