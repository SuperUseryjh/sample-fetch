// ==UserScript==
// @name         Fetch Code and Create Problem
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Extracts code snippets from the current page and sends them to a local API to create a new problem.
// @author       Mr_Onion & mywwzh
// @match        https://luogu.com.cn/*
// @match        https://www.luogu.com.cn/*
// @match        https://htoj.com.cn/*
// @match        https://atcoder.jp/*
// @match        https://codeforces.com/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// ==/UserScript==

(function() {
    'use strict';

    // --- Constants ---
    const API_URL = "http://127.0.0.1:20030/createNewProblem";
    const PANEL_ID = 'fetchProblemPanel';
    const TOGGLE_BTN_ID = 'fetchProblemToggleBtn';
    const TEMP_STATUS_ID = 'fetchProblemTempStatus';
    const DRAG_THRESHOLD = 5; // Pixels to consider a drag, not a click
    const COOLDOWN_DURATION_MS = 5000; // 5 seconds cooldown

    // Guide Constants
    const GUIDE_POPOVER_ID = 'fetchProblemGuidePopover';
    const GUIDE_OVERLAY_ID = 'fetchProblemGuideOverlay';
    const GUIDE_STORAGE_KEY = 'fetchProblemGuideShown';

    let isCooldownActive = false; // Cooldown state variable
    let cooldownIntervalId = null; // To store the countdown interval ID

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

    // --- Guide Steps ---
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

    // --- Helper Functions ---

    /**
     * Extracts code snippets from the current page based on domain configuration.
     * @returns {Array<Object>} An array of paired sample objects.
     */
    function extractCodeSnippets() {
        const rawSnippets = [];
        const hostname = window.location.hostname;
        const config = DOMAIN_CONFIG[hostname];

        if (!config) {
            // Default fallback for other domains if no specific config
            document.querySelectorAll('pre.syntax-hl code').forEach(element => {
                rawSnippets.push(element.textContent);
            });
        } else {
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

        const pairedSamples = [];
        for (let i = 0; i < rawSnippets.length; i += 2) {
            const inputContent = rawSnippets[i];
            const outputContent = rawSnippets[i + 1] || ""; // Handle odd number of snippets

            pairedSamples.push({
                id: (i / 2) + 1, // ID for each pair
                input: inputContent,
                output: outputContent,
                timeLimit: 1000 // Default timeLimit
            });
        }
        return pairedSamples;
    }

    /**
     * Fetches the problem name from the current page based on domain configuration.
     * @returns {string} The extracted problem name.
     */
    function getProblemName() {
        const hostname = window.location.hostname;
        const config = DOMAIN_CONFIG[hostname];

        if (!config || !config.problemNameSelector) {
            return '';
        }

        const problemTitleElement = document.querySelector(config.problemNameSelector);
        if (problemTitleElement) {
            if (config.specialProblemNameExtraction) {
                return config.specialProblemNameExtraction(problemTitleElement);
            }
            return problemTitleElement.textContent.trim();
        }
        return '';
    }

    /**
     * Sends the payload to the local API.
     * @param {Object} payload - The data to send.
     * @param {HTMLElement} statusMessageElement - The element to update with status messages.
     */
    function sendProblemToAPI(payload, statusMessageElement) {
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
                try {
                    const data = JSON.parse(response.responseText);
                    if (response.status === 200) {
                        statusMessageElement.style.color = 'green';
                        statusMessageElement.textContent = `成功: ${data.message}`;
                    } else {
                        let errorMessage = `错误 (${response.status}): ${data.message || '未知错误'}`;
                        if (data.invalidField) {
                            errorMessage += ` (字段: ${data.invalidField})`;
                        }
                        alert(errorMessage);
                        statusMessageElement.style.color = 'red';
                        statusMessageElement.textContent = errorMessage;
                    }
                } catch (e) {
                    alert(`请求成功，但解析响应失败: ${e.message}`);
                    statusMessageElement.style.color = 'red';
                    statusMessageElement.textContent = `请求成功，但解析响应失败: ${e.message}`;
                }
            },
            onerror: function(error) {
                alert(`请求失败: ${error.statusText || error.responseText || '网络错误'}。请确认oicpp是否正在运行。`);
                statusMessageElement.style.color = 'red';
                statusMessageElement.textContent = `请求失败: ${error.statusText || error.responseText || '网络错误'}。请确认oicpp是否正在运行。`;
                console.error('GM_xmlhttpRequest 错误:', error);
            }
        });
    }

    /**
     * Makes an element draggable.
     * @param {HTMLElement} element - The element to make draggable.
     * @param {HTMLElement} handle - The handle element to initiate dragging.
     */
    function makeDraggable(element, handle) {
        let isDragging = false;
        let isMoved = false; // New flag to track if the element was dragged
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;
        let startX, startY; // To track initial mousedown position

        handle.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            startX = e.clientX;
            startY = e.clientY;
            isDragging = true;
            isMoved = false; // Reset moved flag on mousedown
            if (element.id === TOGGLE_BTN_ID) {
                element.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (element.id === TOGGLE_BTN_ID) {
                element.style.cursor = 'grab';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

                // Check if the mouse has moved beyond the threshold
                if (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD) {
                    isMoved = true;
                }
            }
        });

        // Return the isMoved state for click handlers to use
        return { getIsMoved: () => isMoved };
    }

    // --- Guide Functions ---

    /**
     * Creates and appends the guide popover UI.
     * @returns {HTMLElement} The created popover element.
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
                z-index: 2147483647; /* 确保在最顶层 */
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
     * Creates and appends a highlight overlay.
     * @returns {HTMLElement} The created overlay element.
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
     * Positions the popover relative to the target element.
     * @param {HTMLElement} popover - The guide popover element.
     * @param {HTMLElement} targetElement - The element to position relative to.
     */
    function positionPopover(popover, targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const popoverWidth = popover.offsetWidth;
        const popoverHeight = popover.offsetHeight;

        let top = targetRect.bottom + 10 + window.scrollY;
        let left = targetRect.left + window.scrollX;

        // Adjust if popover goes off screen to the right
        if (left + popoverWidth > window.innerWidth) {
            left = window.innerWidth - popoverWidth - 20; // 20px padding from right
        }
        // Adjust if popover goes off screen to the left
        if (left < 0) {
            left = 20; // 20px padding from left
        }

        // Adjust if popover goes off screen to the bottom
        if (top + popoverHeight > window.innerHeight + window.scrollY) {
            top = targetRect.top - popoverHeight - 10 + window.scrollY;
            if (top < window.scrollY) { // If still off screen, position at top of viewport
                top = window.scrollY + 20;
            }
        }

        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    }

    /**
     * Shows a specific guide step.
     * @param {number} stepIndex - The index of the step to show.
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
            console.warn(`Guide: Target element for step ${stepIndex} not found: ${step.selector}`);
            nextGuideStep(); // Skip this step if element not found
            return;
        }

        const popover = createGuidePopover();
        const overlay = createHighlightOverlay();

        // Update popover content
        popover.querySelector('h4').textContent = step.title;
        popover.querySelector('p').textContent = step.description;

        // Highlight target element
        const targetRect = targetElement.getBoundingClientRect();
        overlay.style.width = `${targetRect.width}px`;
        overlay.style.height = `${targetRect.height}px`;
        overlay.style.top = `${targetRect.top + window.scrollY}px`;
        overlay.style.left = `${targetRect.left + window.scrollX}px`;
        overlay.style.display = 'block';

        // Scroll to target element
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Position popover after scrolling
        setTimeout(() => {
            positionPopover(popover, targetElement);
            popover.style.display = 'block';

            // Attach event listeners AFTER popover is visible and positioned
            const nextBtn = popover.querySelector('#guideNextBtn');
            const skipBtn = popover.querySelector('#guideSkipBtn');

            // Remove existing listeners to prevent duplicates
            nextBtn.removeEventListener('click', nextGuideStep);
            skipBtn.removeEventListener('click', skipGuide);

            nextBtn.addEventListener('click', nextGuideStep);
            skipBtn.addEventListener('click', skipGuide);

            // Update button text
            if (currentGuideStep === guideSteps.length - 1) {
                nextBtn.textContent = '完成';
            } else {
                nextBtn.textContent = '下一步';
            }
        }, 300); // Give some time for scroll animation
    }

    /**
     * Advances to the next guide step.
     */
    function nextGuideStep() {
        currentGuideStep++;
        showGuideStep(currentGuideStep);
    }

    /**
     * Hides the guide and marks it as shown.
     */
    function skipGuide() {
        const popover = document.getElementById(GUIDE_POPOVER_ID);
        const overlay = document.getElementById(GUIDE_OVERLAY_ID);
        if (popover) popover.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
    }

    /**
     * Starts the interactive guide.
     */
    function startGuide() {
        if (localStorage.getItem(GUIDE_STORAGE_KEY) === 'true') {
            return; // Guide already shown
        }

        // Create popover but don't attach listeners yet
        createGuidePopover(); // Ensure popover exists for showGuideStep to find it

        showGuideStep(0);
    }

    // --- UI Functions ---

    /**
     * Creates the main panel UI.
     * @returns {HTMLElement} The created panel element.
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
            display: none; /* Default to hidden */
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
     * Creates the toggle button UI.
     * @returns {HTMLElement} The created toggle button element.
     */
    function createToggleButtonUI() {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = TOGGLE_BTN_ID;
        toggleBtn.innerHTML = '⬇️ <span id="cooldownCountdown" style="display:none; margin-left: 5px;"></span>'; // Added span for countdown
        toggleBtn.title = '抓取样例并发送到oicpp'; // Added title for accessibility
        toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            padding: 8px 10px; /* Adjusted padding for a more square look */
            border-radius: 4px;
            z-index: 10001;
            cursor: grab;
            font-size: 18px; /* Increased font size for icon visibility */
            line-height: 1; /* Ensure icon is vertically centered */
            display: flex; /* Use flex to align icon and countdown */
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(toggleBtn);
        return toggleBtn;
    }

    /**
     * Creates and appends a temporary status message element to the body.
     * @returns {HTMLElement} The created status message element.
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
     * Initializes the UI and event listeners.
     */
    function initializeUI() {
        const hostname = window.location.hostname;
        const config = DOMAIN_CONFIG[hostname];

        let panel = document.getElementById(PANEL_ID);
        let toggleBtn = document.getElementById(TOGGLE_BTN_ID);

        // For all domains, create and manage the toggle button
        if (!toggleBtn) {
            toggleBtn = createToggleButtonUI();
        }
        const toggleBtnDraggable = makeDraggable(toggleBtn, toggleBtn);
        toggleBtn.addEventListener('click', (e) => {
            if (toggleBtnDraggable.getIsMoved()) {
                e.preventDefault(); // Prevent click if it was a drag
                return;
            }
            handleToggleButtonClick(config);
        });

        // Start guide if not shown before
        if (localStorage.getItem(GUIDE_STORAGE_KEY) !== 'true') {
            startGuide();
        }
    }

    /**
     * Sets up event listeners for the panel.
     * @param {HTMLElement} panel - The panel element.
     * @param {Object} config - The domain configuration.
     */
    function setupPanelEventListeners(panel, config) {
        const ojInput = panel.querySelector('#ojInput');
        const problemNameInput = panel.querySelector('#problemNameInput');
        const panelHeader = panel.querySelector(`#${PANEL_ID}Header`);
        const panelContent = panel.querySelector(`#${PANEL_ID}Content`);
        const closeBtn = panel.querySelector(`#${PANEL_ID}CloseBtn`);
        const createProblemBtn = panel.querySelector('#createProblemBtn');
        const statusMessage = panel.querySelector('#statusMessage');

        // Error checking for elements
        if (!ojInput || !problemNameInput || !panelHeader || !panelContent || !closeBtn || !createProblemBtn || !statusMessage) {
            console.error('Error: Essential UI elements not found in panel.');
            return;
        }

        const panelDraggable = makeDraggable(panel, panelHeader);

        panelHeader.addEventListener('click', (e) => {
            if (panelDraggable.getIsMoved()) {
                e.preventDefault(); // Prevent click if it was a drag
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
                toggleBtn.style.display = 'block'; // Show toggle button if panel is closed
            }
        });

        createProblemBtn.addEventListener('click', () => handleCreateProblem(ojInput, problemNameInput, statusMessage, panel));

        // Populate fields initially
        populatePanelFields(panel, config);
    }

    /**
     * Populates the panel fields with domain-specific data.
     * @param {HTMLElement} panel - The panel element.
     * @param {Object} config - The domain configuration.
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
                statusMessage.textContent = ''; // Clear previous messages
            }
        } else {
            ojInput.value = '';
            problemNameInput.value = '';
            statusMessage.textContent = '';
        }
    }

    /**
     * Handles the logic for creating a problem when the button is clicked.
     * This is used for the full panel UI.
     * @param {HTMLInputElement} ojInput - The OJ input element.d
     * @param {HTMLInputElement} problemNameInput - The problem name input element.
     * @param {HTMLElement} statusMessage - The status message element.
     * @param {HTMLElement} panel - The panel element.
     */
    async function handleCreateProblem(ojInput, problemNameInput, statusMessage, panel) {
        const oj = ojInput.value;
        const problemName = problemNameInput.value;

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
     * Handles the logic for the toggle button click on non-HTOJ domains.
     * @param {Object} config - The domain configuration.
     */
    async function handleToggleButtonClick(config) {
        const toggleBtn = document.getElementById(TOGGLE_BTN_ID);
        const cooldownCountdownSpan = toggleBtn.querySelector('#cooldownCountdown');
        const statusMessage = createTemporaryStatusMessage();

        if (isCooldownActive) {
            statusMessage.style.color = 'orange';
            statusMessage.textContent = `请稍候，${Math.ceil(COOLDOWN_DURATION_MS / 1000)}秒后可再次发送。`;
            statusMessage.style.display = 'block';
            setTimeout(() => { statusMessage.style.display = 'none'; }, 3000); // Hide cooldown message after 3s
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
        const problemName = getProblemName();

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

        sendProblemToAPI(payload, statusMessage);

        // Automatically hide status message after a few seconds
        setTimeout(() => {
            statusMessage.style.display = 'none';
            statusMessage.textContent = '';
        }, 5000);
    }

    // --- Main Execution ---
    initializeUI();
})();


