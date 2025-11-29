import { GuideStep } from './types';
import { TOGGLE_BTN_ID } from './constants';

export const guideSteps: GuideStep[] = [
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