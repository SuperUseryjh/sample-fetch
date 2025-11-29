import { TOGGLE_BTN_ID, COOLDOWN_DURATION_MS } from './constants';
import { DomainConfig, Payload } from './types';
import { extractCodeSnippets, getProblemName } from './domSelectors';
import { sendProblemToAPI } from './api';
import { createTemporaryStatusMessage } from './ui'; // 导入 createTemporaryStatusMessage

let isCooldownActive = false; // 冷却状态变量
let cooldownIntervalId: number | null = null; // 用于存储倒计时 interval ID

/**
 * 处理点击按钮创建题目的逻辑。
 * 这用于完整的面板UI。
 * @param {HTMLInputElement} ojInput - OJ输入元素。
 * @param {HTMLInputElement} problemNameInput - 题目名称输入元素。
 * @param {HTMLElement} statusMessage - 状态消息元素。
 * @param {HTMLElement} panel - 面板元素。
 */
export async function handleCreateProblem(ojInput: HTMLInputElement, problemNameInput: HTMLInputElement, statusMessage: HTMLElement, panel: HTMLElement) {
    const oj = ojInput.value;
    let problemName = problemNameInput.value;
    if (problemName.length > 32) {
        console.warn('OICPP SampleTester: handleCreateProblem - 题目名称过长，已截断至32字符。');
        problemName = problemName.substring(0, 32);
    }

    if (!oj || !problemName) {
        alert('OJ 和 题目名称不能为空！');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        }
        return;
    }

    statusMessage.style.color = 'blue';
    statusMessage.textContent = '正在提取代码并发送请求...';
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    }

    const samples = extractCodeSnippets();

    if (samples.length === 0) {
        alert('未找到任何 <code> 标签可提取。');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        }
        return;
    }

    const payload: Payload = {
        OJ: oj,
        problemName: problemName,
        samples: samples
    };

    sendProblemToAPI(payload, statusMessage);
}

/**
 * 处理非HTOJ域名的切换按钮点击逻辑。
 * @param {Object} config - 域名配置。
 */
export async function handleToggleButtonClick(config: DomainConfig) {
    console.log('OICPP SampleTester: handleToggleButtonClick - 切换按钮被点击。冷却状态:', isCooldownActive);
    const toggleBtn = document.getElementById(TOGGLE_BTN_ID) as HTMLButtonElement;
    const cooldownCountdownSpan = toggleBtn?.querySelector<HTMLElement>('#cooldownCountdown');
    const statusMessage = createTemporaryStatusMessage();

    if (!toggleBtn || !cooldownCountdownSpan) {
        console.error('OICPP SampleTester: handleToggleButtonClick - 未找到切换按钮或倒计时元素。');
        return;
    }

    // 定位状态消息到按钮下方
    const toggleBtnRect = toggleBtn.getBoundingClientRect();
    statusMessage.style.top = `${toggleBtnRect.bottom + 10}px`; // 按钮下方10px
    statusMessage.style.left = `${toggleBtnRect.left}px`; // 与按钮左侧对齐

    if (isCooldownActive) {
        console.log('OICPP SampleTester: handleToggleButtonClick - 冷却中，阻止新请求。');
        statusMessage.style.color = 'orange';
        statusMessage.textContent = `请稍候，${Math.ceil(COOLDOWN_DURATION_MS / 1000)}秒后可再次发送。`;
        statusMessage.style.display = 'block';
        setTimeout(() => { statusMessage.style.display = 'none'; }, 3000); // 3秒后隐藏冷却消息
        return;
    }

    isCooldownActive = true;
    toggleBtn.disabled = true;
    toggleBtn.style.cursor = 'not-allowed';
    cooldownCountdownSpan.style.display = 'inline';

    let timeLeft = COOLDOWN_DURATION_MS;
    cooldownIntervalId = window.setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft <= 0) {
            window.clearInterval(cooldownIntervalId!);
            isCooldownActive = false;
            toggleBtn.disabled = false;
            toggleBtn.style.cursor = 'grab';
            cooldownCountdownSpan.style.display = 'none';
            cooldownCountdownSpan.textContent = '';
            statusMessage.style.display = 'none'; // 清除任何残留状态
        } else {
            cooldownCountdownSpan.textContent = `(${Math.ceil(timeLeft / 1000)}s)`;
        }
    }, 1000);


    statusMessage.style.display = 'block';

    const oj = config ? config.ojName : '';
    let problemName = getProblemName();
    if (problemName.length > 32) {
        console.warn('OICPP SampleTester: handleToggleButtonClick - 题目名称过长，已截断至32字符。');
        problemName = problemName.substring(0, 32);
    }

    if (!oj || !problemName) {
        statusMessage.style.color = 'red';
        statusMessage.textContent = 'OJ 或 题目名称无法自动获取，请手动操作或刷新页面。';
        alert('OJ 或 题目名称无法自动获取，请手动操作或刷新页面。');
        // 如果立即出错，重置冷却
        window.clearInterval(cooldownIntervalId!);
        isCooldownActive = false;
        toggleBtn.disabled = false;
        toggleBtn.style.cursor = 'grab';
        cooldownCountdownSpan.style.display = 'none';
        cooldownCountdownSpan.textContent = '';
        return;
    }

    const samples = extractCodeSnippets();

    if (samples.length === 0) {
        statusMessage.style.color = 'red';
        statusMessage.textContent = '未找到任何 <code> 标签可提取。';
        alert('未找到任何 <code> 标签可提取。');
        // 如果立即出错，重置冷却
        window.clearInterval(cooldownIntervalId!);
        isCooldownActive = false;
        toggleBtn.disabled = false;
        toggleBtn.style.cursor = 'grab';
        cooldownCountdownSpan.style.display = 'none';
        cooldownCountdownSpan.textContent = '';
        return;
    }

    const payload: Payload = {
        OJ: oj,
        problemName: problemName,
        samples: samples
    };
    console.log('OICPP SampleTester: handleToggleButtonClick - 准备发送的数据:', payload);

    sendProblemToAPI(payload, statusMessage);

    // 几秒后自动隐藏状态消息
    setTimeout(() => {
        statusMessage.style.display = 'none';
        statusMessage.textContent = '';
    }, 5000);
}