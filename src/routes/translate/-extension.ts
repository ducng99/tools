// Language list sourced from the standalone TranslateGemma webapp.
// Each group maps a human-readable language name to the BCP-47 codes accepted by the model.
// Flatten, then sort by display name, breaking ties on the code itself.
export const LANGUAGE_GROUPS: Record<string, ReadonlyArray<string>> = {
    "Afar": ["aa", "aa-DJ", "aa-ER"],
    "Abkhazian": ["ab"],
    "Afrikaans": ["af", "af-NA"],
    "Akan": ["ak"],
    "Amharic": ["am"],
    "Aragonese": ["an"],
    "Arabic": ["ar", "ar-AE", "ar-BH", "ar-DJ", "ar-DZ", "ar-EG", "ar-EH", "ar-ER", "ar-IL", "ar-IQ", "ar-JO", "ar-KM", "ar-KW", "ar-LB", "ar-LY", "ar-MA", "ar-MR", "ar-OM", "ar-PS", "ar-QA", "ar-SA", "ar-SD", "ar-SO", "ar-SS", "ar-SY", "ar-TD", "ar-TN", "ar-YE"],
    "Assamese": ["as"],
    "Azerbaijani": ["az", "az-Arab", "az-Arab-IQ", "az-Arab-TR", "az-Cyrl", "az-Latn"],
    "Bashkir": ["ba"],
    "Belarusian": ["be", "be-tarask"],
    "Bulgarian": ["bg", "bg-BG"],
    "Bambara": ["bm", "bm-Nkoo"],
    "Bengali": ["bn", "bn-IN"],
    "Tibetan": ["bo", "bo-IN"],
    "Breton": ["br"],
    "Bosnian": ["bs", "bs-Cyrl", "bs-Latn"],
    "Catalan": ["ca", "ca-AD", "ca-ES", "ca-FR", "ca-IT"],
    "Chechen": ["ce"],
    "Corsican": ["co"],
    "Czech": ["cs", "cs-CZ"],
    "Chuvash": ["cv"],
    "Welsh": ["cy"],
    "Danish": ["da", "da-DK", "da-GL"],
    "German": ["de", "de-AT", "de-BE", "de-CH", "de-DE", "de-IT", "de-LI", "de-LU"],
    "Divehi": ["dv"],
    "Dzongkha": ["dz"],
    "Ewe": ["ee", "ee-TG"],
    "Greek": ["el", "el-CY", "el-GR", "el-polyton"],
    "English": ["en", "en-AE", "en-AG", "en-AI", "en-AS", "en-AT", "en-AU", "en-BB", "en-BE", "en-BI", "en-BM", "en-BS", "en-BW", "en-BZ", "en-CA", "en-CC", "en-CH", "en-CK", "en-CM", "en-CX", "en-CY", "en-CZ", "en-DE", "en-DG", "en-DK", "en-DM", "en-ER", "en-ES", "en-FI", "en-FJ", "en-FK", "en-FM", "en-FR", "en-GB", "en-GD", "en-GG", "en-GH", "en-GI", "en-GM", "en-GS", "en-GU", "en-GY", "en-HK", "en-HU", "en-ID", "en-IE", "en-IL", "en-IM", "en-IN", "en-IO", "en-IT", "en-JE", "en-JM", "en-KE", "en-KI", "en-KN", "en-KY", "en-LC", "en-LR", "en-LS", "en-MG", "en-MH", "en-MO", "en-MP", "en-MS", "en-MT", "en-MU", "en-MV", "en-MW", "en-MY", "en-NA", "en-NF", "en-NG", "en-NL", "en-NO", "en-NR", "en-NU", "en-NZ", "en-PG", "en-PH", "en-PK", "en-PL", "en-PN", "en-PR", "en-PT", "en-PW", "en-RO", "en-RW", "en-SB", "en-SC", "en-SD", "en-SE", "en-SG", "en-SH", "en-SI", "en-SK", "en-SL", "en-SS", "en-SX", "en-SZ", "en-TC", "en-TK", "en-TO", "en-TT", "en-TV", "en-TZ", "en-UG", "en-UM", "en-VC", "en-VG", "en-VI", "en-VU", "en-WS", "en-ZA", "en-ZM", "en-ZW"],
    "Esperanto": ["eo"],
    "Spanish": ["es", "es-AR", "es-BO", "es-BR", "es-BZ", "es-CL", "es-CO", "es-CR", "es-CU", "es-DO", "es-EA", "es-EC", "es-ES", "es-GQ", "es-GT", "es-HN", "es-IC", "es-MX", "es-NI", "es-PA", "es-PE", "es-PH", "es-PR", "es-PY", "es-SV", "es-US", "es-UY", "es-VE"],
    "Estonian": ["et", "et-EE"],
    "Basque": ["eu"],
    "Persian": ["fa", "fa-AF", "fa-IR"],
    "Fulah": ["ff", "ff-Adlm", "ff-Adlm-BF", "ff-Adlm-CM", "ff-Adlm-GH", "ff-Adlm-GM", "ff-Adlm-GW", "ff-Adlm-LR", "ff-Adlm-MR", "ff-Adlm-NE", "ff-Adlm-NG", "ff-Adlm-SL", "ff-Adlm-SN", "ff-Latn", "ff-Latn-BF", "ff-Latn-CM", "ff-Latn-GH", "ff-Latn-GM", "ff-Latn-GN", "ff-Latn-GW", "ff-Latn-LR", "ff-Latn-MR", "ff-Latn-NE", "ff-Latn-NG", "ff-Latn-SL"],
    "Finnish": ["fi", "fi-FI"],
    "Filipino": ["fil-PH"],
    "Faroese": ["fo", "fo-DK"],
    "French": ["fr", "fr-BE", "fr-BF", "fr-BI", "fr-BJ", "fr-BL", "fr-CA", "fr-CD", "fr-CF", "fr-CG", "fr-CH", "fr-CI", "fr-CM", "fr-DJ", "fr-DZ", "fr-FR", "fr-GA", "fr-GF", "fr-GN", "fr-GP", "fr-GQ", "fr-HT", "fr-KM", "fr-LU", "fr-MA", "fr-MC", "fr-MF", "fr-MG", "fr-ML", "fr-MQ", "fr-MR", "fr-MU", "fr-NC", "fr-NE", "fr-PF", "fr-PM", "fr-RE", "fr-RW", "fr-SC", "fr-SN", "fr-SY", "fr-TD", "fr-TG", "fr-TN", "fr-VU", "fr-WF", "fr-YT"],
    "Western Frisian": ["fy"],
    "Irish": ["ga", "ga-GB"],
    "Scottish Gaelic": ["gd"],
    "Galician": ["gl"],
    "Guarani": ["gn"],
    "Gujarati": ["gu", "gu-IN"],
    "Manx": ["gv"],
    "Hausa": ["ha", "ha-Arab", "ha-Arab-SD", "ha-GH", "ha-NE"],
    "Hebrew": ["he", "he-IL"],
    "Hindi": ["hi", "hi-IN", "hi-Latn"],
    "Croatian": ["hr", "hr-BA", "hr-HR"],
    "Haitian": ["ht"],
    "Hungarian": ["hu", "hu-HU"],
    "Armenian": ["hy"],
    "Interlingua": ["ia"],
    "Indonesian": ["id", "id-ID"],
    "Interlingue": ["ie"],
    "Igbo": ["ig"],
    "Sichuan Yi": ["ii"],
    "Inupiaq": ["ik"],
    "Ido": ["io"],
    "Icelandic": ["is"],
    "Italian": ["it", "it-CH", "it-IT", "it-SM", "it-VA"],
    "Inuktitut": ["iu", "iu-Latn"],
    "Japanese": ["ja", "ja-JP"],
    "Javanese": ["jv"],
    "Georgian": ["ka"],
    "Kikuyu": ["ki"],
    "Kazakh": ["kk", "kk-Arab", "kk-Cyrl", "kk-KZ"],
    "Kalaallisut": ["kl"],
    "Central Khmer": ["km"],
    "Kannada": ["kn", "kn-IN"],
    "Korean": ["ko", "ko-CN", "ko-KP", "ko-KR"],
    "Kashmiri": ["ks", "ks-Arab", "ks-Deva"],
    "Kurdish": ["ku"],
    "Cornish": ["kw"],
    "Kyrgyz": ["ky"],
    "Latin": ["la"],
    "Luxembourgish": ["lb"],
    "Ganda": ["lg"],
    "Lingala": ["ln", "ln-AO", "ln-CF", "ln-CG"],
    "Lao": ["lo"],
    "Lithuanian": ["lt", "lt-LT"],
    "Luba-Katanga": ["lu"],
    "Latvian": ["lv", "lv-LV"],
    "Malagasy": ["mg"],
    "Maori": ["mi"],
    "Macedonian": ["mk"],
    "Malayalam": ["ml", "ml-IN"],
    "Mongolian": ["mn", "mn-Mong", "mn-Mong-MN"],
    "Marathi": ["mr", "mr-IN"],
    "Malay": ["ms", "ms-Arab", "ms-Arab-BN", "ms-BN", "ms-ID", "ms-SG"],
    "Maltese": ["mt"],
    "Burmese": ["my"],
    "Norwegian Bokmal": ["nb", "nb-SJ"],
    "North Ndebele": ["nd"],
    "Nepali": ["ne", "ne-IN"],
    "Dutch": ["nl", "nl-AW", "nl-BE", "nl-BQ", "nl-CW", "nl-NL", "nl-SR", "nl-SX"],
    "Norwegian Nynorsk": ["nn"],
    "Norwegian": ["no", "no-NO"],
    "South Ndebele": ["nr"],
    "Navajo": ["nv"],
    "Chichewa": ["ny"],
    "Occitan": ["oc", "oc-ES"],
    "Oromo": ["om", "om-KE"],
    "Oriya": ["or"],
    "Ossetian": ["os", "os-RU"],
    "Punjabi": ["pa", "pa-IN", "pa-Arab", "pa-Guru"],
    "Polish": ["pl", "pl-PL"],
    "Pashto": ["ps", "ps-PK"],
    "Portuguese": ["pt", "pt-AO", "pt-BR", "pt-CH", "pt-CV", "pt-GQ", "pt-GW", "pt-LU", "pt-MO", "pt-MZ", "pt-PT", "pt-ST", "pt-TL"],
    "Quechua": ["qu", "qu-BO", "qu-EC"],
    "Romansh": ["rm"],
    "Rundi": ["rn"],
    "Romanian": ["ro", "ro-MD", "ro-RO"],
    "Russian": ["ru", "ru-BY", "ru-KG", "ru-KZ", "ru-MD", "ru-RU", "ru-UA"],
    "Kinyarwanda": ["rw"],
    "Sanskrit": ["sa"],
    "Sardinian": ["sc"],
    "Sindhi": ["sd", "sd-Arab", "sd-Deva"],
    "Northern Sami": ["se", "se-FI", "se-SE"],
    "Sango": ["sg"],
    "Sinhala": ["si"],
    "Slovak": ["sk", "sk-SK"],
    "Slovenian": ["sl", "sl-SI"],
    "Shona": ["sn"],
    "Somali": ["so", "so-DJ", "so-ET", "so-KE"],
    "Albanian": ["sq", "sq-MK", "sq-XK"],
    "Serbian": ["sr", "sr-RS", "sr-Cyrl", "sr-Cyrl-BA", "sr-Cyrl-ME", "sr-Cyrl-XK", "sr-Latn", "sr-Latn-BA", "sr-Latn-ME", "sr-Latn-XK"],
    "Swati": ["ss", "ss-SZ"],
    "Southern Sotho": ["st", "st-LS"],
    "Sundanese": ["su", "su-Latn"],
    "Swedish": ["sv", "sv-AX", "sv-FI", "sv-SE"],
    "Swahili": ["sw", "sw-CD", "sw-KE", "sw-TZ", "sw-UG"],
    "Tamil": ["ta", "ta-IN", "ta-LK", "ta-MY", "ta-SG"],
    "Telugu": ["te", "te-IN"],
    "Tajik": ["tg"],
    "Thai": ["th", "th-TH"],
    "Tigrinya": ["ti", "ti-ER"],
    "Turkmen": ["tk"],
    "Tagalog": ["tl"],
    "Tswana": ["tn", "tn-BW"],
    "Tonga": ["to"],
    "Turkish": ["tr", "tr-CY", "tr-TR"],
    "Tsonga": ["ts"],
    "Tatar": ["tt"],
    "Uyghur": ["ug"],
    "Ukrainian": ["uk", "uk-UA"],
    "Urdu": ["ur", "ur-IN", "ur-PK"],
    "Uzbek": ["uz", "uz-Arab", "uz-Cyrl", "uz-Latn"],
    "Venda": ["ve"],
    "Vietnamese": ["vi", "vi-VN"],
    "Volapuk": ["vo"],
    "Walloon": ["wa"],
    "Wolof": ["wo"],
    "Xhosa": ["xh"],
    "Yiddish": ["yi"],
    "Yoruba": ["yo", "yo-BJ"],
    "Zhuang": ["za"],
    "Chinese": ["zh", "zh-CH", "zh-TW", "zh-Hans", "zh-Hans-HK", "zh-Hans-MO", "zh-Hans-MY", "zh-Hans-SG", "zh-Hant", "zh-Hant-HK", "zh-Hant-MO", "zh-Hant-MY", "zh-Latn"],
    "Zulu": ["zu", "zu-ZA"],
};

export interface LanguageEntry {
    code: string;
    name: string;
}

export const LANGUAGES: ReadonlyArray<LanguageEntry> = Object.entries(LANGUAGE_GROUPS)
    .flatMap(([name, codes]) => codes.map(code => ({ code, name })))
    .sort((a, b) => a.name.localeCompare(b.name) || a.code.localeCompare(b.code));

export const LANGUAGE_CODES: ReadonlySet<string> = new Set(LANGUAGES.map(language => language.code));

export const DEFAULT_API_BASE = "http://localhost:8000/v1";
export const DEFAULT_MODEL = "translategemma";
export const DEFAULT_SOURCE_LANG = "en";
export const DEFAULT_TARGET_LANG = "zh-Hans";
export const DEFAULT_MAX_TOKENS = 512;
export const MAX_TOKENS_LIMIT = 2048;

export interface TranslateOptions {
    apiBase: string;
    model: string;
    maxTokens: number;
    sourceLang: string;
    targetLang: string;
}

export function clampNumber(value: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(value)));
}

export type InputMode = "text" | "image";

export interface TextContentPart {
    type: "text";
    source_lang_code: string;
    target_lang_code: string;
    text: string;
}

export interface ImageContentPart {
    type: "image";
    source_lang_code: string;
    target_lang_code: string;
    url: string;
}

export type ChatMessageContentPart = TextContentPart | ImageContentPart;

export interface ChatRequestBody {
    model: string;
    messages: Array<{ role: "user"; content: ChatMessageContentPart[] }>;
    stream: true;
    temperature: number;
    max_tokens: number;
}

export interface TranslateRequestInput {
    mode: InputMode;
    text: string;
    imageUrl: string;
    uploadedImageDataUrl: string;
}

export function buildChatRequest(options: TranslateOptions, input: TranslateRequestInput): ChatRequestBody {
    let content: ChatMessageContentPart;
    if (input.mode === "text") {
        content = {
            type: "text",
            source_lang_code: options.sourceLang,
            target_lang_code: options.targetLang,
            text: input.text,
        };
    }
    else {
        content = {
            type: "image",
            source_lang_code: options.sourceLang,
            target_lang_code: options.targetLang,
            url: input.imageUrl || input.uploadedImageDataUrl,
        };
    }

    return {
        model: options.model.trim() || DEFAULT_MODEL,
        messages: [
            {
                role: "user",
                content: [content],
            },
        ],
        stream: true,
        temperature: 0,
        max_tokens: clampNumber(options.maxTokens, 1, MAX_TOKENS_LIMIT, DEFAULT_MAX_TOKENS),
    };
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
