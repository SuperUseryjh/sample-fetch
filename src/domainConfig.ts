import { DomainConfig } from './types';

export const domainConfigs: { [key: string]: DomainConfig } = {
    'luogu.com.cn': {
        ojName: 'Luogu',
        codeSelectors: ['pre.lfe-code'],
        problemNameSelector: 'h1.lfe-h1',
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('pre.lfe-code').forEach(element => {
                rawSnippets.push(element.textContent!);
            });

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

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'luoguButtonState'
    },
    'www.luogu.com.cn': {
        ojName: 'Luogu',
        codeSelectors: ['pre.lfe-code'],
        problemNameSelector: 'h1.lfe-h1',
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('pre.lfe-code').forEach(element => {
                rawSnippets.push(element.textContent!);
            });

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

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'luoguButtonState'
    },
    'htoj.com.cn': {
        ojName: 'Hetao',
        codeSelectors: ['div.md-editor-code pre code span.md-editor-code-block'],
        problemNameSelector: 'h1.text-xl.font-bold.text-colorText',
        specialProblemNameExtraction: (element) => {
            const titleSpans = element.querySelectorAll('span');
            let problemName = '';
            titleSpans.forEach(span => {
                problemName += span.textContent!.trim() + ' ';
            });
            return problemName.trim();
        },
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('div.md-editor-code pre code span.md-editor-code-block').forEach(element => {
                rawSnippets.push(element.textContent!.trim());
            });

            const timeLimitElement = document.querySelector('div.mt-3.inline-flex > div:nth-child(1) > div.mx-3 > div:nth-child(2)');
            const memoryLimitElement = document.querySelector('div.mt-3.inline-flex > div:nth-child(2) > div.mx-3 > div:nth-child(2)'); 
            const timeLimit = timeLimitElement ? parseInt(timeLimitElement.textContent!.trim()) : 1000; // 默认 1000ms
            const memoryLimit = memoryLimitElement ? parseInt(memoryLimitElement.textContent!.trim()) : 512; // 默认 512MB

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'htojButtonState'
    },
    'atcoder.jp': {
        ojName: 'atcoder',
        codeSelectors: ['pre[id^="pre-sample"]'],
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
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('pre[id^="pre-sample"]').forEach(element => {
                rawSnippets.push(element.textContent!.trim());
            });

            // 如果是 Atcoder 并且 rawSnippets 数量是偶数，只保留前半部分
            if (rawSnippets.length % 2 === 0 && rawSnippets.length > 0) {
                const halfLength = rawSnippets.length / 2;
                rawSnippets.splice(halfLength); // 移除后半部分
            }

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

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'atcoderButtonState'
    },
    'codeforces.com': {
        ojName: 'codeforces',
        codeSelectors: ['div.input pre', 'div.output pre'],
        problemNameSelector: 'div.title',
        extract: () => {
            const rawSnippets: string[] = [];
            const codeforcesLineExtractor = (element: HTMLElement): string => {
                const lineElements = element.querySelectorAll<HTMLDivElement>("div.test-example-line");
                const lines: string[] = Array.from(lineElements).map((line) => line.textContent || "");
                if (lines.length > 0) {
                    return lines.join("\n").trim();
                }
                const tempElement = element.cloneNode(true) as HTMLElement;
                const htmlContent: string = tempElement.innerHTML;
                const replacedHtml: string = htmlContent.replace(/<br\s*\/?>|<\/\s*br>/gi, "\n");
                tempElement.innerHTML = replacedHtml;
                return (tempElement.textContent || "").trim();
            };

            const inputSnippets: string[] = [];
            const outputSnippets: string[] = [];

            document.querySelectorAll('div.input pre').forEach(element => {
                inputSnippets.push(codeforcesLineExtractor(element as HTMLElement));
            });
            document.querySelectorAll('div.output pre').forEach(element => {
                outputSnippets.push(codeforcesLineExtractor(element as HTMLElement));
            });

            for (let i = 0; i < inputSnippets.length && i < outputSnippets.length; i++) {
                rawSnippets.push(inputSnippets[i]);
                rawSnippets.push(outputSnippets[i]);
            }

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

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'codeforcesButtonState'
    },
    'hydro.ac': {
        ojName: 'Hydro',
        codeSelectors: ['pre.syntax-hl code'],
        problemNameSelector: 'h1.section__title',
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('div.row > div.code-toolbar.medium-6.columns.sample').forEach(sampleDiv => {
                const inputCode = sampleDiv.querySelector('code[class^="language-input"]');
                const outputCode = sampleDiv.querySelector('code[class^="language-output"]');
                if (inputCode) {
                    rawSnippets.push(inputCode.textContent!.trim());
                }
                if (outputCode) {
                    rawSnippets.push(outputCode.textContent!.trim());
                }
            });

            let timeLimit = 1000; // Default
            let memoryLimit = 512; // Default

            const timeLimitElement = document.querySelector('span.problem__tag-item.icon.icon-stopwatch');
            if (timeLimitElement) {
                const text = timeLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(s|ms)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 's') {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }
            }

            const memoryLimitElement = document.querySelector('span.problem__tag-item.icon.icon-comparison');
            if (memoryLimitElement) {
                const text = memoryLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 'gb') {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'hydroButtonState'
    },
    'www.yanhaozhe.cn': {
        ojName: 'SYZOJ',
        codeSelectors: ['div.ui.existing.segment pre code'],
        problemNameSelector: 'h1.ui.header',
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('div.ui.existing.segment pre code').forEach(element => {
                rawSnippets.push(element.textContent!.trim());
            });

            let timeLimit = 1000; // Default
            let memoryLimit = 256; // Default

            const timeLimitElement = document.evaluate("//span[contains(text(), '时间限制：')]/text()", document, null, XPathResult.STRING_TYPE, null).stringValue;
            if (timeLimitElement) {
                const match = timeLimitElement.match(/(\d+\.?\d*)\s*(ms|s)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 's') {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }
            }

            const memoryLimitElement = document.evaluate("//span[contains(text(), '内存限制：')]/text()", document, null, XPathResult.STRING_TYPE, null).stringValue;
            if (memoryLimitElement) {
                const match = memoryLimitElement.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 'gb') {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'SYZOJButtonState'
    },
    'vjudge.net': {
        ojName: 'VJudge',
        codeSelectors: ['table.vjudge_sample tbody tr td pre'],
        problemNameSelector: '#problem-title',
        extract: () => {
            const samples: { id: number; input: string; output: string; timeLimit: number; memoryLimit: number }[] = [];
            
            // 尝试从 iframe 中获取样例
            const iframe = document.querySelector('iframe[src*="problem"]') as HTMLIFrameElement;
            let iframeDoc: Document | null = null;
            
            if (iframe && iframe.contentDocument) {
                iframeDoc = iframe.contentDocument;
                console.log('OICPP SampleTester: VJudge - 从 iframe 中提取样例');
            }
            
            const doc = iframeDoc || document;
            const rows = doc.querySelectorAll('table.vjudge_sample tbody tr');
            
            let sampleId = 1;
            rows.forEach(row => {
                const tds = row.querySelectorAll('td pre');
                if (tds.length >= 2) {
                    const inputContent = tds[0].textContent!.trim();
                    const outputContent = tds[1].textContent!.trim();
                    samples.push({
                        id: sampleId++,
                        input: inputContent,
                        output: outputContent,
                        timeLimit: 1000,
                        memoryLimit: 512
                    });
                }
            });

            let timeLimit = 1000;
            let memoryLimit = 512;

            const timeLimitElement = doc.querySelector('div[id^="time-limit-"]');
            if (timeLimitElement) {
                const text = timeLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(ms|s)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 's') {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }
            }

            const memoryLimitElement = doc.querySelector('div[id^="memory-limit-"]');
            if (memoryLimitElement) {
                const text = memoryLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 'gb') {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }

            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'vjudgeButtonState'
    },
    'www.vjudge.net': {
        ojName: 'VJudge',
        codeSelectors: ['table.vjudge_sample tbody tr td pre'],
        problemNameSelector: '#problem-title',
        extract: () => {
            const samples: { id: number; input: string; output: string; timeLimit: number; memoryLimit: number }[] = [];
            
            // 尝试从 iframe 中获取样例
            const iframe = document.querySelector('iframe[src*="problem"]') as HTMLIFrameElement;
            let iframeDoc: Document | null = null;
            
            if (iframe && iframe.contentDocument) {
                iframeDoc = iframe.contentDocument;
                console.log('OICPP SampleTester: VJudge - 从 iframe 中提取样例');
            }
            
            const doc = iframeDoc || document;
            const rows = doc.querySelectorAll('table.vjudge_sample tbody tr');
            
            let sampleId = 1;
            rows.forEach(row => {
                const tds = row.querySelectorAll('td pre');
                if (tds.length >= 2) {
                    const inputContent = tds[0].textContent!.trim();
                    const outputContent = tds[1].textContent!.trim();
                    samples.push({
                        id: sampleId++,
                        input: inputContent,
                        output: outputContent,
                        timeLimit: 1000,
                        memoryLimit: 512
                    });
                }
            });

            let timeLimit = 1000;
            let memoryLimit = 512;

            const timeLimitElement = doc.querySelector('div[id^="time-limit-"]');
            if (timeLimitElement) {
                const text = timeLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(ms|s)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 's') {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }
            }

            const memoryLimitElement = doc.querySelector('div[id^="memory-limit-"]');
            if (memoryLimitElement) {
                const text = memoryLimitElement.textContent!;
                const match = text.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 'gb') {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }

            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'vjudgeButtonState'
    },
    'marsoj.cn': {
        ojName: 'MarsOJ',
        codeSelectors: ['pre.syntax-hl'],
        problemNameSelector: 'h1.section__title',
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('div.row > div.code-toolbar.medium-6.columns.sample').forEach(sampleDiv => {
                const code = sampleDiv.querySelector('pre.syntax-hl');
                if (code) {
                    rawSnippets.push(code.textContent!.trim());
                }
            });

            let timeLimit = 1000;
            let memoryLimit = 256;

            const timeLimitElement = document.querySelector('span.problem__tag-item.bp3-icon-stopwatch');
            if (timeLimitElement) {
                const text = timeLimitElement.textContent!.trim();
                const match = text.match(/(\d+\.?\d*)\s*(ms|s)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 's') {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }
            }

            const memoryLimitElement = document.querySelector('span.problem__tag-item.bp3-icon-comparison');
            if (memoryLimitElement) {
                const text = memoryLimitElement.textContent!.trim();
                const match = text.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 'gb') {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'marsojButtonState'
    },
    'www.marsoj.cn': {
        ojName: 'MarsOJ',
        codeSelectors: ['pre.syntax-hl'],
        problemNameSelector: 'h1.section__title',
        extract: () => {
            const rawSnippets: string[] = [];
            document.querySelectorAll('div.row > div.code-toolbar.medium-6.columns.sample').forEach(sampleDiv => {
                const code = sampleDiv.querySelector('pre.syntax-hl');
                if (code) {
                    rawSnippets.push(code.textContent!.trim());
                }
            });

            let timeLimit = 1000;
            let memoryLimit = 256;

            const timeLimitElement = document.querySelector('span.problem__tag-item.bp3-icon-stopwatch');
            if (timeLimitElement) {
                const text = timeLimitElement.textContent!.trim();
                const match = text.match(/(\d+\.?\d*)\s*(ms|s)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 's') {
                        timeLimit = num * 1000;
                    } else {
                        timeLimit = num;
                    }
                }
            }

            const memoryLimitElement = document.querySelector('span.problem__tag-item.bp3-icon-comparison');
            if (memoryLimitElement) {
                const text = memoryLimitElement.textContent!.trim();
                const match = text.match(/(\d+\.?\d*)\s*(mib|mb|gb)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    if (match[2].toLowerCase() === 'gb') {
                        memoryLimit = num * 1024;
                    } else {
                        memoryLimit = num;
                    }
                }
            }

            const samples = [];
            for (let i = 0; i < rawSnippets.length; i += 2) {
                const inputContent = rawSnippets[i];
                const outputContent = rawSnippets[i + 1] || "";
                samples.push({
                    id: (i / 2) + 1,
                    input: inputContent,
                    output: outputContent,
                    timeLimit: timeLimit,
                    memoryLimit: memoryLimit
                });
            }
            return { samples, timeLimit, memoryLimit };
        },
        buttonStateKey: 'marsojButtonState'
    }
};