let tasks = JSON.parse(localStorage.getItem('my_tasks')) || [];
let currentFilter = 'all';
let selectedDateStr = null;
let currentListMode = 'card';
let categoryChart = null;

let calDate = new Date();

// カテゴリ定義
const categories = {
  all: 'すべて',
  starred: '★ お気に入り',
  work: '仕事',
  house: '家事',
  hobby: '趣味',
  study: '勉強',
  other: 'その他'
};

// ★外側（重要度）：直感的な信号機カラー
const priorityColors = { 
  high: '#ff4d4f',   // 赤
  medium: '#ffc53d', // 黄
  low: '#73d13d'     // 緑
};

// ★内側（カテゴリ）：重要度と被らない識別用カラー
const categoryColors = { 
  work: '#1890ff',   // ブルー
  house: '#ff85c0',  // ローズピンク
  hobby: '#722ed1',  // ディープパープル
  study: '#13c2c2',  // ターコイズシアン
  other: '#f17126'   // オレンジ
};

// データ保存 & 全画面の再描画
function saveAndRender() {
  try {
    localStorage.setItem('my_tasks', JSON.stringify(tasks));
  } catch(e) {}
  
  renderCategoryTabs();
  renderTasks();
  renderCalendar();
  
  try {
    renderChart();
  } catch (e) {
    console.error("円グラフの描画エラー:", e);
  }
}

/* --- 表示モード切り替え --- */
function setListMode(mode) {
  currentListMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById('btn-mode-' + mode);
  if (btn) btn.classList.add('active');

  const container = document.getElementById('taskListContainer');
  if (container) container.className = 'view-' + mode;
  
  renderTasks();
}

/* --- タスクの追加・削除・お気に入り --- */
// 一括削除機能

const button = document.getElementById("DeleteButton");
button.addEventListener("click", function () {
var list_delete = [];
const starredTasks = tasks.filter(task => task.isStarred);
starredTasks.forEach(task => {
  deleteTask2(task.id);
});

});

// 一括削除機能
const ClearButton = document.getElementById("ClearButton");
ClearButton.addEventListener("click", function () {
var list_delete = [];
const clearedTasks = tasks.filter(task => task.isCleared);
clearedTasks.forEach(task => {
  deleteTask2(task.id);
});


});
function addTask() {
  const titleEl = document.getElementById('taskTitle');
  const datetimeEl = document.getElementById('taskDatetime');
  const endDatetimeEl = document.getElementById('taskEndDatetime');
  const priorityEl = document.getElementById('taskPriority');
  const categoryEl = document.getElementById('taskCategory');

  if (!titleEl || !datetimeEl) return;

  const title = titleEl.value;
  const datetime = datetimeEl.value;
  let endDatetime = endDatetimeEl ? endDatetimeEl.value : '';
  const priority = priorityEl ? priorityEl.value : 'medium';
  const category = categoryEl ? categoryEl.value : 'other';

  if (!title || !datetime) {
    alert('タイトルと開始日時を入力してください');
    return;
  }

  // 終了日時が未入力の場合は自動で「開始日時 + 1時間」
  if (!endDatetime) {
    const startDate = new Date(datetime);
    startDate.setHours(startDate.getHours() + 1);
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const hours = String(startDate.getHours()).padStart(2, '0');
    const minutes = String(startDate.getMinutes()).padStart(2, '0');
    endDatetime = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
  }

  if (new Date(endDatetime) <= new Date(datetime)) {
    alert('終了日時は開始日時より後の時間を指定してください');
    return;
  }

  tasks.push({
    id: Date.now(),
    title,
    datetime,
    endDatetime,
    priority,
    category,
    isStarred: false
  });

  titleEl.value = '';
  datetimeEl.value = '';
  if (endDatetimeEl) endDatetimeEl.value = '';
  saveAndRender();
}

function deleteTask(id) {
  if (confirm('この予定を削除しますか？')) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
  }
}

function deleteTask2(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
}

function toggleStar(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.isStarred = !task.isStarred;
    saveAndRender();
  }
}

function clearTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.isCleared = !task.isCleared;
    saveAndRender();
  }
}

/* --- タスク一覧の描画 --- */
function renderTasks() {
  const container = document.getElementById('taskListContainer');
  if (!container) return;
  container.innerHTML = '';

  let filtered = tasks.filter(t => {
    if (currentFilter === 'starred') {
      if (!t.isStarred) return false;
    } else if (currentFilter !== 'all') {
      if (t.category !== currentFilter) return false;
    }
    
    if (selectedDateStr) {
      if (!t.datetime.startsWith(selectedDateStr)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:#999; padding:25px;">予定はありません</div>';
    return;
  }

  filtered.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item ' + task.priority;
    
    const startObj = new Date(task.datetime);
    const endObj = task.endDatetime ? new Date(task.endDatetime) : new Date(startObj.getTime() + 3600000);

    const startTimeStr = startObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = endObj.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const dateStr = (startObj.getMonth() + 1) + '/' + startObj.getDate() + ' ' + startTimeStr + '〜' + endTimeStr;


      item.innerHTML = '<div>' +
        '<strong>' + task.title + '</strong>' +
        '<div style="font-size:0.8rem; color:#666; margin-top:2px;">' +
          dateStr + ' ・ [' + (categories[task.category] || 'その他') + ']' +
        '</div>' +
      '</div>' +
      '<div class="action-btns">' +
        '<button class="star-btn ' + (task.isStarred ? 'active' : '') + '" onclick="toggleStar(' + task.id + ')">★</button>' +
        '<button class="delete-btn" onclick="deleteTask(' + task.id + ')">🗑️</button>' +
         '<button class="clear-btn ' + (task.isCleared ? 'active' : '') + '" onclick="clearTask(' + task.id + ')">済</button>' +
      '</div>';


    container.appendChild(item);
  });
}

/* --- フォルダタブの描画 --- */
function renderCategoryTabs() {
  const container = document.getElementById('categoryTabs');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(categories).forEach(key => {
    let count = 0;
    if (key === 'all') count = tasks.length;
    else if (key === 'starred') count = tasks.filter(t => t.isStarred).length;
    else count = tasks.filter(t => t.category === key).length;

    const btn = document.createElement('button');
    btn.className = 'tab-btn ' + (currentFilter === key ? 'active' : '');
    btn.innerHTML = categories[key] + ' <span class="badge">' + count + '</span>';
    btn.onclick = () => {
      currentFilter = key;
      renderCategoryTabs();
      renderTasks();
    };
    container.appendChild(btn);
  });
}

/* --- カレンダーの描画 --- */
function changeMonth(diff) {
  calDate.setMonth(calDate.getMonth() + diff);
  renderCalendar();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('calMonthTitle');
  if (!grid) return;
  grid.innerHTML = '';

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  if (title) title.innerText = year + '年 ' + (month + 1) + '月';

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  
  const now = new Date();
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'cal-day empty';
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dayCell = document.createElement('div');
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDateStr = year + '-' + monthStr + '-' + dayStr;

    dayCell.className = 'cal-day';
    if (fullDateStr === todayStr) dayCell.classList.add('today');
    if (fullDateStr === selectedDateStr) dayCell.classList.add('selected');

    dayCell.innerText = day;

    const hasTask = tasks.some(t => t.datetime.startsWith(fullDateStr));
    if (hasTask) {
      const dot = document.createElement('div');
      dot.className = 'has-task-dot';
      dayCell.appendChild(dot);
    }

    dayCell.onclick = () => {
      if (selectedDateStr === fullDateStr) {
        selectedDateStr = null;
      } else {
        selectedDateStr = fullDateStr;
      }
      renderCalendar();
      updateFilterStatus();
      renderTasks();
      try { renderChart(); } catch(e){}
    };

    grid.appendChild(dayCell);
  }
}

function updateFilterStatus() {
  const statusEl = document.getElementById('calendarFilterStatus');
  const textEl = document.getElementById('filterDateText');
  const titleEl = document.getElementById('listTitleText');

  if (selectedDateStr) {
    const d = new Date(selectedDateStr);
    if (textEl) textEl.innerText = '選択中: ' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    if (titleEl) titleEl.innerText = '📋 ' + (d.getMonth() + 1) + '月' + d.getDate() + '日の予定';
    if (statusEl) statusEl.style.display = 'flex';
  } else {
    if (statusEl) statusEl.style.display = 'none';
    if (titleEl) titleEl.innerText = '📋 予定一覧';
  }
}

function clearDateFilter() {
  selectedDateStr = null;
  renderCalendar();
  updateFilterStatus();
  renderTasks();
  try { renderChart(); } catch(e){}
}

/* --- 24時間円グラフの描画 --- */
function renderChart() {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const titleEl = document.getElementById('chartTitleText');

  const now = new Date();
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const targetDateStr = selectedDateStr || todayStr;
  const targetDateObj = new Date(targetDateStr);
  
  if (titleEl) {
    titleEl.innerText = '📊 24時間スケジュール (' + (targetDateObj.getMonth() + 1) + '/' + targetDateObj.getDate() + ')';
  }

  const dayTasks = tasks.filter(t => t.datetime.startsWith(targetDateStr));
  dayTasks.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  const labels = [];
  const durations = [];
  const pColors = [];
  const cColors = [];

  let currentTime = 0; // 0:00 (0分)

  dayTasks.forEach(task => {
    const startDt = new Date(task.datetime);
    const endDt = task.endDatetime ? new Date(task.endDatetime) : new Date(startDt.getTime() + 3600000);

    const startMin = startDt.getHours() * 60 + startDt.getMinutes();
    let endMinCalc = endDt.getHours() * 60 + endDt.getMinutes();

    if (endDt.getDate() !== startDt.getDate() || endMinCalc <= startMin) {
      endMinCalc = 1440;
    }

    const actualStart = Math.max(startMin, currentTime);
    if (actualStart >= 1440) return;

    // 空き時間
    if (actualStart > currentTime) {
      labels.push('空き時間');
      durations.push(actualStart - currentTime);
      pColors.push('#f0f3f8');
      cColors.push('#f0f3f8');
      currentTime = actualStart;
    }

    // 予定時間
    const taskEndMin = Math.min(1440, endMinCalc);
    const taskDuration = Math.max(0, taskEndMin - currentTime);

    if (taskDuration > 0) {
      const startTimeStr = startDt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      const endTimeStr = endDt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      labels.push(task.title + ' (' + startTimeStr + '〜' + endTimeStr + ')');
      durations.push(taskDuration);
      pColors.push(priorityColors[task.priority] || '#ccc');
      cColors.push(categoryColors[task.category] || '#ccc');
      currentTime = taskEndMin;
    }
  });

  // 残り時間の補填
  if (currentTime < 1440) {
    labels.push('空き時間');
    durations.push(1440 - currentTime);
    pColors.push('#f0f3f8');
    cColors.push('#f0f3f8');
  }

  if (typeof Chart === 'undefined') {
    console.warn('Chart.jsライブラリが読み込まれていません。');
    return;
  }

  if (categoryChart) {
    categoryChart.destroy();
  }

  // 3時間ごとの目盛り線・文字プラグイン
  const clockTicksPlugin = {
    id: 'clockTicks',
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data || !meta.data[0]) return;

      const x0 = (chartArea.left + chartArea.right) / 2;
      const y0 = (chartArea.top + chartArea.bottom) / 2;
      const outerRadius = meta.data[0].outerRadius;

      if (!outerRadius) return;

      ctx.save();
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.strokeStyle = '#a0a0a0';
      ctx.lineWidth = 1.5;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const timeLabels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

      for (let i = 0; i < 8; i++) {
        const hour = i * 3;
        const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2;

        const innerR = outerRadius;
        const outerR = outerRadius + 5;
        const textR = outerRadius + 18;

        ctx.beginPath();
        ctx.moveTo(x0 + innerR * Math.cos(angle), y0 + innerR * Math.sin(angle));
        ctx.lineTo(x0 + outerR * Math.cos(angle), y0 + outerR * Math.sin(angle));
        ctx.stroke();

        ctx.fillText(timeLabels[i], x0 + textR * Math.cos(angle), y0 + textR * Math.sin(angle));
      }

      ctx.restore();
    }
  };

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          label: '重要度 (外側)',
          data: durations,
          backgroundColor: pColors,
          borderWidth: 1,
          borderColor: '#ffffff',
          weight: 1
        },
        {
          label: 'カテゴリ (内側)',
          data: durations,
          backgroundColor: cColors,
          borderWidth: 1,
          borderColor: '#ffffff',
          weight: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      rotation: 0, // 00:00が真上（12時）
      circumference: 360,
      layout: {
        padding: 35
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.chart.data.labels[context.dataIndex];
              const minutes = context.parsed;
              const hours = (minutes / 60).toFixed(1);
              return context.dataset.label + ': ' + label + ' (' + hours + '時間)';
            }
          }
        }
      }
    },
    plugins: [clockTicksPlugin]
  });
}

// ページの読み込み完了時に安全に初期描画を実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', saveAndRender);
} else {
  saveAndRender();
}

