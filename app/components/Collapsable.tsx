import clsx from "clsx"
import { ParentComponent } from "solid-js"
import styles from "./Collapsable.module.css"

export const Collapsable: ParentComponent<{ expanded: boolean }> = (props) => {
    return (
        <div
            class={clsx(
                styles.collapsable,
                props.expanded && styles.collapsableExpanded,
            )}
        >
            <div class={styles.collapsableContent}>{props.children}</div>
        </div>
    )
}
