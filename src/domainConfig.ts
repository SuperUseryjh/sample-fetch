import { DomainConfig } from './types';

export const domainConfigs: { [key: string]: DomainConfig } = {
    'luogu.com.cn': {
        ojName: 'Luogu',
        codeSelectors: ['pre.lfe-code'],
        problemNameSelector: 'h1.lfe-h1',
        extractLuoguLimits: () => {
            let timeLimit = 1000; // Default
            let memoryLimit = 512; // Default

            const fields = document.querySelectorAll('div.stat.stacked.with-vr.color-inv > div.field');
            fields.forEach(field => {
                const nameElement = field.querySelector('span.stat-text.name');
                const valueElement = field.querySelector('span.stat-text.value');

                if (nameElement && valueElement) {
                    const name = nameElement.textContent!.trim();
                    const value = valueElement.textContent!.trim();

                    if (name === '时间限制') {
                        const match = value.match(/(\d+\.?\d*)\s*(s|ms)/i);
                        if (match) {
                            const num = parseFloat(match[1]);
                            if (match[2].toLowerCase() === 's') {
                                timeLimit = num * 1000;
                            } else {
                                timeLimit = num;
                            }
                        }
                    } else if (name === '内存限制') {
                        const match = value.match(/(\d+\.?\d*)\s*(mb|gb)/i);
                        if (match) {
                            const num = parseFloat(match[1]);
                            if (match[2].toLowerCase() === 'gb') {
                                memoryLimit = num * 1024;
                            } else {
                                memoryLimit = num;
                            }
                        }
                    }
                }
            });
            return { timeLimit, memoryLimit };
        },
        buttonStateKey: 'luoguButtonState'
    },
    'www.luogu.com.cn': {
        ojName: 'Luogu',
        codeSelectors: ['pre.lfe-code'],
        problemNameSelector: 'h1.lfe-h1',
        extractLuoguLimits: () => {
            let timeLimit = 1000; // Default
            let memoryLimit = 512; // Default

            const fields = document.querySelectorAll('div.stat.stacked.with-vr.color-inv > div.field');
            fields.forEach(field => {
                const nameElement = field.querySelector('span.stat-text.name');
                const valueElement = field.querySelector('span.stat-text.value');

                if (nameElement && valueElement) {
                    const name = nameElement.textContent!.trim();
                    const value = valueElement.textContent!.trim();

                    if (name === '时间限制') {
                        const match = value.match(/(\d+\.?\d*)\s*(s|ms)/i);
                        if (match) {
                            const num = parseFloat(match[1]);
                            if (match[2].toLowerCase() === 's') {
                                timeLimit = num * 1000;
                            } else {
                                timeLimit = num;
                            }
                        }
                    } else if (name === '内存限制') {
                        const match = value.match(/(\d+\.?\d*)\s*(mb|gb)/i);
                        if (match) {
                            const num = parseFloat(match[1]);
                            if (match[2].toLowerCase() === 'gb') {
                                memoryLimit = num * 1024;
                            } else {
                                memoryLimit = num;
                            }
                        }
                    }
                }
            });
            return { timeLimit, memoryLimit };
        },
        buttonStateKey: 'luoguButtonState'
    },
    'htoj.com.cn': {
        ojName: 'Hetao',
        codeSelectors: ['div.md-editor-code pre code span.md-editor-code-block'],
        problemNameSelector: 'h3.text-xl.font-bold.text-colorText',
        specialProblemNameExtraction: (element) => {
            const titleSpans = element.querySelectorAll('span');
            if (titleSpans.length >= 2) {
                const pid = titleSpans[0].textContent!.trim();
                const title = titleSpans[1].textContent!.trim();
                return `${pid} ${title}`.trim();
            } else if (titleSpans.length === 1) {
                return titleSpans[0].textContent!.trim();
            }
            return '';
        },
        timeLimitSelector: 'div.mt-3.inline-flex > div:nth-child(1) > div.mx-3 > div:nth-child(2)',
        memoryLimitSelector: 'div.mt-3.inline-flex > div:nth-child(2) > div.mx-3 > div:nth-child(2)',
        extractTimeAndMemoryLimits: () => {
            const timeLimitElement = document.querySelector(domainConfigs['htoj.com.cn'].timeLimitSelector!);
            const memoryLimitElement = document.querySelector(domainConfigs['htoj.com.cn'].memoryLimitSelector!); 
            const timeLimit = timeLimitElement ? parseInt(timeLimitElement.textContent!.trim()) : 1000; // 默认 1000ms
            const memoryLimit = memoryLimitElement ? parseInt(memoryLimitElement.textContent!.trim()) : 512; // 默认 512MB
            return { timeLimit, memoryLimit };
        },
        buttonStateKey: 'htojButtonState'
    },
    'atcoder.jp': {
        ojName: 'atcoder',
        codeSelectors: ['div[lang="en"] pre[id^="pre-sample"]'],
        problemNameSelector: 'span.h2',
        specialProblemNameExtraction: (element) => {
            const pathname = window.location.pathname;
            const tasksMatch = pathname.match(/\/tasks\/([^/]+)$/);
            if (tasksMatch && tasksMatch[1]) {
                return tasksMatch[1];
            }
            // Fallback to existing logic if not a /tasks/ URL
            const clonedTitle = element.cloneNode(true) as HTMLElement;
            const linkElement = clonedTitle.querySelector('a.btn');
            if (linkElement) {
                linkElement.remove();
            }
            return clonedTitle.textContent!.trim();
        },
        extractAtcoderLimits: () => {
            let timeLimit = 2000; // Default to 2 seconds (2000ms)
            let memoryLimit = 1024; // Default to 1024 MiB

            const pElement = document.querySelector('p'); // Assuming the limits are in a <p> tag
            if (pElement) {
                const text = pElement.textContent!;
                const timeMatch = text.match(/Time Limit:\s*(\d+\.?\d*)\s*(sec|ms)/i);
                if (timeMatch) {
                    const num = parseFloat(timeMatch[1]);
                    if (timeMatch[2].toLowerCase() === 'sec') {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }

                const memoryMatch = text.match(/Memory Limit:\s*(\d+\.?\d*)\s*(mib|mb|gb)/i);
                if (memoryMatch) {
                    const num = parseFloat(memoryMatch[1]);
                    if (memoryMatch[2].toLowerCase() === 'gb') {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }
            return { timeLimit, memoryLimit };
        },
        buttonStateKey: 'atcoderButtonState'
    },
    'codeforces.com': {
        ojName: 'codeforces',
        codeSelectors: ['div.input pre', 'div.output pre'],
        codeforcesLineExtractor: (element) => {
            const lines = Array.from(element.querySelectorAll('div.test-example-line')).map(line => line.textContent);
            return lines.join('\n').trim();
        },
        problemNameSelector: 'div.title',
        specialProblemNameExtraction: (element) => {
            const pathname = window.location.pathname;
            const problemMatch = pathname.match(/\/problemset\/problem\/(\d+)\/([A-Z])$/);
            if (problemMatch && problemMatch[1] && problemMatch[2]) {
                const contestId = problemMatch[1];
                const problemLetter = problemMatch[2].toLowerCase();
                return `cf${contestId}_${problemLetter}`;
            }
            // Fallback to existing logic if not a /problemset/problem/ URL
            return element.textContent!.trim();
        },
        extractCodeforcesLimits: () => {
            let timeLimit = 2000; // 默认 2 秒 (2000ms)
            let memoryLimit = 256; // 默认 256 MB

            const timeLimitElement = document.querySelector('div.time-limit');
            if (timeLimitElement) {
                const text = timeLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(seconds|second|sec|ms)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase().startsWith('sec')) {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }
            }

            const memoryLimitElement = document.querySelector('div.memory-limit');
            if (memoryLimitElement) {
                const text = memoryLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(megabytes|megabyte|mb|gb)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase().startsWith('gb')) {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }
            return { timeLimit, memoryLimit };
        },
        buttonStateKey: 'codeforcesButtonState'
    }
};