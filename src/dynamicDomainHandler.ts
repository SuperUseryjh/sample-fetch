import { domainConfigs } from './domainConfig';
import { renderSettingsPage } from './settingsPage';
import { showCustomDialog } from './ui';


const DYNAMIC_CONFIGS_STORAGE_KEY = 'oicpp_dynamic_configs'; // 全局存储动态配置的键

/**
 * 处理动态域名配置的添加和加载。
 * 如果 URL 包含 enable=1 和 oj=<oj名称>，则添加新配置。
 * 否则，加载已保存的动态配置。
 * @returns {boolean} 如果是设置页面且处理了动态配置，则返回 true，否则返回 false。
 */
export async function handleDynamicDomainConfig(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const enableParam = urlParams.get('enable');
    const ojParam = urlParams.get('oj');

    if (window.location.pathname.endsWith('/oicpp-settings') || window.location.pathname.endsWith('/oicpp-settings/')) {
        if (enableParam === '1' && ojParam) {
            const currentHostname = window.location.hostname;
            const configToCopy = domainConfigs[ojParam];

            if (configToCopy) {
                let currentDynamicConfigs = await window.GM_getValue(DYNAMIC_CONFIGS_STORAGE_KEY, []);

                // 检查是否已存在
                if (currentDynamicConfigs.some((item: { domain: string }) => item.domain === currentHostname)) {
                    showCustomDialog(`域名 ${currentHostname} 已存在，请勿重复添加。`);
                } else {
                    currentDynamicConfigs.push({
                        domain: currentHostname,
                        ojTemplateKey: ojParam
                    });
                    await window.GM_setValue(DYNAMIC_CONFIGS_STORAGE_KEY, currentDynamicConfigs);
                    showCustomDialog(`已将当前域名 ${currentHostname} 添加到 OICPP 脚本范围，并使用 ${ojParam} 的配置。`);
                }

                // 重定向到不带参数的设置页面
                window.location.href = window.location.origin + '/oicpp-settings';
                return true; // 已处理动态配置并重定向
            } else {
                showCustomDialog(`未找到名为 ${ojParam} 的 OJ 配置。`);
            }
        }
        renderSettingsPage();
        return true; // 是设置页面，已渲染或处理了参数
    }

    // 加载动态配置
    const currentHostname = window.location.hostname;
    const dynamicConfigs = await window.GM_getValue(DYNAMIC_CONFIGS_STORAGE_KEY, []);

    const matchedConfig = dynamicConfigs.find((item: { domain: string }) => item.domain === currentHostname);

    if (matchedConfig) {
        const ojTemplateKey = matchedConfig.ojTemplateKey;
        const configFromTemplate = domainConfigs[ojTemplateKey];

        if (configFromTemplate) {
            // 将动态配置合并到 domainConfigs
            domainConfigs[currentHostname] = {
                ...configFromTemplate,
                // 确保 extract 函数被正确引用
                extract: configFromTemplate.extract
            };
            console.log(`OICPP SampleTester: 已加载并应用动态配置用于 ${currentHostname} (模板: ${ojTemplateKey})。`);
        } else {
            console.error(`OICPP SampleTester: 动态配置中引用的 OJ 模板 ${ojTemplateKey} 无效。`);
            // 考虑从全局存储中移除此无效配置
            let updatedDynamicConfigs = dynamicConfigs.filter((item: { domain: string }) => item.domain !== currentHostname);
            await window.GM_setValue(DYNAMIC_CONFIGS_STORAGE_KEY, updatedDynamicConfigs);
        }
    }
    return false; // 未处理动态配置，也不是设置页面
}