import { initializeUI } from './ui';
import { checkUpdate } from './checkUpdate';
import { handleDynamicDomainConfig } from './dynamicDomainHandler';
import { domainConfigs } from './domainConfig';

declare const SCRIPT_VERSION: string; // 声明全局变量

(async function() {
    'use strict';
    console.log('OICPP SampleTester: 油猴脚本已加载。');

    // 如果在 iframe 中，则不初始化 UI
    if (window.self !== window.top) {
        console.log('OICPP SampleTester: 当前页面在 iframe 中，跳过 UI 初始化。');
        return;
    }

    // 处理动态域名配置，如果返回 true，表示已处理设置页面或重定向，无需继续初始化 UI
    if (await handleDynamicDomainConfig()) {
        return;
    }

    // 如果当前域名没有静态配置，也没有动态配置，则跳过其他注入
    const currentHostname = window.location.hostname;
    if (!domainConfigs[currentHostname]) {
        console.log(`OICPP SampleTester: 当前域名 ${currentHostname} 没有配置，跳过 UI 初始化和更新检查。`);
        return;
    }

    initializeUI();
    checkUpdate();
})();