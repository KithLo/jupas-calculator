import { Component } from "solid-js"
import { useLocale } from "../data"
import styles from "./Footer.module.css"

export const Footer: Component = () => {
    const locale = useLocale()
    return (
        <div class={styles.footer}>
            <div>#: {locale().UI.RemarkLastStat}</div>
            <div>^: {locale().UI.RemarkAltStat}</div>
        </div>
    )
}
