var bg = chrome.extension.getBackgroundPage();
var Permissible = bg.Permissible;
var AlartDay = bg.AlartDay;

var tabId;

chrome.tabs.getSelected(window.id, function(tab){
    console.log(tab);
    tabId = tab.id;
    console.log(tabId);
});

function BMCtl($scope, $interval){
    $scope.bookmarks = [];
    
    // DBのデータをモデルbookmarksに入れていく
    bg.db.transaction(function(tx){
        tx.executeSql('SELECT * FROM Bookmark', [], function(tx, rs){
            for(var i=0; i<rs.rows.length; i++){
                var row = rs.rows.item(i);
                var alart = $scope.compareDate(row.date);
                $scope.bookmarks.push({
                    id: row.id,
                    favicon: row.favicon,
                    title: row.title,
                    url: row.url,
                    date: row.date,
                    alart: alart
                });
                console.log($scope.bookmarks);
            }
        });
    });
    
    $scope.$watch('bookmarks', function(bookmarks){
        var length = bookmarks.length;
        $scope.Count = length;
    }, true);
    
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
        if(length <= Permissible){
            chrome.browserAction.setBadgeBackgroundColor({
                color: [0,0,255, 255]
            });
        } else {
            chrome.browserAction.setBadgeBackgroundColor({
                color: [255,0,0, 255]
            });
        }
    }
    
    // リストのブックマークを全てリストア
    $scope.restoreAll = function(){
        bg.db.transaction(function(tx){
            tx.executeSql('SELECT * FROM Bookmark', [], function(tx, rs){
                for(var i=0; i<rs.rows.length; i++){
                    var row = rs.rows.item(i);
                    chrome.tabs.create({url: row.url}, function(tab){
                        console.log('create tab!');
                    });
                    $scope.bookmarks.some(function(v, i){
                        if(v.id==row.id) $scope.bookmarks.splice(i, 1); // 任意のブックマークをBookmarkから削除
                    });
                    tx.executeSql('DELETE FROM Bookmark WHERE id = ?', [row.id]);
                    $scope.ShowBookmarks($scope.bookmarks.length); // バッヂを更新
                }
                $scope.deleteTab();
            });
        });
        $interval($scope.bookmarks.push(), 100, 1);
    }
    
    // リストのブックマークを全てデリート
    $scope.deleteAll = function(){
        ret = confirm("本当に削除してもよろしいですか？");
        if(ret == true){
            $scope.bookmarks.length = 0;
            bg.db.transaction(function(tx){
                tx.executeSql('DELETE FROM Bookmark');
                $scope.ShowBookmarks($scope.bookmarks.length); // バッヂを更新
            });
        }
    }
    
    // 開いているタブを全てブックマーク
    $scope.bookmarkAll = function(){
        chrome.tabs.query({currentWindow: true}, function(allTab){
            bg.db.transaction(function(tx){
                for(var i=0; i<allTab.length; i++){
                    if(allTab[i].id != tabId){ // リストのページ以外
                        console.log(allTab[i]);
                        // まずモデルへ
                        if(allTab[i].favIconUrl != undefined){
                            var favicon = allTab[i].favIconUrl
                        } else {
                            var favicon = null;
                        }
                        $scope.bookmarks.push({
                            favicon: favicon,
                            title: allTab[i].title,
                            url: allTab[i].url,
                            date: bg.getDateString()
                        });
                        
                        // 次にデータベースへ
                        tx.executeSql('INSERT INTO Bookmark (favicon, title, url, date) VALUES (?, ?, ?, ?);', [favicon, allTab[i].title, allTab[i].url, bg.getDateString()]);
                    }
                }
                //id更新
                tx.executeSql('SELECT * FROM Bookmark', [], function(tx, rs){
                    for(var i=0; i<rs.rows.length; i++){
                        var row = rs.rows.item(i);
                        tx.executeSql('UPDATE Bookmark SET id = ? WHERE url = ?', [i, row.url]);
                    }
                });
                $scope.ShowBookmarks($scope.bookmarks.length); // バッヂを更新
                $interval($scope.bookmarks.push(), 200, 1);
            });
        });
    }
    
    // リストページのタブを削除
    $scope.deleteTab = function(){
        console.log(tabId);
        chrome.tabs.remove(tabId, function(){
            console.log('delete tab!');
        });
    }
    
    // 今日と引数の日付を比較して日数がAlartDayよりも大きければtrueを，小さければfalseを返す
    $scope.compareDate = function(Day){
        var status = false; // 最初はfalse
        var dt = new Date(Day);
        var today = new Date(bg.getDateString());
        
        var diff = today - dt;
        var diffDay = diff / 86400000; // 1日は86400000ミリ秒
        console.log('compareDate');
        console.log(diffDay);
        
        if(diffDay >= AlartDay){ // 日数を比較
            status = true;
        }
        return status;
    }
    
    $interval($scope.bookmarks.push(), 200, 1); // 時間差で1/10秒後にpushメソッドを呼び出す
}
