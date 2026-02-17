import { GUIDE_POPOVER_ID, GUIDE_OVERLAY_ID, GUIDE_MAIN_PAGE_STORAGE_KEY, TOGGLE_BTN_ID } from './constants';
import { guideSteps } from './guideSteps';
import { showCustomDialog } from './ui';

let currentGuideStep = 0;

/**
 * 创建并附加指引弹出框UI。
 * @returns {HTMLElement} 创建的弹出框元素。
 */
export function createGuidePopover(): HTMLElement {
    let popover = document.getElementById(GUIDE_POPOVER_ID);
    if (!popover) {
        popover = document.createElement('div');
        popover.id = GUIDE_POPOVER_ID;
        popover.style.cssText = `
            position: absolute;
            background-color: #fff;
            border: 1px solid #007bff;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            padding: 15px;
            max-width: 300px;
            z-index: 2147483647; /* 确保在最  层 */
            pointer-events: auto; /* 确保可以点击 */
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #343a40;
            text-align: left;
        `;
        document.body.appendChild(popover);
    }
    popover.innerHTML = `
        <h4 style="margin-top: 0; color: #007bff;"></h4>
        <p style="margin-bottom: 15px;"></p>
        <div style="display: flex; justify-content: space-between;">
            <button id="guideSkipBtn" style="background-color: #6c757d; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">跳过</button>
            <button id="guideNextBtn" style="background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">下一步</button>
        </div>
    `;
    return popover;
}

/**
 * 创建并附加高亮覆盖层。
 * @returns {HTMLElement} 创建的覆盖层元素。
 */
export function createHighlightOverlay(): HTMLElement {
    let overlay = document.getElementById(GUIDE_OVERLAY_ID);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = GUIDE_OVERLAY_ID;
        overlay.style.cssText = `
            position: absolute;
            background-color: rgba(0, 123, 255, 0.2); /* 半透明蓝色 */
            border: 2px solid #007bff;
            border-radius: 5px;\n            z-index: 99999;
            pointer-events: none; /* 允许点击穿透 */
            transition: all 0.3s ease-in-out;
        `;
        document.body.appendChild(overlay);
    }
    return overlay;
}

/**
 * 将弹出框定位到目标元素。
 * @param {HTMLElement} popover - 指引弹出框元素。
 * @param {HTMLElement} targetElement - 要相对定位的目标元素。
 */
export function positionPopover(popover: HTMLElement, targetElement: HTMLElement) {
    const targetRect = targetElement.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth;
    const popoverHeight = popover.offsetHeight;

    let top = targetRect.bottom + 10 + window.scrollY;
    let left = targetRect.left + window.scrollX;

    // 如果弹出框超出屏幕右侧，则调整位置
    if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 20; // 距离右侧20px的边距
    }
    // 如果弹出框超出屏幕左侧，则调整位置
    if (left < 0) {
        left = 20; // 距离左侧20px的边距
    }

    // 如果弹出框超出屏幕底部，则调整位置
    if (top + popoverHeight > window.innerHeight + window.scrollY) {
        top = targetRect.top - popoverHeight - 10 + window.scrollY;
        if (top < window.scrollY) { // 如果仍然超出屏幕，则定位到视口顶部
            top = window.scrollY + 20;
        }
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
}

/**
 * 显示特定的指引步骤
 * @param {number} stepIndex - 要显示的步骤索引。
 * @param {string} storageKey - 用于存储指引状态的键。
 */
export function showGuideStep(stepIndex: number, storageKey: string) {
    if (stepIndex >= guideSteps.length) {
        skipGuide(storageKey);
        return;
    }

    currentGuideStep = stepIndex;
    const step = guideSteps[currentGuideStep];
    const targetElement = document.querySelector(step.selector);

    if (!targetElement) {
        console.warn(`指引: 未找到步骤 ${stepIndex} 的目标元素: ${step.selector}`);
        nextGuideStep(storageKey); // 如果未找到元素，则跳过此步骤
        return;
    }

    const popover = createGuidePopover();
    const overlay = createHighlightOverlay();

    // 更新弹出框内容
    popover.querySelector('h4')!.textContent = step.title;
    popover.querySelector('p')!.textContent = step.description;

    // 高亮目标元素
    const targetRect = targetElement.getBoundingClientRect();
    overlay.style.width = `${targetRect.width}px`;
    overlay.style.height = `${targetRect.height}px`;
    overlay.style.top = `${targetRect.top + window.scrollY}px`;
    overlay.style.left = `${targetRect.left + window.scrollX}px`;
    overlay.style.display = 'block';

    // 滚动到目标元素
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 滚动后定位弹出框
    setTimeout(() => {
        positionPopover(popover, targetElement as HTMLElement);
        popover.style.display = 'block';

        // 在弹出框可见并定位后附加事件监听器
        const nextBtn = popover.querySelector('#guideNextBtn');
        const skipBtn = popover.querySelector('#guideSkipBtn');

        // 移除现有监听器以防止重复
        nextBtn?.removeEventListener('click', () => nextGuideStep(storageKey));
        skipBtn?.removeEventListener('click', () => skipGuide(storageKey));

        nextBtn?.addEventListener('click', () => nextGuideStep(storageKey));
        skipBtn?.addEventListener('click', () => skipGuide(storageKey));

        // 更新按钮文本
        if (currentGuideStep === guideSteps.length - 1) {
            nextBtn!.textContent = '完成';
        } else {
            nextBtn!.textContent = '下一步';
        }
    }, 300); // 给滚动动画一些时间
}

/**
 * 前进到下一个指引步骤。
 * @param {string} storageKey - 用于存储指引状态的键。
 */
export function nextGuideStep(storageKey: string) {
    currentGuideStep++;
    showGuideStep(currentGuideStep, storageKey);
}

/**
 * 隐藏指引并标记为已显示。
 * @param {string} storageKey - 用于存储指引状态的键。
 */
export async function skipGuide(storageKey: string) {
    const popover = document.getElementById(GUIDE_POPOVER_ID);
    const overlay = document.getElementById(GUIDE_OVERLAY_ID);
    if (popover) popover.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    await window.GM_setValue(storageKey, true);
}

/**
 * 启动交互式指引。
 * @param {boolean} forceShow - 如果为 true，则强制显示指引，不检查存储键和不弹出确认框。
 * @param {string} storageKey - 用于存储指引状态的键。
 */
export async function startGuide(forceShow: boolean = false, storageKey: string = GUIDE_MAIN_PAGE_STORAGE_KEY) {
    const guideShown = await window.GM_getValue(storageKey, false);
    console.log(`OICPP SampleTester: Guide - storageKey: ${storageKey}, guideShown: ${guideShown}`);

    if (guideShown) {
        return; // 指引已显示，直接返回
    }

    let shouldShowGuide = true; // 默认显示指引
    if (!forceShow) {
        const result = await showCustomDialog('貌似你是第一次使用 OICPP 样例抓取呢，要看看新手教程吗', '', false, '', true);
        shouldShowGuide = result === 'ok';
    }

    if (!shouldShowGuide) {
        await skipGuide(storageKey); // 用户选择不看指引
        return;
    }

    // 创建弹出框，但暂不附加监听器
    createGuidePopover(); // 确保弹出框存在，以便 showGuideStep 找到它
    showGuideStep(0, storageKey);
}