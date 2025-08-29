// ==UserScript==
// @name         Fetch Code and Create Problem
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Extracts code snippets from the current page and sends them to a local API to create a new problem.
// @author       Mr_Onion
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
            problemNameSelector: 'div.title'
        }
    };

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
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        handle.addEventListener('mousedown', (e) => {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
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
            }
        });
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
        toggleBtn.textContent = '抓取样例并发送到oicpp';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            z-index: 10001;
            cursor: grab;
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
                border-radius: 4px;
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
        makeDraggable(toggleBtn, toggleBtn);
        toggleBtn.addEventListener('click', () => handleToggleButtonClick(config));
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

        makeDraggable(panel, panelHeader);

        panelHeader.addEventListener('click', (e) => {
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
     * @param {HTMLInputElement} ojInput - The OJ input element.
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
        const statusMessage = createTemporaryStatusMessage();
        statusMessage.style.display = 'block';

        const oj = config ? config.ojName : '';
        const problemName = getProblemName();

        if (!oj || !problemName) {
            statusMessage.style.color = 'red';
            statusMessage.textContent = 'OJ 或 题目名称无法自动获取，请手动操作或刷新页面。';
            alert('OJ 或 题目名称无法自动获取，请手动操作或刷新页面。');
            return;
        }

        const samples = extractCodeSnippets();

        if (samples.length === 0) {
            statusMessage.style.color = 'red';
            statusMessage.textContent = '未找到任何 <code> 标签可提取。';
            alert('未找到任何 <code> 标签可提取。');
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


