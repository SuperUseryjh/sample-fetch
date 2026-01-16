export const API_URL = "http://127.0.0.1:20030/createNewProblem";
export const PANEL_ID = 'fetchProblemPanel';
export const TOGGLE_BTN_ID = 'fetchProblemToggleBtn';
export const TEMP_STATUS_ID = 'fetchProblemTempStatus';
export const DRAG_THRESHOLD = 5; // 拖动阈值，小于此值视为点击
export const COOLDOWN_DURATION_MS = 3000; // 5秒冷却时间

// 指引常量
export const GUIDE_POPOVER_ID = 'fetchProblemGuidePopover';
export const GUIDE_OVERLAY_ID = 'fetchProblemGuideOverlay';
export const GUIDE_STORAGE_KEY = 'fetchProblemGuideShown';
export const LOCAL_STORAGE_POS_X = 'fetchProblemToggleBtnPosX';
export const LOCAL_STORAGE_POS_Y = 'fetchProblemToggleBtnPosY';
export const STATE_SELECTION_PANEL_ID = 'htojStateSelectionPanel';
export const CONTROL_BTN_ID = 'fetchProblemControlBtn';
export const PROBLEM_NAME_MODE_KEY = 'fetchProblemNameMode';
export const PROBLEM_NAME_CUSTOM_INPUT_KEY = 'fetchProblemNameCustomInput';

// 更新检测常量
export const STATIC_BASE_URL = 'https://onion-static.netlify.app/oicpp';
export const LOCAL_STORAGE_LAST_CHECK_TIME = 'fetchProblemLastUpdateCheck';
export const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
export const PREVIEW_UPDATE_CHECK_INTERVAL = 1 * 60 * 60 * 1000; // 1小时
