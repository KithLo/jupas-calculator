import clsx from "clsx"
import { IoFilter } from "solid-icons/io"
import { Component } from "solid-js"
import styles from "./FilterIcon.module.css"

export const FilterIcon: Component<{ active?: boolean }> = (props) => {
    return (
        <IoFilter
            class={clsx(
                styles.headerIcon,
                props.active && styles.headerIconActive,
            )}
        />
    )
}
