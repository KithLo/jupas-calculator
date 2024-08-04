import { Navigate, Route, Router } from "@solidjs/router"
import clsx from "clsx"
import { Component } from "solid-js"
import { DataProvider } from "./data"
import { Home } from "./Home"
import { Header } from "./partials/Header"
import { ProfileProvider } from "./profile"
import { SettingsProvider, useSettings } from "./settings"
import styles from "./App.module.css"

const Content: Component = () => {
    const [settings] = useSettings()

    return (
        <div
            class={clsx(
                styles.app,
                settings.darkMode ? styles.dark : styles.light,
            )}
        >
            <Header />
            <div class={styles.content}>
                <Home />
            </div>
            <div id="portal" />
        </div>
    )
}

const Main: Component = () => {
    return (
        <DataProvider>
            <ProfileProvider>
                <SettingsProvider>
                    <Content />
                </SettingsProvider>
            </ProfileProvider>
        </DataProvider>
    )
}

const matchFilters = {
    lang: /^en|tc$/,
    year: /^latest$|^2\d{3}$/,
}

export const App: Component = () => (
    <Router base={import.meta.env.BASE_URL}>
        <Route
            path="/:lang/:year"
            component={Main}
            matchFilters={matchFilters}
        />
        <Route path="*" component={() => <Navigate href="/en/latest" />} />
    </Router>
)
