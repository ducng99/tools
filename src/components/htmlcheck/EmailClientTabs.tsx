import { For } from "solid-js";
import type { ClientTarget } from "./emailPreview/deriveClientTargets";

interface EmailClientTabsProps {
    targets: Array<ClientTarget>;
    activeKey: string;
    onSelect: (key: string) => void;
}

export default function EmailClientTabs(props: EmailClientTabsProps) {
    return (
        <ul class="nav nav-tabs flex-nowrap overflow-x-auto text-nowrap">
            <For each={props.targets}>
                {target => (
                    <li class="nav-item">
                        <button
                            type="button"
                            class="nav-link"
                            classList={{ active: props.activeKey === target.key }}
                            onClick={() => props.onSelect(target.key)}
                        >
                            {target.label}
                        </button>
                    </li>
                )}
            </For>
        </ul>
    );
}
