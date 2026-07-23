let currentDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0];
let currentViewMode = 'list';
let dismissedWarnings = {};

window.onload = () => {
    renderCalendar();
    selectDate(selectedDate);
};

// 月の切り替え関数
function changeMonth(diff) {
    currentDate.setMonth(currentDate.getMonth() + diff);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('month-display').innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; gap:15px; width:100%;">
            <button onclick="changeMonth(-1)" style="width:auto; margin:0; padding:5px 12px;">◀</button>
            <span style="font-size:1.3rem; font-weight:bold;">${year}年 ${month + 1}月</span>
            <button onclick="changeMonth(1)" style="width:auto; margin:0; padding:5px 12px;">▶</button>
        </div>
    `;

    ['日','月','火','水','木','金','土'].forEach(d => {
        const el = document.createElement('div');
        el.style.textAlign = 'center';
        el.style.fontWeight = 'bold';
        el.innerText = d;
        grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;

        const todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
        const dailyTodos = todos.filter(t => t.date === dateStr);

        const dayEl = document.createElement('div');
        
        // 重複があれば 'has-overlap' クラスを追加します
        const overlapClass = hasOverlap(dailyTodos) ? ' has-overlap' : '';
        dayEl.className = 'day' + (dateStr === selectedDate ? ' selected' : '') + overlapClass;
        
        dayEl.innerText = i;
        dayEl.onclick = () => selectDate(dateStr);

        grid.appendChild(dayEl);
    }
}

function selectDate(date) {
    selectedDate = date;
    const label = document.getElementById('selected-date-label');
    if (label) label.innerText = `${date} の詳細`;
    renderCalendar();
    
    if (currentViewMode === 'chart') {
        renderChart();
    } else {
        loadTodos();
    }
}

function addTodo() {
    const text = document.getElementById('todo-input').value;
    const start = document.getElementById('start-time').value;
    const end = document.getElementById('end-time').value;
    const priority = document.getElementById('priority-input').value;

    if (!text || !start) return alert("内容と時間を入力してね");

    const newTodo = {
        id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        groupId: null,
        date: selectedDate,
        start: start,
        end: end,
        text: text,
        priority: priority,
        completed: false
    };

    const todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    todos.push(newTodo);
    localStorage.setItem('calDataV4', JSON.stringify(todos));
    
    document.getElementById('todo-input').value = "";
    
    if (currentViewMode === 'chart') {
        renderChart();
    } else {
        loadTodos();
    }
}

function loadTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';
    
    const todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const daily = todos.filter(t => t.date === selectedDate).sort((a,b) => a.start > b.start ? 1 : -1);
    
    // 重複があり、かつ「まだ閉じられていない」場合のみ警告を表示
    if (hasOverlap(daily) && !dismissedWarnings[selectedDate]) {
        const warningBox = document.createElement('div');
        warningBox.id = 'overlap-warning';
        warningBox.style.background = '#ffeaa7';
        warningBox.style.color = '#d63031';
        warningBox.style.padding = '12px';
        warningBox.style.borderRadius = '8px';
        warningBox.style.marginBottom = '15px';
        warningBox.style.fontWeight = 'bold';
        warningBox.style.display = 'flex';
        warningBox.style.justifyContent = 'space-between';
        warningBox.style.alignItems = 'center';
        
        warningBox.innerHTML = `
            <span>⚠️ 予定がかぶっていますが、大丈夫ですか？</span>
            <button onclick="dismissWarning()" style="width:auto; margin:0; padding:4px 10px; background:#d63031; color:white; font-size:0.8rem; border-radius:4px;">OK</button>
        `;
        list.appendChild(warningBox);
    }

    if(daily.length === 0) {
        if (dismissedWarnings[selectedDate] || !hasOverlap(daily)) {
            list.innerHTML = '<p style="color:#999; text-align:center;">予定はありません</p>';
        }
        return;
    }

    daily.forEach(t => {
        const item = document.createElement('div');
        item.className = `todo-item ${t.priority} ${t.completed ? 'is-completed' : ''}`;
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleComplete('${t.id}')">
                <div>
                    <div style="font-size:0.8rem; color:#666;">${t.start} ～ ${t.end}</div>
                    <div style="font-weight:bold; ${t.completed ? 'text-decoration: line-through; color: #888;' : ''}">${t.text}</div>
                </div>
            </div>
            <button onclick="deleteTodo('${t.id}')" style="width:auto; margin:0; padding:5px; background:#ff7675; color:white;">削除</button>
        `;
        list.appendChild(item);
    });
}

function dismissWarning() {
    dismissedWarnings[selectedDate] = true;
    loadTodos();
}

function toggleView(mode) {
    currentViewMode = mode;
    const todoList = document.getElementById('todo-list');
    const chartView = document.getElementById('chart-view');

    if (mode === 'chart') {
        todoList.style.display = 'none';
        chartView.style.display = 'block';
        renderChart();
    } else {
        todoList.style.display = 'block';
        chartView.style.display = 'none';
        loadTodos();
    }
}

function renderChart() {
    const chart = document.getElementById('time-chart');
    const legend = document.getElementById('chart-legend');
    if (!chart || !legend) return;

    legend.innerHTML = '';

    const todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const daily = todos.filter(t => t.date === selectedDate).sort((a,b) => a.start.localeCompare(b.start));

    if (daily.length === 0) {
        chart.style.background = '#f1f2f6';
        legend.innerHTML = '<p style="color:#999; text-align:center;">予定が登録されていません</p>';
        return;
    }

    const colors = [
        '#ff7675', '#74b9ff', '#55efc4', '#ffeaa7', 
        '#a29bfe', '#fd9644', '#81ecec', '#fd79a8'
    ];

    let gradientParts = [];
    let lastAngle = 0;

    daily.forEach((t, index) => {
        const startParts = t.start.split(':');
        const endParts = t.end.split(':');
        
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        const startAngle = (startMinutes / 1440) * 360;
        const endAngle = (endMinutes / 1440) * 360;

        const color = colors[index % colors.length];

        if (startAngle > lastAngle) {
            gradientParts.push(`#ffffff ${lastAngle}deg ${startAngle}deg`);
        }

        gradientParts.push(`${color} ${startAngle}deg ${endAngle}deg`);
        lastAngle = endAngle;

        const legendItem = document.createElement('div');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.gap = '8px';
        legendItem.style.marginBottom = '6px';
        legendItem.style.fontSize = '0.9rem';
        legendItem.innerHTML = `
            <span style="display:inline-block; width:12px; height:12px; background:${color}; border-radius:30%;"></span>
            <span style="font-weight:bold;">${t.start}〜${t.end}</span> : ${t.text}
        `;
        legend.appendChild(legendItem);
    });

    if (lastAngle < 360) {
        gradientParts.push(`#ffffff ${lastAngle}deg 360deg`);
    }

    chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;
}

function deleteTodo(id) {
    let todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const targetTodo = todos.find(t => t.id === id);

    if (!targetTodo) return;

    if (targetTodo.groupId) {
        const confirmBulkDelete = confirm("これは一括登録された予定です。同じ日に一括登録した他の曜日の予定も、まとめてすべて削除しますか？\n\n【OK】すべて削除\n【キャンセル】この日の予定だけ削除");
        
        if (confirmBulkDelete) {
            todos = todos.filter(t => t.groupId !== targetTodo.groupId);
        } else {
            todos = todos.filter(t => t.id !== id);
        }
    } else {
        todos = todos.filter(t => t.id !== id);
    }

    localStorage.setItem('calDataV4', JSON.stringify(todos));
    
    if (currentViewMode === 'chart') {
        renderChart();
    } else {
        loadTodos();
    }
}

function toggleComplete(id) {
    let todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        localStorage.setItem('calDataV4', JSON.stringify(todos));
        
        if (currentViewMode === 'chart') {
            renderChart();
        } else {
            loadTodos();
        }
    }
}

function openBulkModal() { 
    document.getElementById('bulk-modal').style.display = 'block'; 
    document.getElementById('overlay').style.display = 'block'; 
}

function closeModals() { 
    document.getElementById('bulk-modal').style.display = 'none'; 
    document.getElementById('overlay').style.display = 'none'; 
}

function executeBulkAdd() {
    const text = document.getElementById('todo-input').value;
    const start = document.getElementById('start-time').value;
    const end = document.getElementById('end-time').value;
    const checkboxes = document.querySelectorAll('#bulk-modal input[type="checkbox"]:checked');
    const targetDays = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (!text || !start || targetDays.length === 0) return alert("内容、時間、曜日を選択してね");

    let todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const now = new Date();
    const lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const groupId = 'bulk_' + Date.now(); 

    for (let i = 1; i <= lastDate; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        if (targetDays.includes(d.getDay())) {
            const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            
            todos.push({ 
                id: 'todo_' + Date.now() + '_bulk_' + i, 
                groupId: groupId, 
                date: dateStr, 
                start, 
                end, 
                text, 
                priority: 'normal', 
                completed: false 
            });
        }
    }
    localStorage.setItem('calDataV4', JSON.stringify(todos));
    closeModals();
    
    if (currentViewMode === 'chart') {
        renderChart();
    } else {
        loadTodos();
    }
}

function deleteCheckedTodos() {
    let todos = JSON.parse(localStorage.getItem('calDataV4')) || [];

    const checkedIds = todos
        .filter(t => t.date === selectedDate && t.completed)
        .map(t => t.id);

    todos = todos.filter(t => !checkedIds.includes(t.id));

    localStorage.setItem('calDataV4', JSON.stringify(todos));
    
    if (currentViewMode === 'chart') {
        renderChart();
    } else {
        loadTodos();
    }
}

function hasOverlap(dailyTodos) {
    if (dailyTodos.length <= 1) return false;
    const sorted = [...dailyTodos].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        if (current.end > next.start) {
            return true;
        }
    }
    return false;
}

// ページ読み込み時に通知の許可をリクエストします
window.addEventListener('load', () => {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
});

// 1分ごとに予定をチェックするタイマーを起動します（60,000ミリ秒 = 1分）
setInterval(checkUpcomingTodos, 60000);


// ページ読み込み時にサービスワーカーを登録します
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('サービスワーカーの登録に成功しました！', reg))
            .catch(err => console.error('登録失敗:', err));
    }

    if ("Notification" in window) {
        Notification.requestPermission();
    }
});

// 1分ごとに予定をチェックする処理を、サービスワーカー連携版にアップデート！
setInterval(checkUpcomingTodos, 60000);

function checkUpcomingTodos() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    todos.forEach(t => {
        if (t.date === todayStr && t.priority === 'high' && !t.completed) {
            const startParts = t.start.split(':');
            const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);

            // 10分前になったら……
            if (startMinutes - currentMinutes === 10) {
                const title = "⚠️ 重要な予定の10分前です！";
                const body = `『${t.text}』（${t.start}〜）の10分前ですよ！いつまでダラダラしているのですか、早く準備しなさい！`;

                // サービスワーカーが起動していれば、裏側から通知を飛ばさせます！
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SHOW_NOTIFICATION',
                        title: title,
                        body: body
                    });
                } else {
                    // 通常の通知（予備）
                    new Notification(title, { body: body });
                }
            }
        }
    });
}