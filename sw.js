// サービスワーカーのインストール（準備）
self.addEventListener('install', (event) => {
    console.log('サービスワーカーが準備完了しました！');
    self.skipWaiting();
});

// サービスワーカーの有効化
self.addEventListener('activate', (event) => {
    console.log('サービスワーカーが稼働を開始しました！');
    return self.clients.claim();
});

// 画面（script.js）からの通知命令を受け取る処理
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data;
        
        // アプリが閉じられていても、OSのシステム通知を裏から発生させます！
        self.registration.showNotification(title, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827522.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/1827/1827522.png',
            vibrate: [200, 100, 200] // スマホならバイブレーションも鳴らします！
        });
    }
});