import clsx from "clsx"
import { FiEdit2 } from "solid-icons/fi"
import { IoAdd, IoChevronDown } from "solid-icons/io"
import { Component, For, Show } from "solid-js"
import { useLocale } from "../data"
import { useProfiles } from "../profile"
import styles from "./ProfileSelector.module.css"

const maxCount = 9

export const ProfileSelector: Component<{
    expanded?: boolean
    onExpand?: (editing: boolean) => void
}> = (props) => {
    const locale = useLocale()
    const { profiles, setActiveProfile, activeProfile, createProfile } =
        useProfiles()

    const isActive = (id: string) => activeProfile().id === id

    const onExpand = (editing: boolean) => props.onExpand?.(editing)

    const onClick = (id: string) => {
        if (isActive(id)) {
            onExpand(!props.expanded)
        } else {
            setActiveProfile(id)
            if (props.expanded) {
                onExpand(true)
            }
        }
    }

    return (
        <div class={styles.profiles}>
            <div>{locale().UI.Profiles}</div>
            <For each={profiles().map((p) => p.id)}>
                {(id, index) => (
                    <div
                        class={clsx(
                            styles.profile,
                            isActive(id) && styles.profileActive,
                        )}
                        onClick={() => onClick(id)}
                    >
                        <span class={styles.profileIndex}>{index() + 1}</span>
                        <Show when={isActive(id)}>
                            <FiEdit2 class={styles.profileEditIcon} />
                        </Show>
                    </div>
                )}
            </For>
            <Show when={profiles().length < maxCount}>
                <div
                    class={styles.profile}
                    // eslint-disable-next-line solid/reactivity
                    onClick={() => createProfile().then(() => onExpand(true))}
                >
                    <IoAdd />
                </div>
            </Show>
            <div class={styles.space} />
            <div
                class={clsx(styles.expand, props.expanded && styles.expanded)}
                onClick={() => onExpand(!props.expanded)}
            >
                <IoChevronDown />
            </div>
        </div>
    )
}
