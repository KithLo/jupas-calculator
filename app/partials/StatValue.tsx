import { Component, Show } from "solid-js"
import { useSettings } from "../settings"
import { getStatColor, round } from "../util"
import styles from "./StatValue.module.css"

export const StatDelta: Component<{ delta: number }> = (props) => {
    const [settings] = useSettings()
    return (
        <span
            class={styles.delta}
            style={{
                "background-color": getStatColor(
                    props.delta,
                    settings.darkMode,
                ),
            }}
        >
            {props.delta > 0 ? "+" : ""}
            {round(props.delta)}%
        </span>
    )
}

export const StatValue: Component<{
    stat: number
    delta?: number
    mode: ResultScoredRow["mode"]
}> = (props) => {
    return (
        <>
            {round(props.stat)}
            <Show when={props.mode === "alt"}>
                <span class={styles.remark}>^</span>
            </Show>
            <Show when={props.mode === "last"}>
                <span class={styles.remark}>#</span>
            </Show>
            <Show when={props.delta != null}>
                {" "}
                <StatDelta delta={props.delta!} />
            </Show>
        </>
    )
}
