async function initializeDownloadPage() {
    const appContainer = document.getElementById("app-container");
    if (!appContainer) return;

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const apps = await response.json();

        apps.forEach((app, index) => {
            const cardHTML = createCardHTML(app, index);
            appContainer.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Error initializing download page:", error);
        appContainer.innerHTML = `<p style="color: red;">无法加载应用数据。请检查 'data.json' 文件。</p>`;
    }
}

function createCardHTML(app, index) {
    const idPrefix = `card-${index}`;
    // Added an <img> tag for the logo, using app.logo_url
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
