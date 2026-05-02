// ==UserScript==
// @name         北化(BUCT) SmartClass 视频下载助手(调用原生下载版)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  自动提取 BUCT SmartClass 视频链接，自动命名，并调用浏览器原生下载进度条
// @author       YourName
// @match        *://buct.smartclass.cn/PlayPages/Video.aspx*
// @grant        GM_download
// @grant        GM_info
// ==/UserScript==

(function() {
    'use strict';

    // 核心功能：寻找页面中的视频链接
    function findVideoUrl() {
        const videos = document.querySelectorAll('video');
        for (let v of videos) {
            if (v.src && v.src.includes('.mp4')) return v.src;
            const sources = v.querySelectorAll('source');
            for (let s of sources) {
                if (s.src && s.src.includes('.mp4')) return s.src;
            }
        }
        const html = document.documentElement.innerHTML;
        const regex = /https?:\/\/[^\s"'<>]+smartclass\.cn[^\s"'<>]*\.mp4/g;
        const matches = html.match(regex);
        return (matches && matches.length > 0) ? matches[0] : null;
    }

    // 核心功能：获取并处理文件名
    function getFileName() {
        const courseElem = document.getElementById('courseName');
        if (courseElem && courseElem.innerText) {
            let rawText = courseElem.innerText.trim();
            let parts = rawText.split(/\s+/);

            // 倒推剔除教室信息（倒数第3个词）
            if (parts.length >= 4) {
                let classroomIndex = parts.length - 3;
                parts.splice(classroomIndex, 1);
            }

            let fileName = parts.join(' ');

            // 去除系统不支持的文件名特殊字符
            fileName = fileName.replace(/:/g, '');  // 16:30:00 会变成 163000
            fileName = fileName.replace(/[\\/*?"<>|]/g, '_');

            return fileName + '.mp4';
        }
        return 'SmartClass_Video_' + new Date().getTime() + '.mp4';
    }

    // 核心功能：在页面上添加一个下载按钮
    function addDownloadButton(url) {
        if (document.getElementById('my-custom-download-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'my-custom-download-btn';
        btn.innerHTML = '📥 点击下载视频';

        btn.style.cssText = `
            position: fixed; top: 20px; left: 20px; z-index: 999999;
            padding: 10px 20px; background-color: #4CAF50; color: white;
            border: none; border-radius: 5px; font-size: 16px;
            font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: all 0.3s;
        `;

        btn.onmouseover = () => btn.style.backgroundColor = '#45a049';
        btn.onmouseout = () => btn.style.backgroundColor = '#4CAF50';

        // 点击触发下载
        btn.onclick = function() {
            btn.innerHTML = '🚀 已交由浏览器下载';
            btn.style.backgroundColor = '#2196F3'; // 变成蓝色

            const finalName = getFileName();
            console.log("【视频下载助手】向浏览器发送下载任务:", finalName);

            // 调用油猴的下载接口
            GM_download({
                url: url,
                name: finalName,
                saveAs: true, // 弹出“另存为”对话框，确认保存路径和名字
                onerror: function(error) {
                    console.error("提交下载失败:", error);
                    btn.innerHTML = '❌ 下载失败，请检查设置';
                    btn.style.backgroundColor = '#f44336';
                }
            });

            // 1.5秒后按钮恢复原状，因为任务已经交给浏览器，你可以直接关掉网页了
            setTimeout(() => {
                btn.innerHTML = '📥 重新触发下载';
                btn.style.backgroundColor = '#4CAF50';
            }, 1500);
        };

        document.body.appendChild(btn);
    }

    // 定时检测视频是否加载完毕
    console.log("【视频下载助手】开始运行...");
    let attempts = 0;
    let checkInterval = setInterval(() => {
        attempts++;
        let videoUrl = findVideoUrl();
        if (videoUrl) {
            console.log("【视频下载助手】成功提取到视频链接: ", videoUrl);
            addDownloadButton(videoUrl);
            clearInterval(checkInterval);
        } else if (attempts > 30) {
            clearInterval(checkInterval);
        }
    }, 500);

})();
