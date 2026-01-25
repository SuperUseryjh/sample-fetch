export interface Sample {
    id: number;
    input: string;
    output: string;
    timeLimit: number;
    memoryLimit: number;
}

export interface Payload {
    OJ: string;
    problemName: string;
    samples: Sample[];
}

export interface ExtractResult {
    samples: Sample[];
    timeLimit: number;
    memoryLimit: number;
}

export type ExtractFunction = () => ExtractResult;

export interface DomainConfig {
    ojName: string;
    codeSelectors: string[];
    problemNameSelector: string;
    specialProblemNameExtraction?: (element: HTMLElement) => string;
    codeforcesLineExtractor?: (element: HTMLElement) => string;
    timeLimitSelector?: string;
    memoryLimitSelector?: string;
    buttonStateKey: string;
    initialStatusMessage?: string;
    extract: ExtractFunction;
}

export interface GuideStep {
    selector: string;
    title: string;
    description: string;
}

// Tampermonkey 的全局函数和变量类型声明
declare global {
    interface Window {
        GM_xmlhttpRequest: (details: GM_xmlhttpRequestDetails) => void;
        GM_openInTab: (url: string, open_in_background?: boolean) => Window | null;
        GM_info: GM_info_interface;
    GM_setValue: (name: string, value: any) => Promise<void>;
        GM_getValue: (name: string, defaultValue?: any) => Promise<any>;
    }
}

export interface GM_xmlhttpRequestDetails {
    method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
    url: string;
    headers?: { [key: string]: string };
    data?: string;
    onload?: (response: GM_xmlhttpRequestResponse) => void;
    onerror?: (response: GM_xmlhttpRequestResponse) => void; // 确保 onerror 的 response 类型正确
    onabort?: () => void;
    ontimeout?: () => void;
}

export interface GM_xmlhttpRequestResponse {
    status: number;
    statusText: string;
    responseText: string;
    responseHeaders: string;
    finalUrl: string;
    readyState: number;
    response: any;
    type: "load" | "error" | "abort" | "timeout";
}

export interface GM_info_interface {
    script: {
        name: string;
        namespace: string;
        version: string;
        description: string;
        author: string;
        homepage?: string;
        homepageURL?: string;
        website?: string;
        source?: string;
        icon?: string;
        icon64?: string;
        defaulticon?: string;
        "run-at"?: string;
        match?: string[];
        exclude?: string[];
        include?: string[];
        require?: string[];
        resource?: { [key: string]: string };
        grant?: string[];
        connect?: string[];
        noframes?: boolean;
        unwrap?: boolean;
        nocompat?: boolean;
        downloadURL?: string;
        updateURL?: string;
        supportURL?: string;
    };
    scriptMetaStr: string;
    scriptWillUpdate: boolean;
    version: string;
    injectInto: string;
    platform: {
        arch: string;
        os: string;
        noFrames: boolean;
        tlsMin: number;
        tlsMax: number;
    };
    browser: {
        name: string;
        version: string;
    };
}
