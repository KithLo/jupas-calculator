import { Component } from "solid-js"
import { ProfileForm } from "./partials/ProfileForm"
import { ResultTable } from "./partials/ResultTable"

export const Home: Component = () => {
    return (
        <>
            <ProfileForm />
            <ResultTable />
        </>
    )
}
