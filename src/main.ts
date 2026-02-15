import { initializeUI } from './ui';
import { checkUpdate } from './checkUpdate';

declare const SCRIPT_VERSION: string; // 声明全局变量

(function() {
    'use strict';
    console.log('OICPP SampleTester: 油猴脚本已加载。');
    initializeUI();
    checkUpdate();
})();