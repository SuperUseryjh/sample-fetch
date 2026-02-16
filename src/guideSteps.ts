import { GuideStep } from './types';
import { TOGGLE_BTN_ID, CONTROL_BTN_ID } from './constants';

export const guideSteps: GuideStep[] = [
    {
        selector: `#${TOGGLE_BTN_ID}`,
        title: '欢迎使用 OICPP 样例抓取！',
        description: '本工具旨在帮助您快速抓取在线评测系统的题目样例。让我们开始吧！'
    },
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
    },
    {
        selector: `#${CONTROL_BTN_ID}`,
        title: '设置按钮',
        description: '点击右下角的齿轮按钮可以进入设置页面，配置题目名称模式和动态域名等高级功能。'
    },
    {
        selector: '#oicppSettingsCard',
        title: '设置页面概览',
        description: '这里是 OICPP 样例抓取的设置页面。您可以在这里配置各项功能。'
    },
    {
        selector: '#problemNameModeDefault',
        title: '题目名称模式',
        description: '您可以选择默认使用网页标题作为题目名称，或者每次抓取时手动输入。'
    },
    {
        selector: '#dynamicDomainInput',
        title: '动态域名配置',
        description: '如果您的 OJ 域名不在默认支持列表中，可以在这里添加。输入您的 OJ 域名，然后选择一个匹配的模板。'
    },
    {
        selector: '#ojTemplateSelect',
        title: '选择 OJ 模板',
        description: '选择一个与您的 OJ 网站结构最相似的模板。这决定了脚本如何解析题目信息。'
    },
    {
        selector: '#addDynamicDomainBtn',
        title: '添加动态域名',
        description: '点击此按钮将您输入的域名和选择的模板添加到配置列表中。'
    },
    {
        selector: '#dynamicDomainList',
        title: '已配置域名列表',
        description: '这里显示所有已配置的动态域名。您可以随时移除不需要的域名。'
    },
    {
        selector: '#oicppSettingsCard',
        title: '教程结束',
        description: '恭喜您完成了新手教程！现在您可以开始使用 OICPP 样例抓取工具了。'
    }
];
