let allAppsData = []; 
let filteredAppsData = []; 

function renderCards(appsToRender) {
    const appContainer = document.getElementById("app-container");
    appContainer.innerHTML = ''; 

    if (appsToRender.length === 0) {
        appContainer.innerHTML = '<p class="no-results">抱歉，没有找到匹配的文件。</p>';
        return;
    }

    appsToRender.forEach((app, index) => {
        const cardHTML = createCardHTML(app, index);
        appContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

function executeSearch(query) {
    const lowerCaseQuery = query.trim().toLowerCase();

    if (!lowerCaseQuery) {
        filteredAppsData = [...allAppsData];
    } else {
        filteredAppsData = allAppsData.filter(app => 
            (app.title && app.title.toLowerCase().includes(lowerCaseQuery)) || 
            (app.file_name && app.file_name.toLowerCase().includes(lowerCaseQuery))
        );
    }
    
    renderCards(filteredAppsData);
}

function searchFiles() {
    const query = document.getElementById("search-input").value.trim();
    const baseUrl = window.location.origin + window.location.pathname;
    let newUrl;
    
    if (query === "") {
        newUrl = baseUrl;
    } else {
        newUrl = `${baseUrl}?q=${encodeURIComponent(query)}`;
    }
    
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
        
        const urlParams = new URLSearchParams(window.location.search);
        const initialQuery = urlParams.get('q');
        const searchInput = document.getElementById("search-input");

        if (initialQuery) {
            searchInput.value = initialQuery;
            executeSearch(initialQuery);
        } else {
            filteredAppsData = [...allAppsData]; 
            renderCards(filteredAppsData);
        }

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
    const idPrefix = `card-${app.title.replace(/\s/g, '-')}-${index}`;
    
    return `
        <div class="card">
            ${app.logo_url ? `<img src="${app.logo_url}" alt="${app.title} Logo" class="app-logo">` : ''}
            <h2>${app.title}</h2>
            <p>文件名称: ${app.file_name}</p>
            <p>文件大小: ${app.file_size}</p>
            <button id="${idPrefix}-download-btn" onclick="downloadFile(event, '${app.file_url}', '${app.file_name}', '${idPrefix}')">获取文件</button>
            <div class="progress-container" id="${idPrefix}-progress-container">
                <div class="progress-bar" id="${idPrefix}-progress-bar"></div>
            </div>
            <div class="percent" id="${idPrefix}-percent-text"></div>
        </div>
    `;
}

/**
 * 带有确认弹窗和进度条的文件下载函数。
 * @param {Event} event - 点击事件对象。
 * @param {string} fileURL - 文件下载的URL。
 * @param {string} fileName - 文件名。
 * @param {string} idPrefix - 卡片元素的ID前缀。
 */
async function downloadFile(event, fileURL, fileName, idPrefix) {
    const isConfirmed = confirm(`您确定要下载文件：\n${fileName} 吗？`);

    if (!isConfirmed) {
        return;
    }
    
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
