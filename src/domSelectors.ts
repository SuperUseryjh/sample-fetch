import { Sample, DomainConfig } from './types';
import { domainConfigs } from './domainConfig';

/**
 * 根据域名配置从当前页面提取代码片段。
 * @returns {Array<Object>} 包含成对样例对象的数组。
 */
export function extractCodeSnippets(): Sample[] {
    console.log('OICPP SampleTester: extractCodeSnippets - 开始提取代码片段。');
    const rawSnippets: string[] = [];
    const hostname = window.location.hostname;
    const config = domainConfigs[hostname];

    if (!config) {
        console.log('OICPP SampleTester: extractCodeSnippets - 域名无特定配置，使用默认选择器。');
        // 如果没有特定配置，则为其他域名使用默认回退
        document.querySelectorAll('pre.syntax-hl code').forEach(element => {
            rawSnippets.push(element.textContent!);
        });
    } else {
        console.log('OICPP SampleTester: extractCodeSnippets - 使用域名特定配置:', config);
        if (hostname === 'codeforces.com' && config.codeforcesLineExtractor) {
            const inputSnippets: string[] = [];
            const outputSnippets: string[] = [];

            document.querySelectorAll('div.input pre').forEach(element => {
                inputSnippets.push(config.codeforcesLineExtractor!(element as HTMLElement));
            });
            document.querySelectorAll('div.output pre').forEach(element => {
                outputSnippets.push(config.codeforcesLineExtractor!(element as HTMLElement));
            });

            for (let i = 0; i < inputSnippets.length && i < outputSnippets.length; i++) {
                rawSnippets.push(inputSnippets[i]);
                rawSnippets.push(outputSnippets[i]);
            }
        } else {
            config.codeSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(element => {
                    rawSnippets.push(element.textContent!.trim());
                });
            });
        }
    }
    console.log('OICPP SampleTester: extractCodeSnippets - 找到的原始片段:', rawSnippets);

    // 如果是 Atcoder 并且 rawSnippets 数量是偶数，只保留前半部分
    if (hostname === 'atcoder.jp' && rawSnippets.length % 2 === 0 && rawSnippets.length > 0) {
        const halfLength = rawSnippets.length / 2;
        rawSnippets.splice(halfLength); // 移除后半部分
        console.log('OICPP SampleTester: extractCodeSnippets - Atcoder 页面，只保留前半部分样例。');
    }

    const pairedSamples: Sample[] = [];
    let defaultTimeLimit = 1000; // 默认时间限制
    let defaultMemoryLimit = 512; // 默认内存限制

    if (hostname === 'htoj.com.cn' && config.extractTimeAndMemoryLimits) {
        const limits = config.extractTimeAndMemoryLimits();
        defaultTimeLimit = limits.timeLimit;
        defaultMemoryLimit = limits.memoryLimit;
        console.log('OICPP SampleTester: extractCodeSnippets - 提取到时间限制:', defaultTimeLimit, '内存限制:', defaultMemoryLimit);
    } else if ((hostname === 'luogu.com.cn' || hostname === 'www.luogu.com.cn') && config.extractLuoguLimits) {
        const limits = config.extractLuoguLimits();
        defaultTimeLimit = limits.timeLimit;
        defaultMemoryLimit = limits.memoryLimit;
        console.log('OICPP SampleTester: extractCodeSnippets - 提取到时间限制:', defaultTimeLimit, '内存限制:', defaultMemoryLimit);
    } else if (hostname === 'atcoder.jp' && config.extractAtcoderLimits) {
        const limits = config.extractAtcoderLimits();
        defaultTimeLimit = limits.timeLimit;
        defaultMemoryLimit = limits.memoryLimit;
        console.log('OICPP SampleTester: extractCodeSnippets - 提取到时间限制:', defaultTimeLimit, '内存限制:', defaultMemoryLimit);
    } else if (hostname === 'codeforces.com' && config.extractCodeforcesLimits) {
        const limits = config.extractCodeforcesLimits();
        defaultTimeLimit = limits.timeLimit;
        defaultMemoryLimit = limits.memoryLimit;
        console.log('OICPP SampleTester: extractCodeSnippets - 提取到时间限制:', defaultTimeLimit, '内存限制:', defaultMemoryLimit);
    }

    for (let i = 0; i < rawSnippets.length; i += 2) {
        const inputContent = rawSnippets[i];
        const outputContent = rawSnippets[i + 1] || ""; // 处理奇数个片段

        pairedSamples.push({
            id: (i / 2) + 1, // 每对的ID
            input: inputContent,
            output: outputContent,
            timeLimit: defaultTimeLimit, // 使用提取到的时间限制
            memoryLimit: defaultMemoryLimit // 使用提取到的内存限制
        });
    }
    console.log('OICPP SampleTester: extractCodeSnippets - 成对样例:', pairedSamples);
    return pairedSamples;
}

/**
 * 根据域名配置从当前页面获取题目名称。
 * @returns {string} 提取的题目名称。
 */
export function getProblemName(): string {
    console.log('OICPP SampleTester: getProblemName - 开始提取题目名称。');
    const hostname = window.location.hostname;
    const config = domainConfigs[hostname];

    if (!config || !config.problemNameSelector) {
        console.log('OICPP SampleTester: getProblemName - 未找到配置或题目名称选择器。');
        return '';
    }

    const problemTitleElement = document.querySelector(config.problemNameSelector);
    if (problemTitleElement) {
        let problemName: string;
        if (config.specialProblemNameExtraction) {
            problemName = config.specialProblemNameExtraction(problemTitleElement as HTMLElement);
            console.log('OICPP SampleTester: getProblemName - 使用特殊提取方法。名称:', problemName);
        } else {
            problemName = problemTitleElement.textContent!.trim();
            console.log('OICPP SampleTester: getProblemName - 使用默认提取方法。名称:', problemName);
        }
        return problemName;
    }
    console.log('OICPP SampleTester: getProblemName - 未找到题目标题元素。');
    return '';
}