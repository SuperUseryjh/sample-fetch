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

export interface DomainConfig {
    ojName: string;
    codeSelectors: string[];
    problemNameSelector: string;
    specialProblemNameExtraction?: (element: HTMLElement) => string;
    extractLuoguLimits?: () => { timeLimit: number; memoryLimit: number; };
    extractTimeAndMemoryLimits?: () => { timeLimit: number; memoryLimit: number; };
    extractAtcoderLimits?: () => { timeLimit: number; memoryLimit: number; };
    codeforcesLineExtractor?: (element: HTMLElement) => string;
    extractCodeforcesLimits?: () => { timeLimit: number; memoryLimit: number; };
    timeLimitSelector?: string;
    memoryLimitSelector?: string;
    buttonStateKey: string;
    initialStatusMessage?: string;
}

export interface GuideStep {
    selector: string;
    title: string;
    description: string;
}

// Tampermonkey 的 GM_xmlhttpRequest 类型声明
declare global {
    interface Window {
        GM_xmlhttpRequest: (details: GM_xmlhttpRequestDetails) => void;
    }
}

export interface GM_xmlhttpRequestDetails {
    method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD";
    url: string;
    headers?: { [key: string]: string };
    data?: string;
    onload?: (response: GM_xmlhttpRequestResponse) => void;
    onerror?: (error: GM_xmlhttpRequestResponse) => void;
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
