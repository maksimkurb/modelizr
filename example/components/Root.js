import { Component, createFactory, createElement } from 'react'
import { render } from 'react-dom'

import store from '../store/index'
import DevTool from './DevTool'
import { div, button, input } from './elements'
import { requestUsers, mutateUser, mutateUserAndFetch, plainRequest } from '../actions/index'

class Root extends Component {
    constructor() {
        super()

        this.state = {
            mock: true,
            error: false,
            delay: 0
        }
    }

    setDelay = e => {
        const {value} = e.target

        if ((/^\d+$/).test(value) || value == '') {
            this.setState({
                delay: value
            })
        }
    }

    render() {
        const {mock, error, delay} = this.state

        return div({style: {display: 'flex', justifyContent: 'center'}},
            "delay: ",
            input({type: 'text', value: delay, onChange: this.setDelay}),
            button({onClick: () => this.setState({error: !error})}, `${error ? "don't throw errors" : 'throw errors'}`),
            button({onClick: () => this.setState({mock: !mock})}, `${mock ? 'stop' : 'start'} mocking`),

            button({onClick: () => requestUsers(mock, delay, error)}, "request users"),
            button({onClick: () => mutateUser(mock, delay, error)}, "mutate user"),
            button({onClick: () => mutateUserAndFetch(mock, delay, error)}, "mutate user and fetch"),
            button({onClick: () => plainRequest(mock, delay, error)}, "make plain request"),
            
            DevTool({store})
        )
    }
}

window.onload = () => {
    render(createElement(Root), document.getElementById('root'))
}