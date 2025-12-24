import { useRef, useState } from 'react';
import { type BarcodeInputProps } from '..';
import { escapeMeCardValue } from '../../../utils';

export default function InputWiFiConfig({ updateText }: BarcodeInputProps) {
    const [authenticationType, setAuthenticationType] = useState<string>('WPA');
    const ssidRef = useRef<HTMLInputElement>(null);
    const ssidHiddenRef = useRef<HTMLInputElement>(null);
    const eapMethodRef = useRef<HTMLInputElement>(null);
    const anonymousIdentityRef = useRef<HTMLInputElement>(null);
    const phase2MethodRef = useRef<HTMLInputElement>(null);
    const identityRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    function onInputChange(type?: string) {
        if (!type) {
            type = authenticationType;
        }

        if (ssidRef.current?.value) {
            let output = `WIFI:T:${type};S:${escapeMeCardValue(ssidRef.current.value)};`;

            if (ssidHiddenRef.current?.checked) {
                output += 'H:true;';
            }

            if (type === 'WPA2-EAP' && eapMethodRef.current && anonymousIdentityRef.current && phase2MethodRef.current && identityRef.current) {
                output += `E:${escapeMeCardValue(eapMethodRef.current.value)};`;
                output += `A:${escapeMeCardValue(anonymousIdentityRef.current.value)};`;
                output += `PH2:${escapeMeCardValue(phase2MethodRef.current.value)};`;
                output += `I:${escapeMeCardValue(identityRef.current.value)};`;
            }

            if (type !== 'nopass' && passwordRef.current) {
                output += `P:${escapeMeCardValue(passwordRef.current.value)};`;
            }

            output += ';';

            updateText(output);
        }
    };

    return (
        <>
            <div>
                <label class="form-label" for="barcode-wifi-authentication-type">Authentication Type:</label>
                <select class="form-select" id="barcode-wifi-authentication-type" defaultValue={authenticationType} onChange={(e) => { setAuthenticationType(e.currentTarget.value); onInputChange(e.currentTarget.value); }}>
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
                authenticationType === 'WPA2-EAP' &&
                <>
                    <div class="mt-1">
                        <label class="form-label" for="barcode-wifi-eap-method">EAP method:</label>
                        <input class="form-control" id="barcode-wifi-eap-method" defaultValue="TTLS" onChange={() => { onInputChange(); }} ref={eapMethodRef} />
                    </div>
                    <div class="mt-1">
                        <label class="form-label" for="barcode-wifi-anon-identity">Anonymous identity:</label>
                        <input class="form-control" id="barcode-wifi-anon-identity" type="text" onChange={() => { onInputChange(); }} ref={anonymousIdentityRef} />
                    </div>
                    <div class="mt-1">
                        <label class="form-label" for="barcode-wifi-phase2-method">Phase 2 method:</label>
                        <input class="form-control" id="barcode-wifi-phase2-method" type="text" defaultValue="MSCHAPV2" onChange={() => { onInputChange(); }} ref={phase2MethodRef} />
                    </div>
                    <div class="mt-1">
                        <label class="form-label" for="barcode-wifi-identity">Identity (username):</label>
                        <input class="form-control" id="barcode-wifi-identity" type="text" onChange={() => { onInputChange(); }} ref={identityRef} />
                    </div>
                </>
            }
            {
                authenticationType !== 'nopass' &&
                <div class="mt-1">
                    <label class="form-label" for="barcode-wifi-password">Password:</label>
                    <input class="form-control" id="barcode-wifi-password" type="password" maxLength={63} onChange={() => { onInputChange(); }} ref={passwordRef} />
                </div>
            }
        </>
    );
}
