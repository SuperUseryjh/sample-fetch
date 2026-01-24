import { initializeUI } from './ui';
import { STATIC_BASE_URL, LOCAL_STORAGE_LAST_CHECK_TIME, UPDATE_CHECK_INTERVAL, PREVIEW_UPDATE_CHECK_INTERVAL } from './constants';

declare const SCRIPT_VERSION: string; // 声明全局变量

async function checkUpdate() {
    const lastCheckTime = parseInt(localStorage.getItem(LOCAL_STORAGE_LAST_CHECK_TIME) || '0');
    const now = Date.now();

    const isStandardVersion = /^[0-9]+\.[0-9]+\.[0-9]+$/.test(SCRIPT_VERSION);
    const currentCheckInterval = isStandardVersion ? UPDATE_CHECK_INTERVAL : PREVIEW_UPDATE_CHECK_INTERVAL;

    if (now - lastCheckTime < currentCheckInterval) {
        console.log('OICPP SampleTester: 距离上次检查更新时间不足，跳过检查。');
        return;
    }

    console.log('OICPP SampleTester: 正在检查更新...');
    localStorage.setItem(LOCAL_STORAGE_LAST_CHECK_TIME, now.toString());

    const versionPath = isStandardVersion ? 'pub' : 'perv';
    const updateUrl = `${STATIC_BASE_URL}/${versionPath}/version.json`;

    window.GM_xmlhttpRequest({
        method: "GET",
        url: updateUrl,
        onload: function(response) {
            try {
                const remotePackageJson = JSON.parse(response.responseText);
                const remoteVersion = remotePackageJson.version;

                if (remoteVersion && remoteVersion !== SCRIPT_VERSION) {
                    console.log(`OICPP SampleTester: 发现新版本！当前版本: ${SCRIPT_VERSION}, 最新版本: ${remoteVersion}`);
                    const userScriptFileName = 'sampleTester.user.js';
                    const userScriptUrl = `${STATIC_BASE_URL}/${versionPath}/${userScriptFileName}`;
                    if (confirm(`OICPP SampleTester: 发现新版本 ${remoteVersion}！点击确定在新标签页中打开更新。`)) {
                        window.GM_openInTab(userScriptUrl, false);
                    }
                } else {
                    console.log('OICPP SampleTester: 当前已是最新版本。');
                }
            } catch (error) {
                console.error('OICPP SampleTester: 解析更新信息失败:', error);
            }
        },
        onerror: function(response) {
            console.error('OICPP SampleTester: 检查更新失败:', response.status, response.statusText);
        }
    });
}

(function() {
    'use strict';
    console.log('OICPP SampleTester: 油猴脚本已加载。');
    initializeUI();
    checkUpdate();
})();