var Currentpage;

/* Optionsから設定を取得(設定されていなければデフォルト値に設定) */
if(!localStorage.getItem('permissible')){
    localStorage.setItem('permissible', 5);
}
if(!localStorage.getItem('AlartDay')){
    localStorage.setItem('AlartDay', 3);
}
if(!localStorage.getItem('ShowBookmarkList')){
    localStorage.setItem('ShowBookmarkList', 'no');
}
if(!localStorage.getItem('ShowList_ft')){
    localStorage.setItem('ShowList_ft', 'yes');
}
if(!localStorage.getItem('RemoveTab')){
    localStorage.setItem('RemoveTab', 'no');
}

var Permissible = localStorage.getItem('permissible');           // 許容するブックマーク数
var AlartDay = localStorage.getItem('AlartDay');                 // これ以上すぎると警告を出す
var ShowBookmarkList = localStorage.getItem('ShowBookmarkList'); // ブックマークした時にリストを常に表示するか
var ShowList_ft = localStorage.getItem('ShowList_ft');           // ブラウザを起動した時にリストを表示するかどうか
var RemoveTab = localStorage.getItem('RemoveTab');               // ブックマークした時にそのタブを削除するかどうか

/* データベースの作成 */
try{
    if(!window.openDatabase){
        alert('not supported');
    } else {
        var shortName = 'Bookmarker_Database';
        var version = '2.0';
        var displayName = 'Bookmarker Database';
        var maxSize = 65536;
        var db = openDatabase(shortName, version, displayName, maxSize);
    }
} catch(e) {
    if (e == 2){
        alert('Invalid database version');
    } else {
        alert('Unknown error' +e+ '.');
    }
}

db.transaction(function(tx){
    /* ---------- テーブル作成 ---------- */
    // Bookmark : ブックマーク用のテーブル
    
    // テーブルを作る.もしすでにあれば一度削除.
    //tx.executeSql('DROP TABLE IF EXISTS Bookmark;');
    tx.executeSql('CREATE TABLE IF NOT EXISTS Bookmark (id INTEGER, favicon TEXT, title TEXT, url TEXT, date TEXT);');
    
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    Currentpage = new chara(tab.title, tab.url);
});

// Bookmarksにデータが一つ以上あればbookmarker.htmlを開ける
if(ShowList_ft == 'yes'){
    db.transaction(function(tx){
        tx.executeSql('SELECT * FROM Bookmark', [], function(tx, rs){
            /* ブラウザ起動時，bookmarker.htmlを開ける */
            if(rs.rows.length != 0){
                ShowBadge(String(rs.rows.length));
                SetBadgeColor(rs.rows.length);
                chrome.tabs.create({url: 'bookmarker.html'}, function(tab){
                    console.log('create tab!');
                });
            }
        });
    });
}

/* コンテクストメニューの定義 */
// 現在のページをブックマーク
chrome.contextMenus.create({
    'title': 'このページをブックマーク',
    'contexts': ["page", "frame", "selection", "editable", "link", "image", "video", "audio"],
    'onclick': function(info, tab){
        AddBookmark(tab);
    }
});
// bookmarker.htmlを表示
chrome.contextMenus.create({
    'title': 'ブックマークリストを表示',
    'contexts': ["page", "frame", "selection", "editable", "link", "image", "video", "audio"],
    'onclick': function(info, tab){
        chrome.tabs.create({url: 'bookmarker.html'}, function(tab){
            console.log('create tab!');
        });
    }
});

// 【ver.2】ポップアップを廃止してiconをクリックするだけでブックマーク
chrome.browserAction.onClicked.addListener(function(tab){
    AddBookmark(tab);
});

//コンストラクタ(もどき)
function chara(title, url){
    this.title = title;
    this.url = url;
}

// localStorageの変更をチェック
window.addEventListener('storage', function(e){
    console.log(localStorage);
    Permissible = localStorage.getItem('permissible');
    AlartDay = localStorage.getItem('AlartDay');
    ShowBookmarkList = localStorage.getItem('ShowBookmarkList');
    ShowList_ft = localStorage.getItem('ShowList_ft');
    RemoveTab = localStorage.getItem('RemoveTab');
}, false);

// ショートカットキーのイベントリスナー
chrome.commands.onCommand.addListener(function(command){
    console.log('command: ' +command);
    if(command == 'Show BookmarkList'){
        chrome.tabs.create({url: 'bookmarker.html'}, function(tab){
            console.log('create tab!');
        });
    }
});

/* ---------------------------------------------- 
             ユーティリティ関数の定義 
 ---------------------------------------------- */

/* tab情報を引数にしてそのタブのページをブックマークする関数 */
function AddBookmark(tab){
    console.log('icon clicked!');
    db.transaction(function(tx){
        if(tab.favIconUrl != undefined){
            var favicon = tab.favIconUrl;
        } else {
            var favicon = null;
        }
        tx.executeSql('INSERT INTO Bookmark (favicon, title, url, date) VALUES (?, ?, ?, ?);', [favicon, tab.title, tab.url, getDateString()], nullDataHandler, errorHandler);
        // データ追加後，全てのデータのidをアップデート
        tx.executeSql('SELECT * FROM Bookmark', [], function(tx, rs){
            for(var i=0; i<rs.rows.length; i++){
                var row = rs.rows.item(i);
                tx.executeSql('UPDATE Bookmark SET id = ? WHERE url = ?', [i, row.url]);
            }
            ShowBadge(String(rs.rows.length)); // バッヂを更新
            SetBadgeColor(rs.rows.length);
        });
        // 設定されていればそのタブを削除
        if(RemoveTab == 'yes'){
            chrome.tabs.remove(tab.id, function(){
                console.log('remove tab!');
            });
        }
        // 設定されていればリストを表示．但しアクティブにはしない(多分うっとうしいので)
        if(ShowBookmarkList == 'yes'){
            chrome.tabs.query({currentWindow: true}, function(allTab){
                for(var i=0; i<allTab.length; i++){
                    console.log(allTab[i]);
                    if(allTab[i].title == 'BookMarker'){ // 既に開いていればタブを一度閉じる
                        chrome.tabs.remove(allTab[i].id, function(){
                            console.log('remove tab!');
                        });
                    }
                }
                chrome.tabs.create({url: 'bookmarker.html', active: false}, function(tab){
                    console.log('create tab!');
                });
            });
        } else { // 設定されていなくても開いていればそのタブをリロード
            chrome.tabs.query({currentWindow: true}, function(allTab){
                for(var i=0; i<allTab.length; i++){
                    console.log(allTab[i]);
                    if(allTab[i].title == 'BookMarker'){
                        chrome.tabs.reload(allTab[i].id, {}, function(){
                            console.log('reload tab!');
                        });
                    }
                }
            });
        }
        // injectedにメッセージを送る
        chrome.tabs.sendMessage(tab.id, {greeting: "display_message"}, function(response){
            console.log('send message!');
        });
    });
}

/* executeSqlの成功時コールバック関数 */
function nullDataHandler(transaction, results) {
    
}

/* executeSqlの失敗時コールバック関数 */
function errorHandler(transaction, error) {
  alert('Error was ' + error.message + ' (Code ' + error.code + ')');
}

/* 今日の日付の文字列を返す関数(例: 2013/11/20) */
function getDateString(){
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth()+1;
    var day = date.getDate();
    
    var DateString = year +'/'+ month +'/'+ day;
    
    return DateString;
}

/* バッヂを表示する関数(引数を規定のオブジェクトのプロパティに設定してAPIを使ってバッヂを表示) */
function ShowBadge(text, id){
    var BadgeInfo = {
        text: text,
        tabId: id
    };
    chrome.browserAction.setBadgeText(BadgeInfo);
}

/* 5以下なら青色，6以上なら赤色にバッヂの色を変化させる(ついでに6以上なら警告を出す) */
function SetBadgeColor(number){
    if(number <= Permissible){
        chrome.browserAction.setBadgeBackgroundColor({
            color: [0,0,255, 255]
        });
    } else {
        alert('溜め込み過ぎではありませんか？');
        chrome.browserAction.setBadgeBackgroundColor({
            color: [255,0,0, 255]
        });
    }
}