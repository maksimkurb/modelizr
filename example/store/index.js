import { compose, createStore } from 'redux'
import { Enhancer } from '../components/DevTool'
import reducers from '../reducers/index'

const store = createStore(
    reducers,
    compose(
        Enhancer.instrument()
    )
)

export { store as default, store }