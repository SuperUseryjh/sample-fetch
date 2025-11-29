import { TOGGLE_BTN_ID, DRAG_THRESHOLD, LOCAL_STORAGE_POS_X, LOCAL_STORAGE_POS_Y } from './constants';

/**
 * 使元素可拖动。
 * @param {HTMLElement} element - 要使其可拖动的元素。
 * @param {HTMLElement} handle - 用于启动拖动的句柄元素。
 */
export function makeDraggable(element: HTMLElement, handle: HTMLElement) {
    let isDragging = false;
    let isMoved = false;
    let startX: number, startY: number;
    let initialMouseX: number, initialMouseY: number;
    let initialElementRight: number, initialElementTop: number;

    handle.addEventListener('mousedown', (e: MouseEvent) => {
        isDragging = true;
        isMoved = false;
        startX = e.clientX;
        startY = e.clientY;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        // 获取当前元素的 right 和 top 样式值，如果未设置则默认为 0
        initialElementRight = parseFloat(element.style.right) || 0;
        initialElementTop = parseFloat(element.style.top) || 0;

        if (element.id === TOGGLE_BTN_ID) {
            element.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (element.id === TOGGLE_BTN_ID) {
            element.style.cursor = 'grab';
            if (isMoved) {
                // 保存最终的 right 和 top 样式值
                const finalRight = parseFloat(element.style.right);
                const finalTop = parseFloat(element.style.top);
                localStorage.setItem(LOCAL_STORAGE_POS_X, finalRight.toString());
                localStorage.setItem(LOCAL_STORAGE_POS_Y, finalTop.toString());
                console.log(`OICPP SampleTester: 按钮位置已保存: right=${finalRight}, top=${finalTop}`);
            }
        }
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
        if (isDragging) {
            e.preventDefault();

            const dx = e.clientX - initialMouseX;
            const dy = e.clientY - initialMouseY;

            // 计算新的 right 和 top 值
            const newRight = initialElementRight - dx;
            const newTop = initialElementTop + dy;

            element.style.right = `${newRight}px`;
            element.style.top = `${newTop}px`;

            // 获取视口尺寸
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // 获取按钮的当前尺寸
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;

            // 将 right/top 转换为 left/top 进行边界检查
            let currentLeft = viewportWidth - newRight - elementWidth;
            let currentTop = newTop;

            // 边界检测和弹回
            if (currentLeft < 0) { // 超出左边界
                element.style.right = `${viewportWidth - elementWidth}px`;
            }
            if (currentTop < 0) { // 超出上边界
                element.style.top = `0px`;
            }
            if (currentLeft + elementWidth > viewportWidth) { // 超出右边界
                element.style.right = `0px`;
            }
            if (currentTop + elementHeight > viewportHeight) { // 超出下边界
                element.style.top = `${viewportHeight - elementHeight}px`;
            }

            // 检查鼠标是否移动超过阈值
            if (Math.abs(e.clientX - startX) > DRAG_THRESHOLD || Math.abs(e.clientY - startY) > DRAG_THRESHOLD) {
                isMoved = true;
            }
        }
    });

    return { getIsMoved: () => isMoved };
}