// ==UserScript==
// @name         Fetch Code and Create Problem
// @namespace    http://tampermonkey.net/
// @version      1.0
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
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '10px';
        div.style.right = '10px';
        div.style.backgroundColor = 'white';
        div.style.border = '1px solid #ccc';
        div.style.padding = '10px';
        div.style.zIndex = '10000';
        div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        div.style.display = 'none'; // Default to hidden
        div.id = 'fetchProblemPanel'; // Add an ID for easy reference

        div.innerHTML = `
            <h3>创建题目</h3>
            <label for="ojInput">OJ:</label>
            <input type="text" id="ojInput" value="Luogu" style="width: 100px; margin-bottom: 5px;"><br>
            <label for="problemNameInput">题目名称:</label>
            <input type="text" id="problemNameInput" placeholder="P1001 A + B Problem" style="width: 150px; margin-bottom: 10px;"><br>
            <button id="createProblemBtn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; cursor: pointer;">提取代码并创建题目</button>
            <div id="statusMessage" style="margin-top: 10px; color: green;"></div>
        `;
        document.body.appendChild(div);

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

        document.getElementById('createProblemBtn').addEventListener('click', async () => {
            const oj = document.getElementById('ojInput').value;
            const problemName = document.getElementById('problemNameInput').value;
            const statusMessage = document.getElementById('statusMessage');

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
                    statusMessage.textContent = `请求失败: ${error.statusText || error.responseText || '网络错误'}`;
                    console.error('GM_xmlhttpRequest 错误:', error);
                }
            });
        });

        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '显示/隐藏面板';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.top = '10px';
        toggleBtn.style.right = '200px'; // Adjust position to not overlap with the panel
        toggleBtn.style.backgroundColor = '#6c757d';
        toggleBtn.style.color = 'white';
        toggleBtn.style.border = 'none';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.zIndex = '10001';
        toggleBtn.style.cursor = 'pointer';
        document.body.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('fetchProblemPanel');
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
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
