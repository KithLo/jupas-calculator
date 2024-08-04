import {
    createContext,
    createEffect,
    ParentComponent,
    useContext,
} from "solid-js"
import { createStore, SetStoreFunction } from "solid-js/store"

const darkModeKey = "darkMode"

const defaultSettings: Settings = {
    darkMode:
        !!localStorage.getItem(darkModeKey) ||
        window.matchMedia("(prefers-color-scheme: dark)").matches,
}

type ContextType = [get: Settings, set: SetStoreFunction<Settings>]

const Context = createContext<ContextType>(undefined as unknown as ContextType)

export function useSettings() {
    return useContext(Context)
}

export const SettingsProvider: ParentComponent = (props) => {
    const [settings, setSettings] = createStore<Settings>(defaultSettings)

    createEffect(() => {
        if (settings.darkMode) {
            localStorage.setItem(darkModeKey, "1")
        } else {
            localStorage.removeItem(darkModeKey)
        }
    })

    return (
        <Context.Provider value={[settings, setSettings]}>
            {props.children}
        </Context.Provider>
    )
}
