import { Component, Show } from "solid-js"
import { Tooltip } from "../components/Tooltip"
import { useLocale } from "../data"
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
    lastYearId?: string
}> = (props) => {
    const locale = useLocale()
    return (
        <>
            <Show when={props.lastYearId} fallback={round(props.stat)}>
                <Tooltip
                    text={locale().UI.Reference?.replace(
                        "{}",
                        props.lastYearId!,
                    )}
                >
                    {round(props.stat)}
                </Tooltip>
            </Show>
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
