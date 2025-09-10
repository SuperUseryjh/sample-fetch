// ==UserScript==
// @name         OICPP sampleTester
// @namespace    https://oicpp.mywwzh.top/
// @version      1.0.1
// @description  从 OJ 平台获取题目样例并发送到 OICPP
// @author       Mr_Onion & mywwzh
// @match        https://luogu.com.cn/*
// @match        https://www.luogu.com.cn/*
// @match        https://htoj.com.cn/*
// @match        https://atcoder.jp/*
// @match        https://codeforces.com/*
// @grant        GM_xmlhttpRequest
// @connect      http://127.0.0.1:20030
// ==/UserScript==

(function() {
    'use strict';
    console.log('OICPP sampleTester: Tampermonkey script loaded.');

    // --- 常量 ---
    const API_URL = "http://127.0.0.1:20030/createNewProblem";
    const PANEL_ID = 'fetchProblemPanel';
    const TOGGLE_BTN_ID = 'fetchProblemToggleBtn';
    const TEMP_STATUS_ID = 'fetchProblemTempStatus';
    const DRAG_THRESHOLD = 5; // 拖动阈值，小于此值视为点击
    const COOLDOWN_DURATION_MS = 3000; // 5秒冷却时间

    // 指引常量
    const GUIDE_POPOVER_ID = 'fetchProblemGuidePopover';
    const GUIDE_OVERLAY_ID = 'fetchProblemGuideOverlay';
    const GUIDE_STORAGE_KEY = 'fetchProblemGuideShown';
    const LOCAL_STORAGE_POS_X = 'fetchProblemToggleBtnPosX';
    const LOCAL_STORAGE_POS_Y = 'fetchProblemToggleBtnPosY';

    let isCooldownActive = false; // 冷却状态变量
    let cooldownIntervalId = null; // 用于存储倒计时 interval ID

    const DOMAIN_CONFIG = {
        'luogu.com.cn': {
            ojName: 'Luogu',
            codeSelectors: ['pre.lfe-code'],
            problemNameSelector: 'h1.lfe-h1'
        },
        'www.luogu.com.cn': {
            ojName: 'Luogu',
            codeSelectors: ['pre.lfe-code'],
            problemNameSelector: 'h1.lfe-h1'
        },
        'htoj.com.cn': {
            ojName: 'Hetao',
            codeSelectors: ['div.md-editor-code pre code span.md-editor-code-block'],
            problemNameSelector: 'h3.text-xl.font-bold.text-colorText',
            specialProblemNameExtraction: (element) => {
                const titleSpans = element.querySelectorAll('span');
                if (titleSpans.length >= 2) {
                    const pid = titleSpans[0].textContent.trim();
                    const title = titleSpans[1].textContent.trim();
                    return `${pid} ${title}`.trim();
                } else if (titleSpans.length === 1) {
                    return titleSpans[0].textContent.trim();
                }
                return '';
            },

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
                const clonedTitle = element.cloneNode(true);
                const linkElement = clonedTitle.querySelector('a.btn');
                if (linkElement) {
                    linkElement.remove();
                }
                return clonedTitle.textContent.trim();
            }
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
                return element.textContent.trim();
            }
        }
    };

    // --- 指引步骤 ---
    const guideSteps = [
        {
            selector: `#${TOGGLE_BTN_ID}`,
            title: '重要：确认 OICPP 运行',
            description: '本工具需要本地运行的 OICPP 服务。请确保您的 OICPP 已启动，否则功能将无法正常工作。'
        },
        {
            selector: `#${TOGGLE_BTN_ID}`,
            title: '可拖动的按钮',
            description: '这个蓝色的下载按钮可以随意拖动到您喜欢的位置，方便操作。'
        },
        {
            selector: `#${TOGGLE_BTN_ID}`,
            title: '点击下载样例',
            description: '点击此按钮，脚本将自动抓取当前页面的题目样例，并发送到 OICPP。请尝试点击它！'
        }
    ];
    let currentGuideStep = 0;

    // --- 辅助函数 ---

    /**
     * 根据域名配置从当前页面提取代码片段。
     * @returns {Array<Object>} 包含成对样例对象的数组。
     */
    function extractCodeSnippets() {
        console.log('OICPP sampleTester: extractCodeSnippets - 开始提取代码片段。');
        const rawSnippets = [];
        const hostname = window.location.hostname;
        const config = DOMAIN_CONFIG[hostname];

        if (!config) {
            console.log('OICPP sampleTester: extractCodeSnippets - 域名无特定配置，使用默认选择器。');
            // 如果没有特定配置，则为其他域名使用默认回退
            document.querySelectorAll('pre.syntax-hl code').forEach(element => {
                rawSnippets.push(element.textContent);
            });
        } else {
            console.log('OICPP sampleTester: extractCodeSnippets - 使用域名特定配置:', config);
            config.codeSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(element => {
                    if (config.codeforcesLineExtractor && (hostname === 'codeforces.com')) {
                        rawSnippets.push(config.codeforcesLineExtractor(element));
                    } else {
                        rawSnippets.push(element.textContent.trim());
                    }
                });
            });
        }
        console.log('OICPP sampleTester: extractCodeSnippets - 找到的原始片段:', rawSnippets);

        const pairedSamples = [];
        for (let i = 0; i < rawSnippets.length; i += 2) {
            const inputContent = rawSnippets[i];
            const outputContent = rawSnippets[i + 1] || ""; // 处理奇数个片段

            pairedSamples.push({
                id: (i / 2) + 1, // 每对的ID
                input: inputContent,
                output: outputContent,
                timeLimit: 1000 // 默认时间限制
            });
        }
        console.log('OICPP sampleTester: extractCodeSnippets - 成对样例:', pairedSamples);
        return pairedSamples;
    }

    /**
     * 根据域名配置从当前页面获取题目名称。
     * @returns {string} 提取的题目名称。
     */
    function getProblemName() {
        console.log('OICPP sampleTester: getProblemName - 开始提取题目名称。');
        const hostname = window.location.hostname;
        const config = DOMAIN_CONFIG[hostname];

        if (!config || !config.problemNameSelector) {
            console.log('OICPP sampleTester: getProblemName - 未找到配置或题目名称选择器。');
            return '';
        }

        const problemTitleElement = document.querySelector(config.problemNameSelector);
        if (problemTitleElement) {
            let problemName;
            if (config.specialProblemNameExtraction) {
                problemName = config.specialProblemNameExtraction(problemTitleElement);
                console.log('OICPP sampleTester: getProblemName - 使用特殊提取方法。名称:', problemName);
            } else {
                problemName = problemTitleElement.textContent.trim();
                console.log('OICPP sampleTester: getProblemName - 使用默认提取方法。名称:', problemName);
            }
            return problemName;
        }
        console.log('OICPP sampleTester: getProblemName - 未找到题目标题元素。');
        return '';
    }

    /**
     * 将数据发送到本地API。
     * @param {Object} payload - 要发送的数据。
     * @param {HTMLElement} statusMessageElement - 用于更新状态消息的元素。
     */
    function sendProblemToAPI(payload, statusMessageElement) {
        console.log('OICPP sampleTester: sendProblemToAPI - 正在向API发送数据:', payload);
        statusMessageElement.style.color = 'blue';
        statusMessageElement.textContent = '正在提取代码并发送请求...';

        GM_xmlhttpRequest({
            method: "POST",
            url: API_URL,
            headers: {
                "Content-Type": "application/json"
            },
            data: JSON.stringify(payload),
            onload: function(response) {
                console.log('OICPP sampleTester: sendProblemToAPI - 收到API响应。状态:', response.status, '响应文本:', response.responseText);
                try {
                    const data = JSON.parse(response.responseText);
                    if (response.status === 200) {
                        statusMessageElement.style.color = 'green';
                        statusMessageElement.textContent = `成功: ${data.message}`;
                        console.log('OICPP sampleTester: sendProblemToAPI - 成功:', data.message);
                    } else {
                        let errorMessage = `错误 (${response.status}): ${data.message || '未知错误'}`;
                        if (data.invalidField) {
                            errorMessage += ` (字段: ${data.invalidField})`;
                        }
                        alert(errorMessage);
                        statusMessageElement.style.color = 'red';
                        statusMessageElement.textContent = errorMessage;
                        console.error('OICPP sampleTester: sendProblemToAPI - API错误:', errorMessage, '数据:', data);
                    }
                } catch (e) {
                    alert(`请求成功，但解析响应失败: ${e.message}`);
                    statusMessageElement.style.color = 'red';
                    statusMessageElement.textContent = `请求成功，但解析响应失败: ${e.message}`;
                    console.error('OICPP sampleTester: sendProblemToAPI - JSON解析错误:', e.message, '响应文本:', response.responseText);
                }
            },
            onerror: function(error) {
                alert(`请求失败: ${error.statusText || error.responseText || '网络错误'}。请确认OICPP是否正在运行。`);
                statusMessageElement.style.color = 'red';
                statusMessageElement.textContent = `请求失败: ${error.statusText || error.responseText || '网络错误'}。请确认OICPP是否正在运行。`;
                console.error('OICPP sampleTester: GM_xmlhttpRequest 错误:', error);
            }
        });
    }

    /**
     * 使元素可拖动。
     * @param {HTMLElement} element - 要使其可拖动的元素。
     * @param {HTMLElement} handle - 用于启动拖动的句柄元素。
     */
    function makeDraggable(element, handle) {
        let isDragging = false;
        let isMoved = false;
        let startX, startY;
        let initialMouseX, initialMouseY;
        let initialElementRight, initialElementTop;

        handle.addEventListener('mousedown', (e) => {
            isDragging = true;
            isMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;

            // 获取当前元素的 right 和 top 样式值，如果未设置则默认为 0
            initialElementRight = parseFloat(element.style.right) || 0;
            initialElementTop = parseFloat(element.style.top) || 0;

            if (element.id === TOGGLE_BTN_ID) {
                element.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (element.id === TOGGLE_BTN_ID) {
                element.style.cursor = 'grab';
                if (isMoved) {
                    // 保存最终的 right 和 top 样式值
                    const finalRight = parseFloat(element.style.right);
                    const finalTop = parseFloat(element.style.top);
                    localStorage.setItem(LOCAL_STORAGE_POS_X, finalRight);
                    localStorage.setItem(LOCAL_STORAGE_POS_Y, finalTop);
                    console.log(`OICPP sampleTester: Button position saved: right=${finalRight}, top=${finalTop}`);
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();

                const dx = e.clientX - initialMouseX;
                const dy = e.clientY - initialMouseY;

                // 计算新的 right 和 top 值
                const newRight = initialElementRight - dx;
                const newTop = initialElementTop + dy;

                element.style.right = `${newRight}px`;
                element.style.top = `${newTop}px`;

                // 检查鼠标是否移动超过阈值
                if (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD) {
                    isMoved = true;
                }
            }
        });

        return { getIsMoved: () => isMoved };
    }

    // --- 指引函数 ---

    /**
     * 创建并附加指引弹出框UI。
     * @returns {HTMLElement} 创建的弹出框元素。
     */
    function createGuidePopover() {
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
    function createHighlightOverlay() {
        let overlay = document.getElementById(GUIDE_OVERLAY_ID);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = GUIDE_OVERLAY_ID;
            overlay.style.cssText = `
                position: absolute;
                background-color: rgba(0, 123, 255, 0.2); /* 半透明蓝色 */
                border: 2px solid #007bff;
                border-radius: 5px;
                z-index: 99999;
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
    function positionPopover(popover, targetElement) {
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
     * 显示特定的指引步骤。
     * @param {number} stepIndex - 要显示的步骤索引。
     */
    function showGuideStep(stepIndex) {
        if (stepIndex >= guideSteps.length) {
            skipGuide();
            return;
        }

        currentGuideStep = stepIndex;
        const step = guideSteps[currentGuideStep];
        const targetElement = document.querySelector(step.selector);

        if (!targetElement) {
            console.warn(`指引: 未找到步骤 ${stepIndex} 的目标元素: ${step.selector}`);
            nextGuideStep(); // 如果未找到元素，则跳过此步骤
            return;
        }

        const popover = createGuidePopover();
        const overlay = createHighlightOverlay();

        // 更新弹出框内容
        popover.querySelector('h4').textContent = step.title;
        popover.querySelector('p').textContent = step.description;

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
            positionPopover(popover, targetElement);
            popover.style.display = 'block';

            // 在弹出框可见并定位后附加事件监听器
            const nextBtn = popover.querySelector('#guideNextBtn');
            const skipBtn = popover.querySelector('#guideSkipBtn');

            // 移除现有监听器以防止重复
            nextBtn.removeEventListener('click', nextGuideStep);
            skipBtn.removeEventListener('click', skipGuide);

            nextBtn.addEventListener('click', nextGuideStep);
            skipBtn.addEventListener('click', skipGuide);

            // 更新按钮文本
            if (currentGuideStep === guideSteps.length - 1) {
                nextBtn.textContent = '完成';
            } else {
                nextBtn.textContent = '下一步';
            }
        }, 300); // 给滚动动画一些时间
    }

    /**
     * 前进到下一个指引步骤。
     */
    function nextGuideStep() {
        currentGuideStep++;
        showGuideStep(currentGuideStep);
    }

    /**
     * 隐藏指引并标记为已显示。
     */
    function skipGuide() {
        const popover = document.getElementById(GUIDE_POPOVER_ID);
        const overlay = document.getElementById(GUIDE_OVERLAY_ID);
        if (popover) popover.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
    }

    /**
     * 启动交互式指引。
     */
    function startGuide() {
        if (localStorage.getItem(GUIDE_STORAGE_KEY) === 'true') {
            return; // 指引已显示
        }

        const shouldShowGuide = confirm('貌似你是第一次使用 OICPP 样例抓取呢，要看看新手教程吗');

        if (shouldShowGuide) {
            // 创建弹出框，但暂不附加监听器
            createGuidePopover(); // 确保弹出框存在，以便 showGuideStep 找到它
            showGuideStep(0);
        } else {
            skipGuide(); // 用户选择不看指引
        }
    }

    // --- UI 函数 ---

    /**
     * 创建主面板UI。
     * @returns {HTMLElement} 创建的面板元素。
     */
    function createPanelUI() {
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
    function createToggleButtonUI() {
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
     * 创建并附加一个临时状态消息元素到body。
     * @returns {HTMLElement} 创建的状态消息元素。
     */
    function createTemporaryStatusMessage() {
        let statusDiv = document.getElementById(TEMP_STATUS_ID);
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = TEMP_STATUS_ID;
            statusDiv.style.cssText = `
                position: fixed;
                top: 50px;
                right: 10px;
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
     * 初始化UI和事件监听器。
     */
    function initializeUI() {
        console.log('OICPP sampleTester: initializeUI - 正在初始化UI。');
        const hostname = window.location.hostname;
        const config = DOMAIN_CONFIG[hostname];
        console.log('OICPP sampleTester: initializeUI - 当前主机名:', hostname, '配置:', config);

        let panel = document.getElementById(PANEL_ID);
        let toggleBtn = document.getElementById(TOGGLE_BTN_ID);

        // 对于所有域名，创建并管理切换按钮
        if (!toggleBtn) {
            console.log('OICPP sampleTester: initializeUI - 未找到切换按钮，正在创建。');
            toggleBtn = createToggleButtonUI();

            // 尝试从 localStorage 加载位置
            const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X); // 现在 X 存储的是 right
            const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);   // 现在 Y 存储的是 top

            if (savedRight !== null && savedTop !== null) {
                const right = parseFloat(savedRight);
                const top = parseFloat(savedTop);
                toggleBtn.style.right = `${right}px`;
                toggleBtn.style.top = `${top}px`;
                console.log(`OICPP sampleTester: Loaded button position: right=${right}, top=${top}`);
            } else {
                // 如果没有保存的位置，则设置默认位置
                toggleBtn.style.right = '10px';
                toggleBtn.style.top = '10px';
                console.log('OICPP sampleTester: Set default button position.');
            }
        }
        const toggleBtnDraggable = makeDraggable(toggleBtn, toggleBtn);
        toggleBtn.addEventListener('click', (e) => {
            if (toggleBtnDraggable.getIsMoved()) {
                e.preventDefault(); // 如果是拖动，则阻止点击
                console.log('OICPP sampleTester: initializeUI - 切换按钮被拖动，阻止点击事件。');
                return;
            }
            handleToggleButtonClick(config);
        });

        // 如果之前未显示过指引，则启动指引
        if (localStorage.getItem(GUIDE_STORAGE_KEY) !== 'true') {
            console.log('OICPP sampleTester: initializeUI - 指引未显示过，正在启动指引。');
            startGuide();
        } else {
            console.log('OICPP sampleTester: initializeUI - 指引已显示。');
        }

        // 添加窗口大小调整事件监听器
        window.addEventListener('resize', () => {
            const savedRight = localStorage.getItem(LOCAL_STORAGE_POS_X);
            const savedTop = localStorage.getItem(LOCAL_STORAGE_POS_Y);
            const toggleBtn = document.getElementById(TOGGLE_BTN_ID);

            if (toggleBtn && savedRight !== null && savedTop !== null) {
                const right = parseFloat(savedRight);
                const top = parseFloat(savedTop);
                toggleBtn.style.right = `${right}px`;
                toggleBtn.style.top = `${top}px`;
                console.log(`OICPP sampleTester: Resized, re-applied button position: right=${right}, top=${top}`);
            } else if (toggleBtn) {
                // 如果没有保存的位置，则在调整大小时应用默认位置
                toggleBtn.style.right = '10px';
                toggleBtn.style.top = '10px';
                console.log('OICPP sampleTester: Resized, set default button position.');
            }
        });
    }

    /**
     * 为面板设置事件监听器。
     * @param {HTMLElement} panel - 面板元素。
     * @param {Object} config - 域名配置。
     */
    function setupPanelEventListeners(panel, config) {
        const ojInput = panel.querySelector('#ojInput');
        const problemNameInput = panel.querySelector('#problemNameInput');
        const panelHeader = panel.querySelector(`#${PANEL_ID}Header`);
        const panelContent = panel.querySelector(`#${PANEL_ID}Content`);
        const closeBtn = panel.querySelector(`#${PANEL_ID}CloseBtn`);
        const createProblemBtn = panel.querySelector('#createProblemBtn');
        const statusMessage = panel.querySelector('#statusMessage');

        // 元素错误检查
        if (!ojInput || !problemNameInput || !panelHeader || !panelContent || !closeBtn || !createProblemBtn || !statusMessage) {
            console.error('错误: 面板中未找到必要的UI元素。');
            return;
        }

        const panelDraggable = makeDraggable(panel, panelHeader);

        panelHeader.addEventListener('click', (e) => {
            if (panelDraggable.getIsMoved()) {
                e.preventDefault(); // 如果是拖动，则阻止点击
                return;
            }
            if (e.target.id !== `${PANEL_ID}CloseBtn`) {
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
    function populatePanelFields(panel, config) {
        const ojInput = panel.querySelector('#ojInput');
        const problemNameInput = panel.querySelector('#problemNameInput');
        const statusMessage = panel.querySelector('#statusMessage');

        if (config) {
            ojInput.value = config.ojName || '';
            problemNameInput.value = getProblemName();
            if (config.initialStatusMessage) {
                statusMessage.style.color = 'orange';
                statusMessage.textContent = config.initialStatusMessage;
            } else {
                statusMessage.textContent = ''; // 清除之前的消息
            }
        } else {
            ojInput.value = '';
            problemNameInput.value = '';
            statusMessage.textContent = '';
        }
    }

    /**
     * 处理点击按钮创建题目的逻辑。
     * 这用于完整的面板UI。
     * @param {HTMLInputElement} ojInput - OJ输入元素。
     * @param {HTMLInputElement} problemNameInput - 题目名称输入元素。
     * @param {HTMLElement} statusMessage - 状态消息元素。
     * @param {HTMLElement} panel - 面板元素。
     */
    async function handleCreateProblem(ojInput, problemNameInput, statusMessage, panel) {
        const oj = ojInput.value;
        let problemName = problemNameInput.value;
        if (problemName.length > 32) {
            console.warn('OICPP sampleTester: handleCreateProblem - 题目名称过长，已截断至32字符。');
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

        const payload = {
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
    async function handleToggleButtonClick(config) {
        console.log('OICPP sampleTester: handleToggleButtonClick - 切换按钮被点击。冷却状态:', isCooldownActive);
        const toggleBtn = document.getElementById(TOGGLE_BTN_ID);
        const cooldownCountdownSpan = toggleBtn.querySelector('#cooldownCountdown');
        const statusMessage = createTemporaryStatusMessage();

        if (isCooldownActive) {
            console.log('OICPP sampleTester: handleToggleButtonClick - 冷却中，阻止新请求。');
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
        cooldownIntervalId = setInterval(() => {
            timeLeft -= 1000;
            if (timeLeft <= 0) {
                clearInterval(cooldownIntervalId);
                isCooldownActive = false;
                toggleBtn.disabled = false;
                toggleBtn.style.cursor = 'grab';
                cooldownCountdownSpan.style.display = 'none';
                cooldownCountdownSpan.textContent = '';
                statusMessage.style.display = 'none'; // Clear any lingering status
            } else {
                cooldownCountdownSpan.textContent = `(${Math.ceil(timeLeft / 1000)}s)`;
            }
        }, 1000);


        statusMessage.style.display = 'block';

        const oj = config ? config.ojName : '';
        let problemName = getProblemName();
        if (problemName.length > 32) {
            console.warn('OICPP sampleTester: handleToggleButtonClick - 题目名称过长，已截断至32字符。');
            problemName = problemName.substring(0, 32);
        }

        if (!oj || !problemName) {
            statusMessage.style.color = 'red';
            statusMessage.textContent = 'OJ 或 题目名称无法自动获取，请手动操作或刷新页面。';
            alert('OJ 或 题目名称无法自动获取，请手动操作或刷新页面。');
            // Reset cooldown if there's an immediate error
            clearInterval(cooldownIntervalId);
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
            // Reset cooldown if there's an immediate error
            clearInterval(cooldownIntervalId);
            isCooldownActive = false;
            toggleBtn.disabled = false;
            toggleBtn.style.cursor = 'grab';
            cooldownCountdownSpan.style.display = 'none';
            cooldownCountdownSpan.textContent = '';
            return;
        }

        const payload = {
            OJ: oj,
            problemName: problemName,
            samples: samples
        };
        console.log('OICPP sampleTester: handleToggleButtonClick - 准备发送的数据:', payload);

        sendProblemToAPI(payload, statusMessage);

        // 几秒后自动隐藏状态消息
        setTimeout(() => {
            statusMessage.style.display = 'none';
            statusMessage.textContent = '';
        }, 5000);
    }

    // --- 主程序执行 ---
    initializeUI();
})();