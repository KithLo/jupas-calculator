import { autoUpdate, computePosition, flip, shift } from "@floating-ui/dom"
import { useParams } from "@solidjs/router"
import { clamp } from "rambda"
import { createEffect, onCleanup } from "solid-js"

export function memoize<T extends (arg: any) => any>(func: T): T {
    const cache = new Map()

    const fn: any = (arg: any): any => {
        if (cache.has(arg)) {
            return cache.get(arg)
        } else {
            const result = func(arg)
            cache.set(arg, result)
            return result
        }
    }

    return fn
}

export function usePathParams(): { lang: string; year: string } {
    const params = useParams<{ year: string; lang: string }>()
    return params
}

export function useClickAway(
    elem: () => Node | null | undefined | (Node | null | undefined)[],
    callback: () => void,
    disable?: () => boolean,
) {
    createEffect(() => {
        if (disable?.()) return
        const handler = (ev: MouseEvent) => {
            const target = ev.target as Node
            const _elem = elem()
            if (
                Array.isArray(_elem)
                    ? _elem.every((el) => el && !el.contains(target))
                    : _elem && !_elem.contains(ev.target as Node)
            ) {
                callback()
            }
        }
        document.body.addEventListener("click", handler)
        onCleanup(() => document.body.removeEventListener("click", handler))
    })
}

export function usePopup(
    root: () => HTMLElement | SVGElement,
    popup: () => HTMLElement,
    active: () => boolean,
    options?: {
        placement?: "top" | "bottom"
        before?: () => void
        after?: () => void
    },
) {
    createEffect(() => {
        if (active()) {
            popup().style.display = ""

            const update = () => {
                options?.before?.()
                computePosition(root(), popup(), {
                    strategy: "fixed",
                    placement: options?.placement || "bottom",
                    middleware: [
                        flip({
                            fallbackPlacements: [
                                options?.placement === "top" ? "bottom" : "top",
                                "right-start",
                                "left-start",
                            ],
                        }),
                        shift({ padding: 20 }),
                    ],
                }).then(({ x, y }) => {
                    popup().style.left = x + "px"
                    popup().style.top = y + "px"
                    options?.after?.()
                })
            }

            update()

            const cleanup = autoUpdate(root(), popup(), update)
            onCleanup(cleanup)
        } else {
            popup().style.display = "none"
        }
    })
}

export function round(num: number, precision: number = 1): string {
    return num.toLocaleString(undefined, { maximumFractionDigits: precision })
}

export const getStatColor = (delta: number, darkMode: boolean) => {
    return `hsl(${clamp(-10, 10, delta) * -6 + 60} 100 ${darkMode ? 30 : 60})`
}
