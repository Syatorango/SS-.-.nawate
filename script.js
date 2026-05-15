let selectedDate = new Date().toISOString().split('T')[0];

window.onload = () => {
    renderCalendar();
    selectDate(selectedDate);
};

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    document.getElementById('month-display').innerText = `${year}年 ${month+1}月`;

    ['日','月','火','水','木','金','土'].forEach(d => {
        const el = document.createElement('div');
        el.style.textAlign = 'center'; el.innerText = d;
        grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

    for (let i = 1; i <= lastDate; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'day' + (dateStr === selectedDate ? ' selected' : '');
        dayEl.innerText = i;
        dayEl.onclick = () => selectDate(dateStr);
        grid.appendChild(dayEl);
    }
}

function selectDate(date) {
    selectedDate = date;
    document.getElementById('selected-date-label').innerText = `${date} の詳細`;
    renderCalendar();
    loadTodos();
}

function addTodo() {
    const text = document.getElementById('todo-input').value;
    const start = document.getElementById('start-time').value;
    const end = document.getElementById('end-time').value;
    const priority = document.getElementById('priority-input').value;

    if (!text || !start) return alert("内容と時間を入力してね");

    const newTodo = {
        id: Date.now(),
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
    loadTodos();
}

function loadTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';
    const todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const daily = todos.filter(t => t.date === selectedDate).sort((a,b) => a.start > b.start ? 1 : -1);
    
    if(daily.length === 0) {
        list.innerHTML = '<p style="color:#999; text-align:center;">予定はありません</p>';
    }

    daily.forEach(t => {
        const item = document.createElement('div');
        item.className = `todo-item ${t.priority} ${t.completed ? 'is-completed' : ''}`;
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleComplete(${t.id})">
                <div>
                    <div style="font-size:0.8rem; color:#666;">${t.start} ～ ${t.end}</div>
                    <div style="font-weight:bold; ${t.completed ? 'text-decoration: line-through; color: #888;' : ''}">${t.text}</div>
                </div>
            </div>
            <button onclick="deleteTodo(${t.id})" style="width:auto; margin:0; padding:5px; background:#ff7675; color:white;">削除</button>
        `;
        list.appendChild(item);
    });
}

function deleteTodo(id) {
    let todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    todos = todos.filter(t => t.id !== id);
    localStorage.setItem('calDataV4', JSON.stringify(todos));
    loadTodos();
}

function toggleComplete(id) {
    let todos = JSON.parse(localStorage.getItem('calDataV4')) || [];
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        localStorage.setItem('calDataV4', JSON.stringify(todos));
        loadTodos();
    }
}

function openBulkModal() { document.getElementById('bulk-modal').style.display = 'block'; document.getElementById('overlay').style.display = 'block'; }
function closeModals() { document.getElementById('bulk-modal').style.display = 'none'; document.getElementById('overlay').style.display = 'none'; }

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

    for (let i = 1; i <= lastDate; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        if (targetDays.includes(d.getDay())) {
            const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            todos.push({ id: Date.now() + i, date: dateStr, start, end, text, priority: 'normal', completed: false });
        }
    }
    localStorage.setItem('calDataV4', JSON.stringify(todos));
    closeModals();
    loadTodos();
}
