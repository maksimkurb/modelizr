import { createElement, createFactory } from 'react'
import { createDevTools } from 'redux-devtools'
import DockMonitor from 'redux-devtools-dock-monitor'
import Inspector from 'redux-devtools-inspector'

const Enhancer = createDevTools(
    createElement(
        DockMonitor, {
            changePositionKey: "ctrl-h",
            toggleVisibilityKey: "ctrl-w",
            defaultIsVisible: true,
            defaultPosition: 'bottom',
            defaultSize: 0.9
        },

        createElement(Inspector)
    )
)
const DevTool = createFactory(Enhancer)

export { DevTool as default, Enhancer }