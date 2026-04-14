import { Sample, DomainConfig } from './types';
import { domainConfigs } from './domainConfig';

/**
 * 根据域名配置从当前页面提取代码片段。
 * @returns {Array<Object>} 包含成对样例对象的数组。
 */
export function extractCodeSnippets(): Sample[] {
    console.log('OICPP SampleTester: extractCodeSnippets - 开始提取代码片段。');
    const hostname = window.location.hostname;
    const config = domainConfigs[hostname];

    if (!config || !config.extract) {
        console.log('OICPP SampleTester: extractCodeSnippets - 域名无特定配置或提取函数，使用默认选择器。');
        // 如果没有特定配置，则为其他域名使用默认回退
        const rawSnippets: string[] = [];
        document.querySelectorAll('pre.syntax-hl code').forEach(element => {
            rawSnippets.push(element.textContent!);
        });
        const pairedSamples: Sample[] = [];
        for (let i = 0; i < rawSnippets.length; i += 2) {
            const inputContent = rawSnippets[i];
            const outputContent = rawSnippets[i + 1] || "";
            pairedSamples.push({
                id: (i / 2) + 1,
                input: inputContent,
                output: outputContent,
                timeLimit: 1000, // Default
                memoryLimit: 512 // Default
            });
        }
        return pairedSamples;
    } else {
        console.log('OICPP SampleTester: extractCodeSnippets - 使用域名特定配置和提取函数:', config);
        const result = config.extract();
        console.log('OICPP SampleTester: extractCodeSnippets - 提取结果:', result);
        return result.samples;
    }
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