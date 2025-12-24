import { createSignal } from "solid-js";
import { escapeMeCardValue } from "../../../utils";
import type { BarcodeInputProps } from "..";

export default function InputWiFiConfig({ updateText }: BarcodeInputProps) {
    const [authenticationType, setAuthenticationType] = createSignal<string>("WPA");
    let ssidRef: HTMLInputElement | undefined;
    let ssidHiddenRef: HTMLInputElement | undefined;
    let eapMethodRef: HTMLInputElement | undefined;
    let anonymousIdentityRef: HTMLInputElement | undefined;
    let phase2MethodRef: HTMLInputElement | undefined;
    let identityRef: HTMLInputElement | undefined;
    let passwordRef: HTMLInputElement | undefined;

    function onInputChange(type?: string) {
        if (!type) {
            type = authenticationType();
        }

        if (ssidRef?.value) {
            let output = `WIFI:T:${type};S:${escapeMeCardValue(ssidRef.value)};`;

            if (ssidHiddenRef?.checked) {
                output += "H:true;";
            }

            if (type === "WPA2-EAP" && eapMethodRef && anonymousIdentityRef && phase2MethodRef && identityRef) {
                output += `E:${escapeMeCardValue(eapMethodRef.value)};`;
                output += `A:${escapeMeCardValue(anonymousIdentityRef.value)};`;
                output += `PH2:${escapeMeCardValue(phase2MethodRef.value)};`;
                output += `I:${escapeMeCardValue(identityRef.value)};`;
            }

            if (type !== "nopass" && passwordRef) {
                output += `P:${escapeMeCardValue(passwordRef.value)};`;
            }

            output += ";";

            updateText(output);
        }
    };

    return (
        <>
            <div>
                <label class="form-label" for="barcode-wifi-authentication-type">Authentication Type:</label>
                <select
                    class="form-select"
                    id="barcode-wifi-authentication-type"
                    value={authenticationType()}
                    onChange={(e) => {
                        setAuthenticationType(e.currentTarget.value);
                        onInputChange(e.currentTarget.value);
                    }}
                >
                    <option value="WEP">WEP</option>
                    <option value="WPA">WPA/WPA2/WPA3</option>
                    <option value="WPA2-EAP">WPA2-EAP</option>
                    <option value="nopass">No password</option>
                </select>
            </div>
            <div class="mt-1">
                <label class="form-label" for="barcode-wifi-ssid">SSID:</label>
                <input class="form-control" id="barcode-wifi-ssid" type="text" maxLength={32} onChange={() => { onInputChange(); }} ref={ssidRef} />
            </div>
            <div class="form-check mt-1">
                <input class="form-check-input" id="barcode-wifi-hidden" type="checkbox" onChange={() => { onInputChange(); }} ref={ssidHiddenRef} />
                <label class="form-check-label" for="barcode-wifi-hidden">Hidden</label>
            </div>
            {
                authenticationType() === "WPA2-EAP" && (
                    <>
                        <div class="mt-1">
                            <label class="form-label" for="barcode-wifi-eap-method">EAP method:</label>
                            <input class="form-control" id="barcode-wifi-eap-method" value="TTLS" onChange={() => { onInputChange(); }} ref={eapMethodRef} />
                        </div>
                        <div class="mt-1">
                            <label class="form-label" for="barcode-wifi-anon-identity">Anonymous identity:</label>
                            <input class="form-control" id="barcode-wifi-anon-identity" type="text" onChange={() => { onInputChange(); }} ref={anonymousIdentityRef} />
                        </div>
                        <div class="mt-1">
                            <label class="form-label" for="barcode-wifi-phase2-method">Phase 2 method:</label>
                            <input class="form-control" id="barcode-wifi-phase2-method" type="text" value="MSCHAPV2" onChange={() => { onInputChange(); }} ref={phase2MethodRef} />
                        </div>
                        <div class="mt-1">
                            <label class="form-label" for="barcode-wifi-identity">Identity (username):</label>
                            <input class="form-control" id="barcode-wifi-identity" type="text" onChange={() => { onInputChange(); }} ref={identityRef} />
                        </div>
                    </>
                )
            }
            {
                authenticationType() !== "nopass" && (
                    <div class="mt-1">
                        <label class="form-label" for="barcode-wifi-password">Password:</label>
                        <input class="form-control" id="barcode-wifi-password" type="password" maxLength={63} onChange={() => { onInputChange(); }} ref={passwordRef} />
                    </div>
                )
            }
        </>
    );
}
