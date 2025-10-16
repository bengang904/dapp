let videoData = [];
let filteredVideos = [];
let currentIndex = 0;
const videosPerPage = 8;

document.addEventListener("DOMContentLoaded", function () {
    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            videoData = data;
            
            const urlParams = new URLSearchParams(window.location.search);
            const initialQuery = urlParams.get('q');
            
            if (initialQuery) {
                const searchInput = document.getElementById("search-input");
                searchInput.value = initialQuery;
                executeSearch(initialQuery);
            } else {
                filteredVideos = [...videoData]; 
                currentIndex = 0;
                renderVideos(true);
            }

        })
        .catch(error => console.error("加载 JSON 失败:", error));

    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            search();
        }
    });
});

function renderVideos(reset = false) {
    const container = document.getElementById("list");
    if (reset) {
        container.innerHTML = "";
        currentIndex = 0;
    }

    const videosToShow = filteredVideos.slice(currentIndex, currentIndex + videosPerPage);
    videosToShow.forEach(video => {
        const card = document.createElement("div");
        card.classList.add("video-card");
        
        card.addEventListener("click", function () {
            window.open(video.link, "_blank");
        });

        card.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}">
            <h3>${video.title}</h3>
            <p>类型: ${video.type}</p>
        `;

        container.appendChild(card);
    });

    currentIndex += videosToShow.length;

    const loadMoreBtn = document.getElementById("load-more");
    if (currentIndex < filteredVideos.length) {
        loadMoreBtn.style.display = "block";
    } else {
        loadMoreBtn.style.display = "none";
    }
}

function executeSearch(query) {
    if (query === "") {
        filteredVideos = [...videoData];
    } else {
        try {
            const regex = new RegExp(query, "i"); 
            filteredVideos = videoData.filter(video => regex.test(video.title));
        } catch (error) {
            console.error("无效的正则表达式:", error);
            alert("搜索关键字格式错误，请检查后重试！");
            filteredVideos = [...videoData];
        }
    }
    renderVideos(true);
}

function search() {
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

function loadMoreVideos() {
    renderVideos(false);
}
