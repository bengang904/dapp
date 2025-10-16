let allAppsData = []; // 存储原始数据
let filteredAppsData = []; // 存储筛选后的数据

// 渲染应用卡片到 DOM 中
function renderCards(appsToRender) {
    const appContainer = document.getElementById("app-container");
    appContainer.innerHTML = ''; // 清空现有内容

    if (appsToRender.length === 0) {
        appContainer.innerHTML = '<p class="no-results">抱歉，没有找到匹配的文件。</p>';
        return;
    }

    appsToRender.forEach((app, index) => {
        const cardHTML = createCardHTML(app, index);
        // 使用 insertAdjacentHTML 提高性能
        appContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// 实际执行搜索和筛选应用的逻辑（内部函数）
function executeSearch(query) {
    const lowerCaseQuery = query.trim().toLowerCase();

    if (!lowerCaseQuery) {
        filteredAppsData = [...allAppsData];
    } else {
        // 筛选应用：匹配 title 或 file_name
        filteredAppsData = allAppsData.filter(app => 
            (app.title && app.title.toLowerCase().includes(lowerCaseQuery)) || 
            (app.file_name && app.file_name.toLowerCase().includes(lowerCaseQuery))
        );
    }
    
    renderCards(filteredAppsData);
}

// 外部调用的搜索功能：修改 URL 参数并触发页面重载
function searchFiles() {
    // 获取搜索框中的值
    const query = document.getElementById("search-input").value.trim();
    
    // 获取不带参数的当前页面地址
    const baseUrl = window.location.origin + window.location.pathname;
    let newUrl;
    
    if (query === "") {
        // 如果查询为空，移除参数
        newUrl = baseUrl;
    } else {
        // 如果有查询，添加参数 q
        newUrl = `${baseUrl}?q=${encodeURIComponent(query)}`;
    }
    
    // 刷新页面，新的 URL 会在 DOMContentLoaded 中被解析
    window.location.href = newUrl;
}

async function initializeDownloadPage() {
    const appContainer = document.getElementById("app-container");
    if (!appContainer) return;

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        allAppsData = data;
        
        // --- 新增: 解析 URL 参数并执行搜索 ---
        const urlParams = new URLSearchParams(window.location.search);
        const initialQuery = urlParams.get('q');

        if (initialQuery) {
            // 如果 URL 中有 'q' 参数，则设置搜索框并执行搜索
            const searchInput = document.getElementById("search-input");
            searchInput.value = initialQuery;
            executeSearch(initialQuery);
        } else {
            // 否则，初始化全部数据
            filteredAppsData = [...allAppsData]; 
            renderCards(filteredAppsData);
        }
        // ----------------------------------------

        // 监听搜索框的回车事件
        const searchInput = document.getElementById("search-input");
        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                searchFiles();
            }
        });

    } catch (error) {
        console.error("Error initializing download page:", error);
        appContainer.innerHTML = `<p style="color: red; text-align: center;">无法加载应用数据。请检查 'data.json' 文件。</p>`;
    }
}

function createCardHTML(app, index) {
    // 使用 title + index 作为 ID 前缀
    const idPrefix = `card-${app.title.replace(/\s/g, '-')}-${index}`;
    
    return `
        <div class="card">
            ${app.logo_url ? `<img src="${app.logo_url}" alt="${app.title} Logo" class="app-logo">` : ''}
            <h2>${app.title}</h2>
            <p>文件名称: ${app.file_name}</p>
            <p>文件大小: ${app.file_size}</p>
            <button id="${idPrefix}-download-btn" onclick="downloadFile(event, '${app.file_url}', '${app.file_name}', '${idPrefix}')">下载文件</button>
            <div class="progress-container" id="${idPrefix}-progress-container">
                <div class="progress-bar" id="${idPrefix}-progress-bar"></div>
            </div>
            <div class="percent" id="${idPrefix}-percent-text"></div>
        </div>
    `;
}

async function downloadFile(event, fileURL, fileName, idPrefix) {
    const button = document.getElementById(`${idPrefix}-download-btn`);
    const progressContainer = document.getElementById(`${idPrefix}-progress-container`);
    const progressBar = document.getElementById(`${idPrefix}-progress-bar`);
    const percentText = document.getElementById(`${idPrefix}-percent-text`);

    button.style.display = "none";
    progressContainer.style.display = "block";
    percentText.textContent = "正在连接服务器...";
    progressBar.style.width = "0%";

    try {
        const response = await fetch(fileURL);
        if (!response.ok) throw new Error(`HTTP 错误: ${response.status}`);

        const contentLength = response.headers.get("Content-Length");
        const total = contentLength ? parseInt(contentLength, 10) : null;
        const reader = response.body.getReader();
        const chunks = [];
        let loaded = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            loaded += value.length;
            
            if (total) {
                const percent = ((loaded / total) * 100).toFixed(1);
                progressBar.style.width = percent + "%";
                percentText.textContent = `下载中... ${percent}%`;
            } else {
                percentText.textContent = `下载中... ${(loaded / 1024 / 1024).toFixed(2)} MB`;
            }
        }

        const blob = new Blob(chunks);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);

        progressBar.style.width = "100%";
        percentText.textContent = "下载完成！请检查您的下载文件夹。";
    } catch (err) {
        console.error(`Download failed for ${fileName}:`, err);
        percentText.textContent = `下载失败: ${err.message}`;
        progressBar.style.width = "0%";
    } finally {
        setTimeout(() => {
            progressContainer.style.display = "none";
            button.style.display = "inline-block";
            percentText.textContent = "";
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', initializeDownloadPage);
