import { PROBLEM_NAME_MODE_KEY, GUIDE_SETTINGS_PAGE_STORAGE_KEY } from './constants';
import { showCustomDialog } from './ui';
import { domainConfigs } from './domainConfig'; // 导入 domainConfigs
import { startGuide } from './guide'; // 导入 startGuide 函数

const DYNAMIC_CONFIGS_STORAGE_KEY = 'oicpp_dynamic_configs'; // 全局存储动态配置的键

/**
 * 渲染 OICPP SampleTester 设置页面。
 */
export function renderSettingsPage() {
    // 清空当前页面内容
    document.body.innerHTML = '';

    // 创建一个主容器来放置所有设置内容
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100vh;
        background-color: #f0f2f5;
        padding: 20px;
        box-sizing: border-box;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
    `;
    document.body.appendChild(mainContainer);

    // 创建设置卡片容器
    const settingsCard = document.createElement('div');
    settingsCard.id = 'oicppSettingsCard';
    settingsCard.style.cssText = `
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        padding: 40px;
        width: 100%;
        max-width: 700px;
        margin-top: 30px;
        margin-bottom: 30px;
        box-sizing: border-box;
    `;
    mainContainer.appendChild(settingsCard);

    settingsCard.innerHTML = `
        <h2 style="text-align: center; color: #007bff; margin-bottom: 35px; font-size: 28px; font-weight: 600;">OICPP 设置</h2>

        <!-- 题目名称模式设置 -->
        <div style="margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #eee;">
            <h4 style="color: #333; margin-bottom: 20px; font-size: 20px; font-weight: 600;">题目名称模式</h4>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <label style="display: flex; align-items: center; gap: 12px; font-size: 17px; cursor: pointer;">
                    <input type="radio" name="problemNameMode" value="default" id="problemNameModeDefault" style="transform: scale(1.3); accent-color: #007bff;">
                    默认 (使用网页标题)
                </label>
                <label style="display: flex; align-items: center; gap: 12px; font-size: 17px; cursor: pointer;">
                    <input type="radio" name="problemNameMode" value="custom" id="problemNameModeCustom" style="transform: scale(1.3); accent-color: #007bff;">
                    自定义 (每次抓取时输入)
                </label>
            </div>
            <button id="saveProblemNameSettingsBtn" style="width: 100%; padding: 12px 15px; background-color: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 18px; font-weight: bold; transition: background-color 0.2s ease; margin-top: 30px;">
                保存题目名称设置
            </button>
        </div>

        <!-- 动态域名配置 -->
        <div style="margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #eee;">
            <h4 style="color: #333; margin-bottom: 20px; font-size: 20px; font-weight: 600;">配置动态域名</h4>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="dynamicDomainInput" placeholder="输入域名，例如：example.com" style="padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; width: calc(100% - 24px);">
                <select id="ojTemplateSelect" style="padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; width: 100%; background-color: #fff; cursor: pointer;">
                    <option value="">选择 OJ 模板</option>
                </select>
                <button id="addDynamicDomainBtn" style="width: 100%; padding: 12px 15px; background-color: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 18px; font-weight: bold; transition: background-color 0.2s ease;">
                    添加动态域名
                </button>
            </div>
        </div>

        <!-- 已配置动态域名列表 -->
        <div>
            <h4 style="color: #333; margin-bottom: 20px; font-size: 20px; font-weight: 600;">已配置动态域名</h4>
            <ul id="dynamicDomainList" style="list-style: none; padding: 0; margin: 0;">
                <!-- 动态域名将在这里加载 -->
            </ul>
        </div>
    `;

    // --- 题目名称模式逻辑 ---
    const savedMode = localStorage.getItem(PROBLEM_NAME_MODE_KEY) || 'default';
    const defaultRadio = settingsCard.querySelector<HTMLInputElement>('#problemNameModeDefault');
    const customRadio = settingsCard.querySelector<HTMLInputElement>('#problemNameModeCustom');

    if (savedMode === 'default') {
        defaultRadio!.checked = true;
    } else {
        customRadio!.checked = true;
    }

    settingsCard.querySelector<HTMLButtonElement>('#saveProblemNameSettingsBtn')!.addEventListener('click', () => {
        const selectedMode = (settingsCard.querySelector('input[name="problemNameMode"]:checked') as HTMLInputElement).value;
        localStorage.setItem(PROBLEM_NAME_MODE_KEY, selectedMode);
        showCustomDialog('题目名称设置已保存！');
    });

    // --- 动态域名配置逻辑 ---
    const ojTemplateSelect = settingsCard.querySelector<HTMLSelectElement>('#ojTemplateSelect')!;
    const dynamicDomainInput = settingsCard.querySelector<HTMLInputElement>('#dynamicDomainInput')!;
    const addDynamicDomainBtn = settingsCard.querySelector<HTMLButtonElement>('#addDynamicDomainBtn')!;
    const dynamicDomainList = settingsCard.querySelector<HTMLUListElement>('#dynamicDomainList')!;

    // 填充 OJ 模板选择框
    for (const domainKey in domainConfigs) {
        const config = domainConfigs[domainKey];
        const option = document.createElement('option');
        option.value = domainKey; // 使用 domainKey 作为值，方便查找
        option.textContent = config.ojName || domainKey; // 显示 ojName，如果没有则显示 domainKey
        ojTemplateSelect.appendChild(option);
    }

    // 渲染动态域名列表
    async function renderDynamicDomainList() {
        dynamicDomainList.innerHTML = ''; // 清空现有列表
        const dynamicConfigs = await window.GM_getValue(DYNAMIC_CONFIGS_STORAGE_KEY, []);

        dynamicConfigs.forEach((item: { domain: string, ojTemplateKey: string }) => {
            const ojName = domainConfigs[item.ojTemplateKey]?.ojName || '未知模板';

            const listItem = document.createElement('li');
            listItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px dashed #eee;
                font-size: 16px;
            `;
            listItem.innerHTML = `
                <span><strong>${item.domain}</strong> (模板: ${ojName})</span>
                <button data-domain="${item.domain}" style="padding: 6px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.2s ease;">
                            移除
                        </button>
                    `;
            dynamicDomainList.appendChild(listItem);
        });

        // 添加移除按钮的事件监听器
        dynamicDomainList.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', async (event) => {
                const targetButton = event.target as HTMLButtonElement;
                const domainToRemove = targetButton.dataset.domain;
                if (domainToRemove && confirm(`确定要移除域名 ${domainToRemove} 吗？`)) {
                    let currentDynamicConfigs = await window.GM_getValue(DYNAMIC_CONFIGS_STORAGE_KEY, []);
                    currentDynamicConfigs = currentDynamicConfigs.filter((item: { domain: string }) => item.domain !== domainToRemove);
                    await window.GM_setValue(DYNAMIC_CONFIGS_STORAGE_KEY, currentDynamicConfigs);
                    showCustomDialog(`域名 ${domainToRemove} 已移除。`);
                    renderDynamicDomainList(); // 刷新列表
                }
            });
        });
    }

    // 添加动态域名按钮事件
    addDynamicDomainBtn.addEventListener('click', async () => {
        const domain = dynamicDomainInput.value.trim();
        const selectedOjTemplateKey = ojTemplateSelect.value;

        if (!domain) {
            showCustomDialog('请输入域名！');
            return;
        }
        if (!selectedOjTemplateKey) {
            showCustomDialog('请选择一个 OJ 模板！');
            return;
        }

        // 简单的域名格式验证
        const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
            showCustomDialog('请输入有效的域名格式 (例如: example.com)');
            return;
        }

        const configToSave = domainConfigs[selectedOjTemplateKey];
        if (configToSave) {
            let currentDynamicConfigs = await window.GM_getValue(DYNAMIC_CONFIGS_STORAGE_KEY, []);

            // 检查是否已存在
            if (currentDynamicConfigs.some((item: { domain: string }) => item.domain === domain)) {
                showCustomDialog(`域名 ${domain} 已存在，请勿重复添加。`);
                return;
            }

            currentDynamicConfigs.push({
                domain: domain,
                ojTemplateKey: selectedOjTemplateKey
            });
            await window.GM_setValue(DYNAMIC_CONFIGS_STORAGE_KEY, currentDynamicConfigs);

            showCustomDialog(`域名 ${domain} 已成功添加，使用 ${configToSave.ojName} 模板。`);
            dynamicDomainInput.value = ''; // 清空输入框
            ojTemplateSelect.value = ''; // 重置选择框
            renderDynamicDomainList(); // 刷新列表
        } else {
            showCustomDialog('选择的 OJ 模板无效。');
        }
    });

    // 初始渲染动态域名列表
    renderDynamicDomainList();

    // 在设置页面加载完成后显示新手教程
    console.log('OICPP SampleTester: Settings Page Guide - Calling startGuide with storageKey:', GUIDE_SETTINGS_PAGE_STORAGE_KEY);
    startGuide(true, GUIDE_SETTINGS_PAGE_STORAGE_KEY);
}