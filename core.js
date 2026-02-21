// Конфигурация - ТОЛЬКО RAW
const GITHUB_RAW = 'https://raw.githubusercontent.com/nx1sleep/yeetoff/main';

let currentTab = 'basic';
let levels = {
    basic: [],
    ill: []
};

// Загрузка всех уровней
async function loadAllLevels() {
    const container = document.getElementById('levelsContainer');
    container.innerHTML = '<div class="loading">Загрузка уровней...</div>';
    
    try {
        await Promise.all([
            loadLevelsByType('basic'),
            loadLevelsByType('ill')
        ]);
        renderLevels();
    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = '<div class="error">Не удалось загрузить уровни</div>';
    }
}

// Загрузка через RAW (без API)
async function loadLevelsByType(type) {
    levels[type] = [];
    let position = 1;
    
    while (position <= 30) { // Проверим первые 30 папок
        try {
            // Пробуем скачать level.txt
            const txtUrl = `${GITHUB_RAW}/levels/${type}/${position}/level.txt`;
            const txtResponse = await fetch(txtUrl);
            
            if (txtResponse.ok) {
                // Есть level.txt - значит папка существует
                const levelName = await txtResponse.text();
                
                // Теперь ищем JSON файл (через проверку ссылок)
                const jsonExtensions = ['.json']; // Можно добавить другие
                
                for (const ext of jsonExtensions) {
                    // Пробуем стандартные имена
                    const possibleNames = [
                        `${type}_${position}${ext}`,
                        `level${ext}`,
                        `map${ext}`,
                        `level_${position}${ext}`
                    ];
                    
                    for (const name of possibleNames) {
                        const jsonUrl = `${GITHUB_RAW}/levels/${type}/${position}/${name}`;
                        const jsonResponse = await fetch(jsonUrl, { method: 'HEAD' });
                        
                        if (jsonResponse.ok) {
                            levels[type].push({
                                position: position,
                                name: levelName.trim(),
                                filename: name,
                                downloadUrl: jsonUrl
                            });
                            console.log(`✅ ${type} #${position}: ${levelName.trim()} (${name})`);
                            break;
                        }
                    }
                    
                    // Если нашли JSON, выходим из цикла расширений
                    if (levels[type].some(l => l.position === position)) break;
                }
            }
            
            position++;
            
        } catch (error) {
            console.log(`❌ Ошибка на ${type}/${position}, останавливаемся`);
            break;
        }
    }
}

// Рендер уровней
function renderLevels() {
    const container = document.getElementById('levelsContainer');
    const currentLevels = levels[currentTab];
    
    if (currentLevels.length === 0) {
        container.innerHTML = '<div class="error">Нет уровней в этой категории</div>';
        return;
    }
    
    currentLevels.sort((a, b) => a.position - b.position);
    
    let html = '<div class="levels-grid">';
    
    currentLevels.forEach(level => {
        html += `
            <div class="level-card ${currentTab}" style="animation-delay: ${level.position * 0.05}s">
                <div class="level-number">#${level.position}</div>
                <div class="level-name">${escapeHtml(level.name)}</div>
                <button class="download-btn" onclick="downloadLevel('${level.downloadUrl}', '${level.filename}')">
                    Скачать файл уровня
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Скачивание уровня
async function downloadLevel(url, filename) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Файл не найден');
        
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        alert('❌ Не удалось скачать уровень');
        console.error(error);
    }
}

// Переключение вкладок
function switchTab(tab) {
    currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (tab === 'basic') {
        document.querySelector('.tab-btn.basic').classList.add('active');
    } else {
        document.querySelector('.tab-btn.ill').classList.add('active');
    }
    
    renderLevels();
}

// Защита от XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Глобальные функции
window.app = {
    switchTab: switchTab,
    loadAllLevels: loadAllLevels
};
window.downloadLevel = downloadLevel;

// Автозагрузка
window.onload = function() {
    loadAllLevels();
};
