import { API_URL } from './constants';
import { Payload, GM_xmlhttpRequestDetails, GM_xmlhttpRequestResponse } from './types';
import { showCustomDialog } from './ui';

/**
 * 将数据发送到本地API。
 * @param {Object} payload - 要发送的数据。
 * @param {HTMLElement} statusMessageElement - 用于更新状态消息的元素。
 */
export function sendProblemToAPI(payload: Payload, statusMessageElement: HTMLElement) {
    console.log('OICPP SampleTester: sendProblemToAPI - 正在向API发送数据:', payload);
    statusMessageElement.style.color = 'blue';
    statusMessageElement.textContent = '正在提取代码并发送请求...';

    window.GM_xmlhttpRequest({
        method: "POST",
        url: API_URL,
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify(payload),
        onload: function(response: GM_xmlhttpRequestResponse) {
            console.log('OICPP SampleTester: sendProblemToAPI - 收到API响应。状态:', response.status, '响应文本:', response.responseText);
            try {
                const data = JSON.parse(response.responseText);
                if (response.status === 200) {
                    statusMessageElement.style.color = 'green';
                    statusMessageElement.textContent = `成功: ${data.message}`;
                    console.log('OICPP SampleTester: sendProblemToAPI - 成功:', data.message);
                } else {
                    let errorMessage = `错误 (${response.status}): ${data.message || '未知错误'}`;
                    if (data.invalidField) {
                        errorMessage += ` (字段: ${data.invalidField})`;
                    }
                    showCustomDialog(errorMessage);
                    statusMessageElement.style.color = 'red';
                    statusMessageElement.textContent = errorMessage;
                    console.error('OICPP SampleTester: sendProblemToAPI - API错误:', errorMessage, '数据:', data);
                }
            } catch (e: any) {
                showCustomDialog(`请求成功，但解析响应失败: ${e.message}`);
                statusMessageElement.style.color = 'red';
                statusMessageElement.textContent = `请求成功，但解析响应失败: ${e.message}`;
                console.error('OICPP SampleTester: sendProblemToAPI - JSON解析错误:', e.message, '响应文本:', response.responseText);
            }
        },
        onerror: function(error: GM_xmlhttpRequestResponse) {
            showCustomDialog(`请求失败: ${error.statusText || error.responseText || '网络错误'}。请确认OICPP是否正在运行。`);
            statusMessageElement.style.color = 'red';
            statusMessageElement.textContent = `请求失败: ${error.statusText || error.responseText || '网络错误'}。请确认OICPP是否正在运行。`;
            console.error('OICPP SampleTester: GM_xmlhttpRequest 错误:', error);
        }
    });
}