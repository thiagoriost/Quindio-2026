import { getAppStore } from 'jimu-core'

export const widgetIdPorNombre = (widgetName: string): string | undefined => {
    const appConfig = getAppStore().getState().appConfig
    const widgets = appConfig?.widgets ?? {}

    const widgetEntry = Object.entries(widgets).find(([, widget]: [string, any]) => {
        return widget?.manifest?.name === widgetName || widget?.name === widgetName
    })

    if (!widgetEntry) {
        return undefined
    }

    const widgetId = widgetEntry[0]
    return widgetId
}