import { PANEL_ID, TOGGLE_BTN_ID, TEMP_STATUS_ID, STATE_SELECTION_PANEL_ID, LOCAL_STORAGE_POS_X, LOCAL_STORAGE_POS_Y, GUIDE_MAIN_PAGE_STORAGE_KEY, CONTROL_BTN_ID, PROBLEM_NAME_MODE_KEY, PROBLEM_NAME_CUSTOM_INPUT_KEY } from './constants';
import { DomainConfig } from './types';
import { makeDraggable } from './utils';
import { getProblemName } from './domSelectors';
import { handleCreateProblem, handleToggleButtonClick } from './eventHandlers';
import { domainConfigs } from './domainConfig';
import { startGuide } from './guide';

// 定义所有 setupXxxButton 函数的类型
type SetupButtonFunction = (state: 'fixed' | 'floating') => void;

/**
 * 创建主面板UI。
 * @returns {HTMLElement} 创建的面板元素。
 */
export function createPanelUI(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 270px;
        width: 250px;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        color: #343a40;
        display: none; /* 默认隐藏 */
    `;

    panel.innerHTML = `
        <div id="${PANEL_ID}Header" style="background-color: #007bff; color: white; padding: 8px 12px; border-top-left-radius: 8px; border-top-right-radius: 8px; cursor: move; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; font-size: 16px;">创建题目</h4>
            <button id="${PANEL_ID}CloseBtn" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; line-height: 1; padding: 0;">&times;</button>
        </div>
        <div id="${PANEL_ID}Content" style="padding: 12px;">
            <label for="ojInput" style="display: block; margin-bottom: 4px; font-weight: bold;">OJ:</label>
            <input type="text" id="ojInput" value="" style="width: calc(100% - 10px); padding: 6px; margin-bottom: 10px; border: 1px solid #ced4da; border-radius: 4px;"><br>
            <label for="problemNameInput" style="display: block; margin-bottom: 4px; font-weight: bold;">题目名称:</label>
            <input type="text" id="problemNameInput" placeholder="P1001 A + B Problem" style="width: calc(100% - 10px); padding: 6px; margin-bottom: 15px; border: 1px solid #ced4da; border-radius: 4px;"><br>
            <button id="createProblemBtn" style="width: 100%; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 15px; font-weight: bold;">提取代码并创建题目</button>
            <div id="statusMessage" style="margin-top: 15px; color: green; text-align: center; font-size: 13px;"></div>
        </div>
    `;
    document.body.appendChild(panel);
    return panel;
}

/**
 * 创建切换按钮UI。
 * @returns {HTMLElement} 创建的切换按钮元素。
 */
export function createToggleButtonUI(): HTMLElement {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = TOGGLE_BTN_ID;
    toggleBtn.innerHTML = '发送至 OICPP <span id="cooldownCountdown" style="display:none; margin-left: 5px;"></span>'; // 添加倒计时span
    toggleBtn.title = '抓取样例并发送到 OICPP'; // 添加title以提高可访问性
    toggleBtn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 10px; /* 调整填充以获得更方形的外观 */
        border-radius: 4px;
        z-index: 10001;
        cursor: grab;
        font-size: 18px; /* 增加字体大小以提高图标可见性 */
        line-height: 1; /* 确保图标垂直居中 */
        display: flex; /* 使用flex对齐图标和倒计时 */
        align-items: center;
        justify-content: center;
    `;
    document.body.appendChild(toggleBtn);
    return toggleBtn;
}

/**
 * 创建悬浮控制按钮UI。
 * @returns {HTMLElement} 创建的控制按钮元素。
 */
export function createControlPanelButtonUI(): HTMLElement {
    const controlBtn = document.createElement('button');
    controlBtn.id = CONTROL_BTN_ID;
    controlBtn.innerHTML = `⚙️`;
    controlBtn.title = '设置题目名称模式';
    controlBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 10001;
    `;
    document.body.appendChild(controlBtn);
    makeDraggable(controlBtn, controlBtn);
    return controlBtn;
}

/**
 * 创建并附加一个临时状态消息元素到body。
 * @returns {HTMLElement} 创建的状态消息元素。
 */
export function createTemporaryStatusMessage(): HTMLElement {
    let statusDiv = document.getElementById(TEMP_STATUS_ID);
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = TEMP_STATUS_ID;
        statusDiv.style.cssText = `
            position: fixed;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 8px 12px;
            border-radius: 44px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 10002;
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #343a40;
            display: none;
        `;
        document.body.appendChild(statusDiv);
    }
    return statusDiv;
}

/**
 * 限制按钮位置在屏幕可见区域内。
 * @param {HTMLElement} button - 按钮元素。
 * @param {number} currentRight - 当前的 right 值。
 * @param {number} currentTop - 当前的 top 值。
 * @returns {{right: number, top: number}} 调整后的 right 和 top 值。
 */
function clampButtonPosition(button: HTMLElement, currentRight: number, currentTop: number): { right: number, top: number } {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const buttonRect = button.getBoundingClientRect();

    let newRight = currentRight;
    let newTop = currentTop;

    // 检查右侧边界
    if (viewportWidth - currentRight < buttonRect.width) {
        newRight = viewportWidth - buttonRect.width - 10; // 留出 10px 边距
    }
    // 检查左侧边界 (right 值越大，按钮越靠左)
    if (currentRight > viewportWidth - 10) { // 假设按钮宽度为 50px，右侧至少留 10px
        newRight = 10; // 弹回右侧 10px
    }

    // 检查底部边界
    if (viewportHeight - currentTop < buttonRect.height) {
        newTop = viewportHeight - buttonRect.height - 10; // 留出 10px 边距
    }
    // 检查顶部边界
    if (currentTop < 10) {
        newTop = 10; // 弹回顶部 10px
    }

    // 确保 right 和 top 不会是负值
    newRight = Math.max(10, newRight); // 最小 right 值为 10px
    newTop = Math.max(10, newTop);     // 最小 top 值为 10px

    return { right: newRight, top: newTop };
}



/**
 * 显示一个自定义的 HTML 弹窗，可以包含消息和可选的输入框。
 * @param {string} message - 弹窗中显示的消息。
 * @param {string} [inputValue=''] - 输入框的初始值（如果存在输入框）。
 * @param {boolean} [showInput=false] - 是否显示输入框。
 * @param {string} [inputPlaceholder=''] - 输入框的占位符文本。
 * @returns {Promise<string | null>} 如果有输入框，返回用户输入的值；否则返回 'ok' 或 null（如果用户取消）。
 */
export function showCustomDialog(message: string, inputValue: string = '', showInput: boolean = false, inputPlaceholder: string = ''): Promise<string | null> {
    return new Promise((resolve) => {
        let dialogOverlay = document.getElementById('customDialogOverlay');
        if (!dialogOverlay) {
            dialogOverlay = document.createElement('div');
            dialogOverlay.id = 'customDialogOverlay';
            dialogOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 2147483647; /* 确保在最上层 */
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            document.body.appendChild(dialogOverlay);
        }

        const dialogBox = document.createElement('div');
        dialogBox.style.cssText = `
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            width: 90%;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
        `;

        dialogBox.innerHTML = `
            <p style="margin-bottom: 15px; font-size: 16px;">${message}</p>
            ${showInput ? `<input type="text" id="customDialogInput" value="${inputValue}" placeholder="${inputPlaceholder}" style="width: calc(100% - 20px); padding: 8px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;">` : ''}
            <div style="display: flex; justify-content: center; gap: 10px;">
                <button id="customDialogOkBtn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">确定</button>
                ${showInput ? `<button id="customDialogCancelBtn" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>` : ''}
            </div>
        `;

        dialogOverlay.appendChild(dialogBox);
        dialogOverlay.style.display = 'flex';

        const okBtn = dialogBox.querySelector<HTMLButtonElement>('#customDialogOkBtn');
        const cancelBtn = dialogBox.querySelector<HTMLButtonElement>('#customDialogCancelBtn');
        const inputElement = dialogBox.querySelector<HTMLInputElement>('#customDialogInput');

        const closeDialog = (result: string | null) => {
            dialogOverlay!.remove();
            resolve(result);
        };

        okBtn?.addEventListener('click', () => {
            if (showInput) {
                closeDialog(inputElement?.value || '');
            } else {
                closeDialog('ok');
            }
        });

        cancelBtn?.addEventListener('click', () => {
            closeDialog(null);
        });

        // 允许按 Enter 键确认，Esc 键取消
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                okBtn?.click();
            } else if (e.key === 'Escape') {
                cancelBtn?.click();
            }
        }, { once: true }); // 只监听一次，避免重复触发

        if (showInput && inputElement) {
            inputElement.focus();
        }
    });
}

/**
 * 创建并显示状态选择面板。
 * @param {HTMLElement} currentToggleBtn - 当前的切换按钮元素。
 * @param {Object} config - 域名配置。
 * @param {Function} setupHtojButton - 用于设置 HTOJ 按钮状态的回调函数。
 * @param {Function} setupLuoguButton - 用于设置 Luogu 按钮状态的回调函数。
 * @param {Function} setupAtcoderButton - 用于设置 Atcoder 按钮状态的回调函数。
 * @param {Function} setupCodeforcesButton - 用于设置 Codeforces 按钮状态的回调函数。
 */
export function createStateSelectionPanel(
    currentToggleBtn: HTMLElement,
    config: DomainConfig,
    setupHtojButton: SetupButtonFunction,
    setupLuoguButton: SetupButtonFunction,
    setupAtcoderButton: SetupButtonFunction,
    setupCodeforcesButton: SetupButtonFunction
) {
    let panel = document.getElementById(STATE_SELECTION_PANEL_ID);
    if (panel) {
        panel.remove(); // 移除旧面板以防止重复
    }

    panel = document.createElement('div');
    panel.id = STATE_SELECTION_PANEL_ID;
    panel.style.cssText = `
        position: fixed;
        background-color: #fff;
        border: 1px solid #007bff;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        padding: 10px;
        z-index: 2147483647;
        font-family: Arial, sans-serif;
        font-size: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    const hostname = window.location.hostname;

    const setupButtonState = (state: 'fixed' | 'floating') => {
        if (hostname === 'htoj.com.cn') {
            setupHtojButton(state);
        } else if (hostname === 'www.luogu.com.cn' || hostname === 'luogu.com.cn') {
            setupLuoguButton(state);
        } else if (hostname === 'atcoder.jp') {
            setupAtcoderButton(state);
        } else if (hostname === 'codeforces.com') {
            setupCodeforcesButton(state);
        }
    };

    const fixedBtn = document.createElement('button');
    fixedBtn.textContent = '切换到固定状态';
    fixedBtn.style.cssText = `
        background-color: #28a745;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
    `;
    fixedBtn.addEventListener('click', () => {
        localStorage.setItem(config.buttonStateKey, 'fixed');
        setupButtonState('fixed');
        panel!.remove();
    });

    const floatingBtn = document.createElement('button');
    floatingBtn.textContent = '切换到悬浮状态';
    floatingBtn.style.cssText = `
        background-color: #007bff;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
    `;
    floatingBtn.addEventListener('click', () => {
        localStorage.setItem(config.buttonStateKey, 'floating');
        setupButtonState('floating');
        panel!.remove();
    });

    panel.appendChild(fixedBtn);
    panel.appendChild(floatingBtn);
    document.body.appendChild(panel);

    // 定位面板到按钮旁边
    const btnRect = currentToggleBtn.getBoundingClientRect();
    panel.style.top = `${btnRect.top}px`;
    panel.style.left = `${btnRect.right + 10}px`; // 按钮右侧10px
}

/**
 * 为面板设置事件监听器。
 * @param {HTMLElement} panel - 面板元素。
 * @param {Object} config - 域名配置。
 */
export function setupPanelEventListeners(panel: HTMLElement, config: DomainConfig) {
    const ojInput = panel.querySelector<HTMLInputElement>('#ojInput');
    const problemNameInput = panel.querySelector<HTMLInputElement>('#problemNameInput');
    const panelHeader = panel.querySelector<HTMLElement>(`#${PANEL_ID}Header`);
    const panelContent = panel.querySelector<HTMLElement>(`#${PANEL_ID}Content`);
    const closeBtn = panel.querySelector<HTMLButtonElement>(`#${PANEL_ID}CloseBtn`);
    const createProblemBtn = panel.querySelector<HTMLButtonElement>('#createProblemBtn');
    const statusMessage = panel.querySelector<HTMLElement>('#statusMessage');

    // 元素错误检查
    if (!ojInput || !problemNameInput || !panelHeader || !panelContent || !closeBtn || !createProblemBtn || !statusMessage) {
        console.error('错误: 面板中未找到必要的UI元素。');
        return;
    }

    const panelDraggable = makeDraggable(panel, panelHeader);

    panelHeader.addEventListener('click', (e: MouseEvent) => {
        if (panelDraggable.getIsMoved()) {
            e.preventDefault(); // 如果是拖动，则阻止点击
            return;
        }
        if ((e.target as HTMLElement).id !== `${PANEL_ID}CloseBtn`) {
            panelContent.style.display = panelContent.style.display === 'none' ? 'block' : 'none';
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.remove();
        const toggleBtn = document.getElementById(TOGGLE_BTN_ID);
        if (toggleBtn) {
            toggleBtn.style.display = 'block'; // 如果面板关闭，则显示切换按钮
        }
    });

    createProblemBtn.addEventListener('click', () => handleCreateProblem(ojInput, problemNameInput, statusMessage, panel));

    // 初次填充字段
    populatePanelFields(panel, config);
}

/**
 * 使用特定域名的数据填充面板字段。
 * @param {HTMLElement} panel - 面板元素。
 * @param {Object} config - 域名配置。
 */
export function populatePanelFields(panel: HTMLElement, config: DomainConfig) {
    const ojInput = panel.querySelector<HTMLInputElement>('#ojInput');
    const problemNameInput = panel.querySelector<HTMLInputElement>('#problemNameInput');
    const statusMessage = panel.querySelector<HTMLElement>('#statusMessage');

    if (!ojInput || !problemNameInput || !statusMessage) {
        console.error('错误: 填充面板字段时未找到必要的UI元素。');
        return;
    }

    if (config) {
        ojInput.value = config.ojName || '';
        problemNameInput.value = getProblemName();
        if (config.initialStatusMessage) {
            statusMessage.style.color = 'orange';
            statusMessage.textContent = config.initialStatusMessage;
        } else {
            statusMessage.textContent = ''; // 清除之前的消息
        }
    }
    else {
        ojInput.value = '';
        problemNameInput.value = '';
        statusMessage.textContent = '';
    }
}

/**
 * 初始化UI和事件监听器。
 */
export async function initializeUI() {
    console.log('OICPP SampleTester: initializeUI - 正在初始化UI。');
    const hostname = window.location.hostname;
    const config = domainConfigs[hostname];
    console.log('OICPP SampleTester: initializeUI - 当前主机名:', hostname, '配置:', config);

    // 创建并设置控制按钮
    const controlBtn = createControlPanelButtonUI();
    controlBtn.addEventListener('click', () => { window.location.href = window.location.origin + '/oicpp-settings'; });

    let panel = document.getElementById(PANEL_ID);
    let toggleBtn = document.getElementById(TOGGLE_BTN_ID);

    // 定义所有 setupXxxButton 函数
    const setupHtojButton: SetupButtonFunction = (state) => {
        // Remove existing button if any
        let existingBtn = document.getElementById(TOGGLE_BTN_ID);
        if (existingBtn) {
            existingBtn.remove();
        }

        let toggleBtn: HTMLElement; // Explicitly declare as HTMLElement

        if (state === 'fixed') {
            console.log('OICPP SampleTester: initializeUI - HTOJ 按钮 (固定) 已停用，切换到悬浮按钮。');
        }
        toggleBtn = createToggleButtonUI();
        const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
        const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
        if (savedRight !== null && savedTop !== null) {
            let right = parseFloat(savedRight);
            let top = parseFloat(savedTop);
            const clampedPosition = clampButtonPosition(toggleBtn, right, top);
            toggleBtn.style.right = `${clampedPosition.right}px`;
            toggleBtn.style.top = `${clampedPosition.top}px`;
            console.log(`OICPP SampleTester: 已加载按钮位置 (悬浮): right=${clampedPosition.right}, top=${clampedPosition.top}`);
        } else {
            const defaultRight = 10;
            const defaultTop = 10;
            const clampedPosition = clampButtonPosition(toggleBtn, defaultRight, defaultTop);
            toggleBtn.style.right = `${clampedPosition.right}px`;
            toggleBtn.style.top = `${clampedPosition.top}px`;
            console.log('OICPP SampleTester: 已设置默认按钮位置 (悬浮)。');
        }
        const toggleBtnDraggable = makeDraggable(toggleBtn, toggleBtn);
        toggleBtn.addEventListener('click', (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); // Prevent default click action
                createStateSelectionPanel(toggleBtn, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
            } else if (toggleBtnDraggable.getIsMoved()) {
                e.preventDefault();
                console.log('OICPP SampleTester: initializeUI - 切换按钮被拖动，阻止点击事件。');
            } else {
                handleToggleButtonClick(config);
            }
        });
        console.log('OICPP SampleTester: initializeUI - HTOJ 按钮 (悬浮) 已插入。');
    };

    const setupLuoguButton: SetupButtonFunction = (state) => {
        // Remove existing button if any
        let existingBtn = document.getElementById(TOGGLE_BTN_ID);
        if (existingBtn) {
            existingBtn.remove();
        }

        let toggleBtn: HTMLElement; // Explicitly declare as HTMLElement

        if (state === 'fixed') {
            const findAndInsertFixedButton = () => {
                let targetElement = document.querySelector('div.nav-search');
                if (targetElement) {
                    const parentDiv = targetElement.parentElement;
                    if (parentDiv) {
                        parentDiv.style.display = 'flex';
                        parentDiv.style.alignItems = 'center';

                        toggleBtn = document.createElement('button');
                        toggleBtn.id = TOGGLE_BTN_ID;
                        toggleBtn.innerHTML = '发送至 OICPP <span id="cooldownCountdown" style="display:none; margin-left: 5px;"></span>';
                        toggleBtn.title = '抓取样例并发送到 OICPP';
                        toggleBtn.style.cssText = `
                            background-color: #007bff;
                            color: white;
                            border: none;
                            padding: 8px 10px;
                            border-radius: 4px;
                            z-index: 10001;
                            cursor: pointer;
                            font-size: 18px;
                            line-height: 1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 10px;
                        `;
                        targetElement.before(toggleBtn);
                        console.log('OICPP SampleTester: initializeUI - Luogu 按钮 (固定) 已插入。');

                        toggleBtn.addEventListener('click', (e) => {
                            if (e.ctrlKey) {
                                e.preventDefault(); // Prevent default click action
                                createStateSelectionPanel(toggleBtn!, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
                            } else {
                                handleToggleButtonClick(config);
                            }
                        });
                        return true; // Button inserted
                    }
                }
                return false; // Button not inserted
            };

            if (!findAndInsertFixedButton()) {
                const observer = new MutationObserver((mutations, obs) => {
                    console.log('OICPP SampleTester: MutationObserver - DOM 变化检测 (Luogu 固定状态)。');
                    if (findAndInsertFixedButton()) {
                        obs.disconnect(); // Button inserted, stop observing
                    }
                    else {
                        console.log('OICPP SampleTester: initializeUI - 仍在等待 Luogu 目标元素 (固定状态)...');
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        } else { // floating state
            toggleBtn = createToggleButtonUI(); // This function already appends to body and sets fixed position
            // Load position from localStorage
            const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
            const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
            if (savedRight !== null && savedTop !== null) {
                toggleBtn.style.right = `${parseFloat(savedRight)}px`;
                toggleBtn.style.top = `${parseFloat(savedTop)}px`;
                console.log(`OICPP SampleTester: 已加载按钮位置 (Luogu 悬浮): right=${savedRight}, top=${savedTop}`);
            } else {
                toggleBtn.style.right = '10px';
                toggleBtn.style.top = '10px';
                console.log('OICPP SampleTester: 已设置默认按钮位置 (Luogu 悬浮)。');
            }
            const toggleBtnDraggable = makeDraggable(toggleBtn, toggleBtn);
            toggleBtn.addEventListener('click', (e) => {
                if (e.ctrlKey) {
                    e.preventDefault(); // Prevent default click action
                    createStateSelectionPanel(toggleBtn, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
                } else if (toggleBtnDraggable.getIsMoved()) {
                    e.preventDefault();
                    console.log('OICPP SampleTester: initializeUI - 切换按钮被拖动，阻止点击事件 (Luogu)。');
                }
                else {
                    handleToggleButtonClick(config);
                }
            });
            console.log('OICPP SampleTester: initializeUI - Luogu 按钮 (悬浮) 已插入。');
        }
    };

    const setupAtcoderButton: SetupButtonFunction = (state) => {
        // Remove existing button if any
        let existingBtn = document.getElementById(TOGGLE_BTN_ID);
        if (existingBtn) {
            existingBtn.remove();
        }

        let toggleBtn: HTMLElement; // Explicitly declare as HTMLElement

        if (state === 'fixed') {
            const findAndInsertFixedButton = () => {
                let targetElement = document.querySelector('li.dropdown'); // Changed selector
                if (targetElement) {
                    const parentDiv = targetElement.parentElement;
                    if (parentDiv) {
                        parentDiv.style.display = 'flex';
                        parentDiv.style.alignItems = 'center';

                        toggleBtn = document.createElement('button');
                        toggleBtn.id = TOGGLE_BTN_ID;
                        toggleBtn.innerHTML = '发送至 OICPP <span id="cooldownCountdown" style="display:none; margin-left: 5px;"></span>';
                        toggleBtn.title = '抓取样例并发送到 OICPP';
                        toggleBtn.style.cssText = `
                            background-color: #007bff;
                            color: white;
                            border: none;
                            padding: 8px 10px;
                            border-radius: 4px;
                            z-index: 10001;
                            cursor: pointer;
                            font-size: 18px;
                            line-height: 1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 10px;
                        `;
                        targetElement.before(toggleBtn);
                        console.log('OICPP SampleTester: initializeUI - Atcoder 按钮 (固定) 已插入。');

                        toggleBtn.addEventListener('click', (e) => {
                            if (e.ctrlKey) {
                                e.preventDefault(); // Prevent default click action
                                createStateSelectionPanel(toggleBtn!, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
                            } else {
                                handleToggleButtonClick(config);
                            }
                        });
                        return true; // Button inserted
                    }
                }
                return false; // Button not inserted
            };

            if (!findAndInsertFixedButton()) {
                const observer = new MutationObserver((mutations, obs) => {
                    console.log('OICPP SampleTester: MutationObserver - DOM 变化检测 (Atcoder 固定状态)。');
                    if (findAndInsertFixedButton()) {
                        obs.disconnect(); // Button inserted, stop observing
                    }
                    else {
                        console.log('OICPP SampleTester: initializeUI - 仍在等待 Atcoder 目标元素 (固定状态)...');
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        } else { // floating state
            toggleBtn = createToggleButtonUI(); // This function already appends to body and sets fixed position
            // Load position from localStorage
            const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
            const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
            if (savedRight !== null && savedTop !== null) {
                toggleBtn.style.right = `${parseFloat(savedRight)}px`;
                toggleBtn.style.top = `${parseFloat(savedTop)}px`;
                console.log(`OICPP SampleTester: 已加载按钮位置 (Atcoder 悬浮): right=${savedRight}, top=${savedTop}`);
            } else {
                toggleBtn.style.right = '10px';
                toggleBtn.style.top = '10px';
                console.log('OICPP SampleTester: 已设置默认按钮位置 (悬浮)。');
            }
            const toggleBtnDraggable = makeDraggable(toggleBtn, toggleBtn);
            toggleBtn.addEventListener('click', (e) => {
                if (e.ctrlKey) {
                    e.preventDefault(); // Prevent default click action
                    createStateSelectionPanel(toggleBtn, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
                } else if (toggleBtnDraggable.getIsMoved()) {
                    e.preventDefault();
                    console.log('OICPP SampleTester: initializeUI - 切换按钮被拖动，阻止点击事件 (Atcoder)。');
                }
                else {
                    handleToggleButtonClick(config);
                }
            });
            console.log('OICPP SampleTester: initializeUI - Atcoder 按钮 (悬浮) 已插入。');
        }
    };

    const setupCodeforcesButton: SetupButtonFunction = (state) => {
        // Remove existing button if any
        let existingBtn = document.getElementById(TOGGLE_BTN_ID);
        if (existingBtn) {
            existingBtn.remove();
        }

        let toggleBtn: HTMLElement; // Explicitly declare as HTMLElement

        if (state === 'fixed') {
            const findAndInsertFixedButton = () => {
                let targetElement = document.querySelector('div.lang-chooser');
                if (targetElement) {
                    const parentDiv = targetElement.parentElement;
                    if (parentDiv) {
                        parentDiv.style.display = 'flex';
                        parentDiv.style.alignItems = 'center';

                        toggleBtn = document.createElement('button');
                        toggleBtn.id = TOGGLE_BTN_ID;
                        toggleBtn.innerHTML = '发送至 OICPP <span id="cooldownCountdown" style="display:none; margin-left: 5px;"></span>';
                        toggleBtn.title = '抓取样例并发送到 OICPP';
                        toggleBtn.style.cssText = `
                            background-color: #007bff;
                            color: white;
                            border: none;
                            padding: 8px 10px;
                            border-radius: 4px;
                            z-index: 10001;
                            cursor: pointer;
                            font-size: 18px;
                            line-height: 1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 10px;
                        `;
                        const buttonWrapper = document.createElement('div');
                        buttonWrapper.style.cssText = `
                            display: inline-block;
                            margin-right: 10px;
                        `;
                        buttonWrapper.appendChild(toggleBtn);
                        targetElement.prepend(buttonWrapper);
                        console.log('OICPP SampleTester: initializeUI - Codeforces 按钮 (固定) 已插入。');

                        toggleBtn.addEventListener('click', (e) => {
                            if (e.ctrlKey) {
                                e.preventDefault(); // Prevent default click action
                                createStateSelectionPanel(toggleBtn!, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
                            } else {
                                handleToggleButtonClick(config);
                            }
                        });
                        return true; // Button inserted
                    }
                }
                return false; // Button not inserted
            };

            if (!findAndInsertFixedButton()) {
                const observer = new MutationObserver((mutations, obs) => {
                    console.log('OICPP SampleTester: MutationObserver - DOM 变化检测 (Codeforces 固定状态)。');
                    if (findAndInsertFixedButton()) {
                        obs.disconnect(); // Button inserted, stop observing
                    }
                    else {
                        console.log('OICPP SampleTester: initializeUI - 仍在等待 Codeforces 目标元素 (固定状态)...');
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        } else { // floating state
            toggleBtn = createToggleButtonUI(); // This function already appends to body and sets fixed position
            // Load position from localStorage
            const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
            const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
            if (savedRight !== null && savedTop !== null) {
                toggleBtn.style.right = `${parseFloat(savedRight)}px`;
                toggleBtn.style.top = `${parseFloat(savedTop)}px`;
                console.log(`OICPP SampleTester: 已加载按钮位置 (Codeforces 悬浮): right=${savedRight}, top=${savedTop}`);
            } else {
                toggleBtn.style.right = '10px';
                toggleBtn.style.top = '10px';
                console.log('OICPP SampleTester: 已设置默认按钮位置 (悬浮)。');
            }
            const toggleBtnDraggable = makeDraggable(toggleBtn, toggleBtn);
            toggleBtn.addEventListener('click', (e) => {
                if (e.ctrlKey) {
                    e.preventDefault(); // Prevent default click action
                    createStateSelectionPanel(toggleBtn, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
                } else if (toggleBtnDraggable.getIsMoved()) {
                    e.preventDefault();
                    console.log('OICPP SampleTester: initializeUI - 切换按钮被拖动，阻止点击事件 (Codeforces)。');
                }
                else {
                    handleToggleButtonClick(config);
                }
            });
            console.log('OICPP SampleTester: initializeUI - Codeforces 按钮 (悬浮) 已插入。');
        }
    };

    // 根据 hostname 调用相应的 setup 函数
    if (hostname === 'htoj.com.cn') {
        let currentHtojButtonState = localStorage.getItem(config.buttonStateKey);
        let htojButtonState: 'fixed' | 'floating' = 'fixed';
        if (currentHtojButtonState === 'fixed' || currentHtojButtonState === 'floating') {
            htojButtonState = currentHtojButtonState;
        }
        setupHtojButton(htojButtonState);
    } else if (hostname === 'www.luogu.com.cn' || hostname === 'luogu.com.cn') {
        let currentLuoguButtonState = localStorage.getItem(config.buttonStateKey);
        let luoguButtonState: 'fixed' | 'floating' = 'fixed';
        if (currentLuoguButtonState === 'fixed' || currentLuoguButtonState === 'floating') {
            luoguButtonState = currentLuoguButtonState;
        }
        setupLuoguButton(luoguButtonState);
    } else if (hostname === 'atcoder.jp') {
        let currentAtcoderButtonState = localStorage.getItem(config.buttonStateKey);
        let atcoderButtonState: 'fixed' | 'floating' = 'fixed';
        if (currentAtcoderButtonState === 'fixed' || currentAtcoderButtonState === 'floating') {
            atcoderButtonState = currentAtcoderButtonState;
        }
        setupAtcoderButton(atcoderButtonState);
    } else if (hostname === 'codeforces.com') {
        let currentCodeforcesButtonState = localStorage.getItem(config.buttonStateKey);
        let codeforcesButtonState: 'fixed' | 'floating' = 'fixed';
        if (currentCodeforcesButtonState === 'fixed' || currentCodeforcesButtonState === 'floating') {
            codeforcesButtonState = currentCodeforcesButtonState;
        }
        setupCodeforcesButton(codeforcesButtonState);
    } else {
        // Default behavior for other domains
        let currentToggleBtn = document.getElementById(TOGGLE_BTN_ID);
        if (!currentToggleBtn) {
            console.log('OICPP SampleTester: initializeUI - 未找到切换按钮，正在创建。');
            currentToggleBtn = createToggleButtonUI();
        }

        // 尝试从 localStorage 加载位置
        const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X); // 现在 X 存储的是 right
        const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);   // 现在 Y 存储的是 top

        if (savedRight !== null && savedTop !== null) {
            let right = parseFloat(savedRight);
            let top = parseFloat(savedTop);
            const clampedPosition = clampButtonPosition(currentToggleBtn, right, top);
            currentToggleBtn.style.right = `${clampedPosition.right}px`;
            currentToggleBtn.style.top = `${clampedPosition.top}px`;
            console.log(`OICPP SampleTester: 已加载按钮位置: right=${clampedPosition.right}, top=${clampedPosition.top}`);
        } else {
            // 如果没有保存的位置，则设置默认位置
            const defaultRight = 10;
            const defaultTop = 10;
            const clampedPosition = clampButtonPosition(currentToggleBtn, defaultRight, defaultTop);
            currentToggleBtn.style.right = `${clampedPosition.right}px`;
            currentToggleBtn.style.top = `${clampedPosition.top}px`;
            console.log('OICPP SampleTester: 已设置默认按钮位置。');
        }

        const toggleBtnDraggable = makeDraggable(currentToggleBtn, currentToggleBtn);
        currentToggleBtn.addEventListener('click', (e) => {
            if (e.ctrlKey) {
                e.preventDefault(); // Prevent default click action
                createStateSelectionPanel(currentToggleBtn, config, setupHtojButton, setupLuoguButton, setupAtcoderButton, setupCodeforcesButton);
            } else if (toggleBtnDraggable.getIsMoved()) {
                e.preventDefault();
                console.log('OICPP SampleTester: initializeUI - 切换按钮被拖动，阻止点击事件。');
                return;
            }
            handleToggleButtonClick(config);
        });
    }

    // 如果之前未显示过指引，则启动指引
    const guideShown = await window.GM_getValue(GUIDE_MAIN_PAGE_STORAGE_KEY, false);
    if (!guideShown) {
        console.log('OICPP SampleTester: initializeUI - 指引未显示过，正在启动指引。');
        startGuide(false, GUIDE_MAIN_PAGE_STORAGE_KEY);
    } else {
        console.log('OICPP SampleTester: initializeUI - 指引已显示。');
    }

    // 添加窗口大小调整事件监听器
    window.addEventListener('resize', () => {
        const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
        const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
        const toggleBtn = document.getElementById(TOGGLE_BTN_ID);

        if (toggleBtn && savedRight !== null && savedTop !== null) {
            let right = parseFloat(savedRight);
            let top = parseFloat(savedTop);
            const clampedPosition = clampButtonPosition(toggleBtn, right, top);
            toggleBtn.style.right = `${clampedPosition.right}px`;
            toggleBtn.style.top = `${clampedPosition.top}px`;
            console.log(`OICPP SampleTester: 窗口大小调整，重新应用按钮位置: right=${clampedPosition.right}, top=${clampedPosition.top}`);
        } else if (toggleBtn) {
            // 如果没有保存的位置，则在调整大小时应用默认位置
            const defaultRight = 10;
            const defaultTop = 10;
            const clampedPosition = clampButtonPosition(toggleBtn, defaultRight, defaultTop);
            toggleBtn.style.right = `${clampedPosition.right}px`;
            toggleBtn.style.top = `${clampedPosition.top}px`;
            console.log('OICPP SampleTester: 窗口大小调整，设置默认按钮位置。');
        }
    });
}
