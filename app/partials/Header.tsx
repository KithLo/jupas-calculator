import { A, useLocation } from "@solidjs/router"
import { not } from "rambda"
import { IoContrast, IoLanguage, IoLogoGithub } from "solid-icons/io"
import { Component, createMemo } from "solid-js"
import { useData, useLocale } from "../data"
import { useSettings } from "../settings"
import { usePathParams } from "../util"
import styles from "./Header.module.css"

export const Header: Component = () => {
    const [, setSettings] = useSettings()
    const params = usePathParams()
    const location = useLocation()
    const data = useData()
    const locale = useLocale()

    const otherLangHref = createMemo(() => {
        const { lang, year } = params
        const otherLang = lang === "tc" ? "en" : "tc"
        return `/${otherLang}/${year}${location.search}`
    })

    return (
        <div class={styles.header}>
            <div class={styles.title}>
                {locale().UI.Title}&nbsp;({data().year})
            </div>
            <a
                href="https://github.com/KithLo/jupas-data/blob/main/README.md"
                target="_blank"
                class={styles.icon}
            >
                <IoLogoGithub />
            </a>
            <A href={otherLangHref()} replace class={styles.icon}>
                <IoLanguage />
            </A>
            <div
                class={styles.icon}
                onClick={() => setSettings("darkMode", not)}
            >
                <IoContrast />
            </div>
        </div>
    )
}
