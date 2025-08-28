// ==UserScript==
// @name         Fetch Code and Create Problem
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extracts code snippets from the current page and sends them to a local API to create a new problem.
// @author       Mr_Onion
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract code snippets from the current page
    function extractCodeSnippets() {
        const rawSnippets = [];
        const hostname = window.location.hostname;

        if (hostname === 'www.luogu.com.cn') {
            document.querySelectorAll('pre.lfe-code').forEach(element => {
                rawSnippets.push(element.textContent);
            });
        } else if (hostname === 'htoj.com.cn') {
            document.querySelectorAll('div.md-editor-code pre code span.md-editor-code-block').forEach(element => {
                rawSnippets.push(element.textContent.trim());
            });
        } else if (hostname === 'atcoder.jp') {
            document.querySelectorAll('pre[id^="pre-sample"]').forEach(element => {
                rawSnippets.push(element.textContent.trim());
            });
        } else if (hostname === 'codeforces.com') {
            document.querySelectorAll('div.input pre').forEach(element => {
                const lines = Array.from(element.querySelectorAll('div.test-example-line')).map(line => line.textContent);
                rawSnippets.push(lines.join('\n').trim());
            });
            document.querySelectorAll('div.output pre').forEach(element => {
                const lines = Array.from(element.querySelectorAll('div.test-example-line')).map(line => line.textContent);
                rawSnippets.push(lines.join('\n').trim());
            });
        } else {
            // Default fallback for other domains
            document.querySelectorAll('pre.syntax-hl code').forEach(element => {
                rawSnippets.push(element.textContent);
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

    // Function to create the UI
    function createUI() {
        const panel = document.createElement('div');
        panel.id = 'fetchProblemPanel';
        panel.style.position = 'fixed';
        panel.style.top = '10px';
        panel.style.right = '270px';
        panel.style.width = '250px';
        panel.style.backgroundColor = '#f8f9fa';
        panel.style.border = '1px solid #dee2e6';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        panel.style.zIndex = '10000';
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.fontSize = '14px';
        panel.style.color = '#343a40';
        panel.style.display = 'none'; // Default to hidden

        panel.innerHTML = `
            <div id="fetchProblemPanelHeader" style="background-color: #007bff; color: white; padding: 8px 12px; border-top-left-radius: 8px; border-top-right-radius: 8px; cursor: move; display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; font-size: 16px;">创建题目</h4>
                <button id="fetchProblemCloseBtn" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; line-height: 1; padding: 0;">&times;</button>
            </div>
            <div id="fetchProblemPanelContent" style="padding: 12px; display: none;">
                <label for="ojInput" style="display: block; margin-bottom: 4px; font-weight: bold;">OJ:</label>
                <input type="text" id="ojInput" value="Luogu" style="width: calc(100% - 10px); padding: 6px; margin-bottom: 10px; border: 1px solid #ced4da; border-radius: 4px;"><br>
                <label for="problemNameInput" style="display: block; margin-bottom: 4px; font-weight: bold;">题目名称:</label>
                <input type="text" id="problemNameInput" placeholder="P1001 A + B Problem" style="width: calc(100% - 10px); padding: 6px; margin-bottom: 15px; border: 1px solid #ced4da; border-radius: 4px;"><br>
                <button id="createProblemBtn" style="width: 100%; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 15px; font-weight: bold;">提取代码并创建题目</button>
                <div id="statusMessage" style="margin-top: 15px; color: green; text-align: center; font-size: 13px;"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // Set OJ field based on domain
        const ojInput = document.getElementById('ojInput');
        if (window.location.hostname === 'www.luogu.com.cn') {
            ojInput.value = 'Luogu';
        } else if (window.location.hostname === 'htoj.com.cn') {
            ojInput.value = 'Hetao';
        } else if (window.location.hostname === 'atcoder.jp') {
            ojInput.value = 'atcoder';
        } else if (window.location.hostname === 'codeforces.com') {
            ojInput.value = 'codeforces';
        }

        const panelHeader = document.getElementById('fetchProblemPanelHeader');
        const panelContent = document.getElementById('fetchProblemPanelContent');
        const closeBtn = document.getElementById('fetchProblemCloseBtn');
        const createProblemBtn = document.getElementById('createProblemBtn');
        const statusMessage = document.getElementById('statusMessage');

        // Toggle panel content visibility on header click
        panelHeader.addEventListener('click', (e) => {
            if (e.target.id !== 'fetchProblemCloseBtn') { // Don't toggle if close button is clicked
                panelContent.style.display = panelContent.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Close panel on close button click
        closeBtn.addEventListener('click', () => {
            panel.remove();
        });

        // Make panel draggable
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        panelHeader.addEventListener('mousedown', (e) => {
            if (e.target.id !== 'fetchProblemCloseBtn') {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            }
        });

        // Show panel on first interaction (e.g., a key press, or a specific event)
        // For now, let's make it visible by default for testing, then change to hidden
        // panel.style.display = 'block'; // For testing, remove later

        // Re-add the create problem button listener
        createProblemBtn.addEventListener('click', async () => {
            const oj = document.getElementById('ojInput').value;
            const problemName = document.getElementById('problemNameInput').value;

            if (!oj || !problemName) {
                statusMessage.style.color = 'red';
                statusMessage.textContent = 'OJ 和 题目名称不能为空！';
                return;
            }

            statusMessage.style.color = 'blue';
            statusMessage.textContent = '正在提取代码并发送请求...';

            const samples = extractCodeSnippets();

            if (samples.length === 0) {
                statusMessage.style.color = 'orange';
                statusMessage.textContent = '未找到任何 <code> 标签可提取。';
                return;
            }

            const payload = {
                OJ: oj,
                problemName: problemName,
                samples: samples
            };

            GM_xmlhttpRequest({
                method: "POST",
                url: "http://127.0.0.1:20030/createNewProblem",
                headers: {
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(payload),
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (response.status === 200) {
                            statusMessage.style.color = 'green';
                            statusMessage.textContent = `成功: ${data.message}`;
                        } else {
                            statusMessage.style.color = 'red';
                            statusMessage.textContent = `错误 (${response.status}): ${data.message || '未知错误'}`;
                            if (data.invalidField) {
                                statusMessage.textContent += ` (字段: ${data.invalidField})`;
                            }
                        }
                    } catch (e) {
                        statusMessage.style.color = 'red';
                        statusMessage.textContent = `请求成功，但解析响应失败: ${e.message}`;
                    }
                },
                onerror: function(error) {
                    statusMessage.style.color = 'red';
                    statusMessage.textContent = `请求失败: ${error.statusText || error.responseText || '网络错误'}。请确认oicpp是否正在运行。`;
                    console.error('GM_xmlhttpRequest 错误:', error);
                }
            });
        });

        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'fetchProblemToggleBtn';
        toggleBtn.textContent = '显示/隐藏面板';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.top = '10px';
        toggleBtn.style.right = '10px'; // Adjust position to not overlap with the panel
        toggleBtn.style.backgroundColor = '#6c757d';
        toggleBtn.style.color = 'white';
        toggleBtn.style.border = 'none';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.zIndex = '10001';
        toggleBtn.style.cursor = 'grab'; // Indicate it's draggable
        document.body.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('fetchProblemPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Make toggle button draggable
        let isBtnDragging = false;
        let btnCurrentX;
        let btnCurrentY;
        let btnInitialX;
        let btnInitialY;
        let btnXOffset = 0;
        let btnYOffset = 0;

        toggleBtn.addEventListener('mousedown', (e) => {
            btnInitialX = e.clientX - btnXOffset;
            btnInitialY = e.clientY - btnYOffset;
            isBtnDragging = true;
            toggleBtn.style.cursor = 'grabbing';
        });

        document.addEventListener('mouseup', () => {
            isBtnDragging = false;
            toggleBtn.style.cursor = 'grab';
        });

        document.addEventListener('mousemove', (e) => {
            if (isBtnDragging) {
                e.preventDefault();
                btnCurrentX = e.clientX - btnInitialX;
                btnCurrentY = e.clientY - btnInitialY;

                btnXOffset = btnCurrentX;
                btnYOffset = btnCurrentY;

                toggleBtn.style.transform = `translate3d(${btnCurrentX}px, ${btnCurrentY}px, 0)`;
            }
        });
    }

    // Initialize the UI when the document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createUI);
    } else {
        createUI();
    }
})();

