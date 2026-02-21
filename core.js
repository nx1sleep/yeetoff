// Конфигурация
const GITHUB_API = 'https://api.github.com/repos/nx1sleep/yeetoff/contents';
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
        // Загружаем оба типа
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

// Загрузка по типу (basic/ill)
async function loadLevelsByType(type) {
    levels[type] = [];
    let position = 1;
    
    while (true) {
        try {
            // Получаем содержимое папки через API
            const folderUrl = `${GITHUB_API}/levels/${type}/${position}`;
            const response = await fetch(folderUrl);
            
            if (!response.ok) {
                if (position === 1) {
                    console.log(`Нет папок для ${type}`);
                }
                break; // Папка не найдена - выходим
            }
            
            const files = await response.json();
            
            // Ищем level.txt
            const levelTxtFile = files.find(f => f.name === 'level.txt');
            if (!levelTxtFile) {
                position++;
                continue;
            }
            
            // Получаем название уровня
            const levelTxtResponse = await fetch(levelTxtFile.download_url);
            const levelName = await levelTxtResponse.text();
            
            // Ищем ЛЮБОЙ JSON файл
            const jsonFile = files.find(f => f.name.endsWith('.json'));
            
            if (jsonFile) {
                levels[type].push({
                    position: position,
                    name: levelName.trim(),
                    filename: jsonFile.name,
                    downloadUrl: jsonFile.download_url
                });
                console.log(`✅ Загружен ${type} #${position}: ${levelName.trim()}`);
            }
            
            position++; // Переходим к следующей папке
            
        } catch (error) {
            console.log(`❌ Ошибка на позиции ${position}, останавливаемся`);
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
    
    // Сортируем по позиции
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

// Глобальные функции для HTML
window.app = {
    switchTab: switchTab,
    loadAllLevels: loadAllLevels
};
window.downloadLevel = downloadLevel;

// Автозагрузка при старте
window.onload = function() {
    loadAllLevels();
};
