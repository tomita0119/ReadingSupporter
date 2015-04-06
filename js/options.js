/*
【メモ】
Chrome拡張機能の場合，イベントハンドラを定義する際は
・clickメソッドじゃなくてliveメソッドを使う
・body要素の後で読み込む
どちらか(どっちも？)をしないとイベントに反応しなくなる．
*/

// localStorageの値を取得
var permissible;
var AlartDay;
var ShowBookmarkList;
var ShowList_ft;
if(!localStorage.getItem('permissible')){
    permissible = 5;
} else {
    permissible = localStorage.getItem('permissible');
}
if(!localStorage.getItem('AlartDay')){
    AlartDay = 3;
} else {
    AlartDay = localStorage.getItem('AlartDay');
}
if(!localStorage.getItem('ShowBookmarkList')){
    ShowBookmarkList = 'no';
} else {
    ShowBookmarkList = localStorage.getItem('ShowBookmarkList');
}
if(!localStorage.getItem('ShowList_ft')){
    ShowList_ft = 'yes';
} else {
    ShowList_ft = localStorage.getItem('ShowList_ft');
}
if(!localStorage.getItem('RemoveTab')){
    RemoveTab = 'no';
} else {
    RemoveTab = localStorage.getItem('RemoveTab');
}


// 現在設定されている設定に初期化
$('#select1 option[value=' +permissible+ ']').attr('selected', true);
$('#select2 option[value=' +AlartDay+ ']').attr('selected', true);
$('#radio1 input[value=' +ShowBookmarkList+ ']').attr('checked', true);
$('#radio2 input[value=' +ShowList_ft+ ']').attr('checked', true);
$('#radio3 input[value=' +RemoveTab+ ']').attr('checked', true);


// セレクトボックスが変更されるとlocalStorageを更新
$('#select1').live('change', function(){
    console.log('changed');
    localStorage.setItem('permissible', $(this).val());
});
$('#select2').live('change', function(){
    console.log('changed');
    localStorage.setItem('AlartDay', $(this).val());
});
$('input[name="showbookmarklist"]:radio').live('change', function(){
    console.log('changed');
    localStorage.setItem('ShowBookmarkList', $(this).val());
});
$('input[name="showlist_ft"]:radio').live('change', function(){
    console.log('changed');
    localStorage.setItem('ShowList_ft', $(this).val());
});
$('input[name="removetab"]:radio').live('change', function(){
    console.log('changed');
    localStorage.setItem('RemoveTab', $(this).val());
});