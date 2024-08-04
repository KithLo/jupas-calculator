import clsx from "clsx"
import { Component } from "solid-js"
import styles from "./ProgressBar.module.css"

export const ProgressBar: Component<{
    class?: string
    total: number
    current: number
}> = (props) => (
    <div class={clsx(styles.content, props.class)}>
        <div class={styles.progressBar}>
            <div
                class={styles.inner}
                style={{
                    width: `${((props.current * 100) / props.total).toFixed(
                        2,
                    )}%`,
                }}
            />
        </div>
        <div class={styles.text}>
            {props.current} / {props.total}
        </div>
    </div>
)
