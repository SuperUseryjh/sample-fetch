const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const metadata = packageJson.userscript;
const version = packageJson.version;
const outputFile = path.resolve(__dirname, '../dist/fetch_tampermonkey.user.js');
const bundledJsFile = path.resolve(__dirname, '../dist/bundle.js');

let metadataBlock = '// ==UserScript==\n';
metadataBlock += `// @name         ${metadata.name}\n`;
metadataBlock += `// @namespace    ${metadata.namespace}\n`;
metadataBlock += `// @version      ${version}\n`;
metadataBlock += `// @description  ${metadata.description}\n`;
metadataBlock += `// @author       ${metadata.author}\n`;

if (metadata.match && Array.isArray(metadata.match)) {
    metadata.match.forEach(item => {
        metadataBlock += `// @match        ${item}\n`;
    });
}

if (metadata.grant) {
    if (!metadata.grant.includes('GM_info')) {
        metadataBlock += `// @grant        GM_info\n`;
    }
    if (!metadata.grant.includes('GM_xmlhttpRequest')) {
        metadataBlock += `// @grant        GM_xmlhttpRequest\n`;
    }
    if (!metadata.grant.includes('GM_openInTab')) {
        metadataBlock += `// @grant        GM_openInTab\n`;
    }
    metadataBlock += `// @grant        ${metadata.grant}\n`;
} else {
    metadataBlock += `// @grant        GM_info\n`;
    metadataBlock += `// @grant        GM_xmlhttpRequest\n`;
    metadataBlock += `// @grant        GM_openInTab\n`;
}

if (metadata.connect && Array.isArray(metadata.connect)) {
    if (!metadata.connect.includes('onion-static.netlify.app')) {
        metadataBlock += `// @connect      onion-static.netlify.app\n`;
    }
    metadata.connect.forEach(item => {
        metadataBlock += `// @connect      ${item}\n`;
    });
} else {
    metadataBlock += `// @connect      onion-static.netlify.app\n`;
}

metadataBlock += '// ==/UserScript==\n';

// 将版本号注入到脚本中
const versionInjection = `const SCRIPT_VERSION = "${version}";\n\n`;

// 读取捆绑的 JS 文件内容
const bundledJsContent = fs.readFileSync(bundledJsFile, 'utf8');

// 将元数据、版本注入和捆绑的 JS 内容写入最终的油猴脚本文件
fs.writeFileSync(outputFile, metadataBlock + versionInjection + bundledJsContent);

console.log('Tampermonkey script generated successfully!');