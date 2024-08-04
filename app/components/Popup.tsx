import { ParentComponent } from "solid-js"
import { Portal } from "solid-js/web"

export const Popup: ParentComponent = (props) => {
    return (
        <Portal mount={document.getElementById("portal")!}>
            {props.children}
        </Portal>
    )
}
