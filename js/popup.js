var bg = chrome.extension.getBackgroundPage();
var ReadingPage = new Array();

/* 現在のページのタイトルとURLを取得してReadingPageに入れる(0にfavicon，1にタイトル，2にURL) */
chrome.tabs.getSelected(window.id, function(tab){
    if(tab.favIconUrl != undefined){
        var ReadingPage[0] = tab.favIconUrl;
    } else {
        var ReadingPage[0] = null;
    }
    ReadingPage[1] = tab.title;
    ReadingPage[2] = tab.url;
});

function MainCtl($scope, $interval){
    $scope.bookmarks = [];
    
    /*
    【バグ】
    以下の処理でちゃんとモデルには追加されるが，ビュー側に反映されない
    とりあえず一番下の$interval(...でとりあえずなんとかなるっぽい
*/
    // ポップアップを開けるとDBのデータをbookmarksに追加
    bg.db.transaction(function(tx){
        tx.executeSql('SELECT * FROM Bookmark', [], function(tx, rs){
            for(var i=0; i<rs.rows.length; i++){
                var row = rs.rows.item(i);
                //tx.executeSql('UPDATE Bookmark SET id = ? WHERE url = ?', [i, row.url]);
                $scope.bookmarks.push({
                    id: row.id,
                    favicon: row.favicon,
                    title: row.title,
                    url: row.url,
                    date: row.date
                });
            }
            $scope.ShowBookmarks($scope.bookmarks.length);
        });
    });
    
    $scope.addBookmark = function(){
        // まずbookmarksにpushしてビューに反映
        $scope.bookmarks.push({
            favicon: ReadingPage[0],
            title: ReadingPage[1],
            url: ReadingPage[2],
            date: bg.getDateString()
        });
        
        // その後データベースへ
        bg.db.transaction(function(tx){
            tx.executeSql('INSERT INTO Bookmark (favicon, title, url, date) VALUES (?, ?, ?, ?);', [ReadingPage[0], ReadingPage[1], ReadingPage[2], bg.getDateString()], bg.nullDataHandler, bg.errorHandler);
            // データ追加後，全てのデータのidをアップデート
            tx.executeSql('SELECT * FROM Bookmark', [], function(tx, rs){
                for(var i=0; i<rs.rows.length; i++){
                    var row = rs.rows.item(i);
                    tx.executeSql('UPDATE Bookmark SET id = ? WHERE url = ?', [i, row.url]);
                }
            });
            $scope.ShowBookmarks($scope.bookmarks.length); // バッヂを更新
        });
    }
    
    $scope.removeBookmark = function(index){
        console.log(index);
        // indexがundefined，つまりidが振られてない時はreturn
        if(index == undefined){
            return;
        }
        $scope.bookmarks.some(function(v, i){
            if(v.id==index) $scope.bookmarks.splice(i, 1); // 任意のブックマークをBookmarkから削除
        });
        //$scope.bookmarks.splice(index, 1);
        
        // データベースからも削除
        bg.db.transaction(function(tx){
            tx.executeSql('DELETE FROM Bookmark WHERE id = ?', [index]);
        });
        $scope.ShowBookmarks($scope.bookmarks.length); // バッヂを更新
    };
    
    // bookmarksが1以上であればその数をバッヂとして表示．0の場合はバッヂを消す
    $scope.ShowBookmarks = function(length){
        if(length > 0){
            bg.ShowBadge(String(length));
        } else{
            bg.ShowBadge('');
        }
    }
    
    $interval($scope.bookmarks.push(), 100, 1); // 時間差で1/10秒後にpushメソッドを呼び出す
}