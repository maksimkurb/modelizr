import { base, getLogger } from './utils'
import mock from './mock'

const request = base()
request.Class = class extends request.Class {

    constructor(models, mutations) {
        super(models, mutations)

        this._mutations = {
            ...this._mutations,
            contentType: 'application/json',
            method: 'POST'
        }
    }

    response() {
        if (this.getModification('debug')) {
            this.debugger = getLogger(`[request: ${this.getModification('path')} <${this.getModification('method') || 'POST'}>]`)
            this.debugger.add(this.getModification('body'), "body")
        }

        return this.callApi(mock, this.getModification('body'))
    }

    method = method => this.applyModification('method', (method || 'POST').toUpperCase())
    contentType = type => this.applyModification('contentType', type)
    body = body => {
        if (typeof body === 'object') body = JSON.stringify(body)
        return this.applyModification('body', body)
    }
}

export { request as default, request }