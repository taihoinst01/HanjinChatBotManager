
"use strict";
//가장 먼저 실행.
var saveBoardList = [];
var delayInMilliseconds = 500; //1 second = 1000 //db 조회 텀
var language;
; (function ($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function (data) {
            language = data.lang;

        }
    });

    $(document).ready(function () {
        getSimulUrl();
        var myDate = new Date();
        var month = myDate.getMonth() + 1;
        var prettyDate = month + '/' + myDate.getDate() + '/' + myDate.getFullYear();

        $('#startDate').val(prettyDate);
        $('#endDate').val(prettyDate);
    });


    $(function () {
       $( "#startDate" ).datepicker({
            dateFormat: 'mm/dd/yy',
        });
      
      $( "#endDate" ).datepicker({
            dateFormat: 'mm/dd/yy'
        });
    })
})(jQuery);

$.fn.isInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    //console.log('======================' + (elementBottom > viewportTop && elementTop < viewportBottom));
    return elementBottom > viewportTop && elementTop < viewportBottom;
};

$(document).scroll(function() {
    //INTENT SCORE 평균/최소/최대 
    for (var i=0; i<saveBoardList.length; i++) {
        if (saveBoardList[i].BOARD_URL == "drawScoreList") {
            if ($('#scoreTableBody').html().trim() == "") {
            //if ($('#scoreTableBody').html().trim() == "" && $('#scoreTableBody').isInViewport()) {
                //console.log('drawScoreList');
                saveBoardList.splice(i--, 1);
                drawScoreList();
            }   
        }
        //자주 묻는 질문에 대한 답변 top 10
        else if (saveBoardList[i].BOARD_URL == "getOftQuestion") {
            //if ($('#OftQuestionTableBody').html().trim() == "" && $('#OftQuestionTableBody').isInViewport()) {
            if ($('#OftQuestionTableBody').html().trim() == "") {
                //console.log('getOftQuestion');
                saveBoardList.splice(i--, 1);
                getOftQuestion();
            }   
        }
        //응답(평균/최대/최소)/평균 머무르는 시간
        else if (saveBoardList[i].BOARD_URL == "getResponseTime") {
            if ($('#responseTimeDiv').html().trim() == "" && $('#responseTimeDiv').isInViewport()) {
                //console.log('getResponseTime');
                saveBoardList.splice(i--, 1);
                getResponseTime();
            }   
        }
        //미답변 질문
        else if (saveBoardList[i].BOARD_URL == "drawNoneQuerytable") {
            if ($('#noneQueryDiv').html().trim() == "") {
            //if ($('#noneQueryDiv').html().trim() == "" && $('#noneQueryDiv').isInViewport()) {
                //console.log('drawNoneQuerytable');
                saveBoardList.splice(i--, 1);
                drawNoneQuerytable();
            }   
        }
        //고객 별 첫 질문 bar
        else if (saveBoardList[i].BOARD_URL == "drawFirstQuery") {
            if ($('#fistQueryDiv').html().trim() == "" && $('#fistQueryDiv').isInViewport()) {
                //console.log('drawFirstQuery');
                saveBoardList.splice(i--, 1);
                drawFirstQuery();
            } 
        }
        //고객 별 첫 질문 table
        else if (saveBoardList[i].BOARD_URL == "drawfirstQuerytable") {
            if ($('#fistQueryTable').html().trim() == "") {
            //if ($('#fistQueryTable').html().trim() == "" && $('#fistQueryTable').isInViewport()) {
                //console.log('drawfirstQuerytable');
                saveBoardList.splice(i--, 1);
                drawfirstQuerytable();
            } 
        }
        //시간대 별 질문수
        else if (saveBoardList[i].BOARD_URL == "getQueryByEachTime") {
            if ($('#timeOfDay_div').html().trim() == "" && $('#timeOfDay_div').isInViewport()) {
                //console.log('getQueryByEachTime');
                saveBoardList.splice(i--, 1);
                getQueryByEachTime();
            } 
        }
    }
});

$(document).ready(function () {
    selectAll();

    $('#searchBoardBtn').click(function () {
        $('#loadingModal').modal('show');
        selectAll();
    });
    
});

function selectAll() {

    getScorePanel();
    getCountPanel();
    /*
    * 로그인한 사람에 따라서 Dashboard 가 다르게 나온다.
    * 2018.08.28 Jun Hyoung Park
    */
    var drawScoreListHtml = "";
    var getOftQuestionHtml = "";
    var getResponseTimeHtml = "";
    var getQueryByEachTimeHtml = "";
    var drawNoneQuerytableHtml = "";
    var drawFirstQueryHtml = "";
    var drawfirstQuerytableHtml = "";

    $.ajax({
        type: 'POST',
        url: '/board/getDashboardInfo',
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }

            if (data.records > 0) {
                
                for (var i = 0; i < data.rows.length; i++) {
                    saveBoardList = data.rows;

                    //INTENT SCORE 평균/최소/최대 
                    if (data.rows[i].BOARD_URL == "drawScoreList") {
                        
                        drawScoreListHtml += '<section class="col-lg-5">';
                        drawScoreListHtml += '  <div class="box  color-palette-box">';
                        drawScoreListHtml += '	<div class="box-body">';
                        drawScoreListHtml += '		       <div class="box-header with-border dashb"><h3 class="box-title02">' + language.ANSWERED_INTENT_CNT + '</h3></div> ';
                        drawScoreListHtml += '		       <div class="Tbl_wrap">';
                        drawScoreListHtml += '			    <table class="table table-hover" summary="INTENT SCORE 평균/최소/최대">';
                        drawScoreListHtml += '				<colgroup><col width="40%"/><col width="15%"/></colgroup>';
                        //drawScoreListHtml += '				<colgroup><col width="40%"/><col width="15%"/><col width="15%"/><col width="15%"/><col width="15%"/></colgroup>';

                        drawScoreListHtml += '				<thead>';
                        drawScoreListHtml += '				      <tr>';
                        drawScoreListHtml += '					  <th>' + language.Intent_name + '</th>';
                        drawScoreListHtml += '					  <th>' + language.Number + '</th>';
                        //drawScoreListHtml += '					  <th>' + language.average + '</th>';
                        //drawScoreListHtml += '					  <th>' + language.minimum + '</th>';
                        //drawScoreListHtml += '					  <th>' + language.maximum + '</th>';
                        drawScoreListHtml += '				      </tr>';
                        drawScoreListHtml += '				</thead>';
                        drawScoreListHtml += '				<tbody id="scoreTableBody">';
                        
                        drawScoreListHtml += '				</tbody>';
                        drawScoreListHtml += '			    </table>';
                        drawScoreListHtml += '			    <div class="pagination_wrap" id="scoreTablePaging">';
                        drawScoreListHtml += '				<ul class="pagination pagination-sm no-margin">';

                        drawScoreListHtml += '				</ul>';
                        drawScoreListHtml += '			    </div>';
                        drawScoreListHtml += '			</div>';
                        drawScoreListHtml += '	</div>';
                        drawScoreListHtml += '	<div class="overlay" id="overlay_drawScoreList"><i class="fa fa-refresh fa-spin"></i></div>';
                        drawScoreListHtml += '  </div>';
                        drawScoreListHtml += '</section>';
                        $('#drawScoreListHtml').html(drawScoreListHtml);
                        if ($('#scoreTableBody').html().trim() == "" && $('#scoreTableBody').isInViewport()) {
                            //drawScoreList();
                        }   
                        //drawScoreList();
                    }
                    //자주 묻는 질문에 대한 답변 top 10
                    if (data.rows[i].BOARD_URL == "getOftQuestion") {

                        getOftQuestionHtml += '<section class="col-lg-7">';
                        getOftQuestionHtml += '   <div class="box  color-palette-box">';
                        getOftQuestionHtml += '	<div class="box-body">';
                        getOftQuestionHtml += '		       <div class="box-header with-border dashb"><h3 class="box-title02">' + language.Answers_to_Frequently_Asked_Questions + '</h3></div> ';
                        getOftQuestionHtml += '		       <div class="Tbl_wrap">';
                        getOftQuestionHtml += '			    <table class="table table-hover" summary="자주 묻는 질문에 대한 답변 top 10">';
                        getOftQuestionHtml += '				<colgroup><col width="2%"/><col width="50%"/><col width="20%"/><col width="8%"/><col width="10%"/></colgroup>';
                        getOftQuestionHtml += '				<thead>';
                        getOftQuestionHtml += '				      <tr class="text-center">';
                        getOftQuestionHtml += '					  <th> </th>';
                        getOftQuestionHtml += '					  <th>' + language.HangulQuestion + '</th>';
                        getOftQuestionHtml += '					  <th>' + language.Intent_name + '</th>';
                        getOftQuestionHtml += '					  <th>' + language.channel + '</th>';
                        getOftQuestionHtml += '					  <th>' + language.QuestionCount + '</th>';
                        getOftQuestionHtml += '				      </tr>';
                        getOftQuestionHtml += '				</thead>';
                        getOftQuestionHtml += '				<tbody id="OftQuestionTableBody">';

                        getOftQuestionHtml += '				</tbody>';
                        getOftQuestionHtml += '			    </table>';
                        getOftQuestionHtml += '			</div>';
                        getOftQuestionHtml += '	</div>';
                        getOftQuestionHtml += '	<div class="overlay" id="overlay_getOftQuestion"><i class="fa fa-refresh fa-spin"></i></div>';
                        getOftQuestionHtml += '   </div>';
                        getOftQuestionHtml += '</section>';
                        $('#getOftQuestionHtml').html(getOftQuestionHtml);
                        if ($('#OftQuestionTableBody').html().trim() == "" && $('#OftQuestionTableBody').isInViewport()) {
                            //getOftQuestion();
                        }  
                        //getOftQuestion();
                    }

                    //응답(평균/최대/최소)/평균 머무르는 시간
                    if (data.rows[i].BOARD_URL == "getResponseTime") {

                        getResponseTimeHtml += '   <div class="box  color-palette-box">';
                        getResponseTimeHtml += '<canvas id="areaChart" style="height:0"></canvas>';
                        getResponseTimeHtml += '	<div class="box-body">';
                        getResponseTimeHtml += '		       <div class="box-header with-border dashb"><h3 class="box-title02">' + language.RESPONSE_AVG_MAX_MIN_STAYTIME + '</h3></div> ';
                        getResponseTimeHtml += '				<div class="chart-responsive">';
                        getResponseTimeHtml += '				  <div class="chart" id="responseTimeDiv" style="height: 300px;"></div>';
                        getResponseTimeHtml += '				</div>';
                        getResponseTimeHtml += '	</div>';
                        getResponseTimeHtml += '	<div class="overlay" id="overlay_getResponseTime"><i class="fa fa-refresh fa-spin"></i></div>';
                        getResponseTimeHtml += '   </div>';
                        $('#getResponseTimeHtml').html(getResponseTimeHtml);
                        if ($('#responseTimeDiv').html().trim() == "" && $('#responseTimeDiv').isInViewport()) {
                            //getResponseTime();
                        }   
                        //getResponseTime();
                    }

                    //미답변 질문
                    if (data.rows[i].BOARD_URL == "drawNoneQuerytable") {

                        drawNoneQuerytableHtml += '<div class="box  color-palette-box">';
                        drawNoneQuerytableHtml += '	<div class="box-body">';
                        drawNoneQuerytableHtml += '	       <div class="box-header with-border dashb"><h3 class="box-title02">' + language.Unanswered_questions + '</h3></div> ';
                        drawNoneQuerytableHtml += '	       <div class="Tbl_wrap">';
                        drawNoneQuerytableHtml += '		    <table class="table table-hover" summary="미답변 질문">';
                        drawNoneQuerytableHtml += '			<colgroup><col width="35%"/><col width="10%"/><col width="5%"/>';
                        drawNoneQuerytableHtml += '				  <col width="15%"/>';
                        drawNoneQuerytableHtml += '			</colgroup>';
                        drawNoneQuerytableHtml += '			<thead>';
                        drawNoneQuerytableHtml += '			      <tr>';
                        drawNoneQuerytableHtml += '				  <th>' + language.HangulQuestion + '</th>';
                        drawNoneQuerytableHtml += '				  <th>' + language.channel + '</th>';
                        drawNoneQuerytableHtml += '				  <th>' + language.QuestionCount + '</th>';
                        drawNoneQuerytableHtml += '				  <th>' + language.Date + '</th>';
                        drawNoneQuerytableHtml += '			      </tr>';
                        drawNoneQuerytableHtml += '			</thead>';
                        drawNoneQuerytableHtml += '			<tbody id="noneQueryDiv">';

                        drawNoneQuerytableHtml += '			</tbody>';
                        drawNoneQuerytableHtml += '		    </table>';
                        drawNoneQuerytableHtml += '		    <div class="pagination_wrap" id="noneQueryDivTablePaging">';
                        drawNoneQuerytableHtml += '			<ul class="pagination pagination-sm no-margin">';

                        drawNoneQuerytableHtml += '			</ul>';
                        drawNoneQuerytableHtml += '		    </div>';
                        drawNoneQuerytableHtml += '		</div>';
                        drawNoneQuerytableHtml += '	</div>';
                        drawNoneQuerytableHtml += '	<div class="overlay" id="overlay_drawNoneQuerytable"><i class="fa fa-refresh fa-spin"></i></div>';
                        drawNoneQuerytableHtml += '</div>';
                        $('#drawNoneQuerytableHtml').html(drawNoneQuerytableHtml);
                        if ($('#noneQueryDiv').html().trim() == "" && $('#noneQueryDiv').isInViewport()) {
                            //drawNoneQuerytable();
                        }  
                        //drawNoneQuerytable();
                    }

                    //고객 별 첫 질문 bar
                    if (data.rows[i].BOARD_URL == "drawFirstQuery") {

                        drawFirstQueryHtml += '<section class="col-lg-4">';
                        drawFirstQueryHtml += '   <div class="box  color-palette-box">';
                        drawFirstQueryHtml += '	<div class="box-body">';
                        drawFirstQueryHtml += '		       <div class="box-header with-border dashb"><h3 class="box-title02">' + language.Customer_First_Questions + '</h3></div>';
                        drawFirstQueryHtml += '			<div class="chart-responsive">';
                        drawFirstQueryHtml += '			  <div class="chart" id="fistQueryDiv" style="height:300px;" ></div>';
                        drawFirstQueryHtml += '			</div>';
                        drawFirstQueryHtml += '	</div>';
                        drawFirstQueryHtml += '	<div class="overlay" id="overlay_drawFirstQuery"><i class="fa fa-refresh fa-spin"></i></div>';
                        drawFirstQueryHtml += '   </div>';
                        drawFirstQueryHtml += '</section>';
                        $('#drawFirstQueryHtml').html(drawFirstQueryHtml);
                        if ($('#fistQueryDiv').html().trim() == "" && $('#fistQueryDiv').isInViewport()) {
                            //drawFirstQuery();
                        } 
                        //drawFirstQuery();
                    }

                    //고객 별 첫 질문 table
                    if (data.rows[i].BOARD_URL == "drawfirstQuerytable") {

                        drawfirstQuerytableHtml += '<section class="col-lg-8">';
                        drawfirstQuerytableHtml += '   <div class="box  color-palette-box">';
                        drawfirstQuerytableHtml += '	<div class="box-body">';
                        drawfirstQuerytableHtml += '	       <div class="Tbl_wrap">';
                        drawfirstQuerytableHtml += '		    <table class="table table-hover" summary="">';
                        drawfirstQuerytableHtml += '			<colgroup><col width="60%"/><col width="10%"/><col width="8%"/><col width="15%"/></colgroup>';
                        drawfirstQuerytableHtml += '			<thead>';
                        drawfirstQuerytableHtml += '			    <tr>';
                        drawfirstQuerytableHtml += '				<th>' + language.HangulQuestion + '</th>';
                        drawfirstQuerytableHtml += '				<th>' + language.channel + '</th>';
                        drawfirstQuerytableHtml += '				<th>' + language.QuestionCount + '</th>';
                        drawfirstQuerytableHtml += '				<th>' + language.Date + '</th>';
                        drawfirstQuerytableHtml += '			    </tr>';
                        drawfirstQuerytableHtml += '			</thead>';
                        drawfirstQuerytableHtml += '			<tbody id="fistQueryTable">';

                        drawfirstQuerytableHtml += '			</tbody>';
                        drawfirstQuerytableHtml += '		    </table>';
                        drawfirstQuerytableHtml += '		    <div class="pagination_wrap" id="fistQueryTablePaging">';
                        drawfirstQuerytableHtml += '			<ul class="pagination pagination-sm no-margin">';

                        drawfirstQuerytableHtml += '			</ul>';
                        drawfirstQuerytableHtml += '		    </div>';
                        drawfirstQuerytableHtml += '		</div>';
                        drawfirstQuerytableHtml += '	<div class="overlay" id="overlay_drawfirstQuerytable"><i class="fa fa-refresh fa-spin"></i></div>';
                        drawfirstQuerytableHtml += '      </div>';
                        drawfirstQuerytableHtml += '</section>';
                        $('#drawfirstQuerytableHtml').html(drawfirstQuerytableHtml);
                        if ($('#fistQueryTable').html().trim() == "" && $('#fistQueryTable').isInViewport()) {
                            //drawfirstQuerytable();
                        } 
                        //drawfirstQuerytable();
                    }
                    
                    //시간대 별 질문수
                    if (data.rows[i].BOARD_URL == "getQueryByEachTime") {

                        getQueryByEachTimeHtml += '<div class="box  color-palette-box">';
                        getQueryByEachTimeHtml += '		<div class="box-body">';
                        getQueryByEachTimeHtml += '			       <div class="box-header with-border dashb"><h3 class="box-title02">' + language.QUESTION_CNT_EACH_HOUR + '</h3></div>';
                        getQueryByEachTimeHtml += '				<div class="chart-responsive">';
                        getQueryByEachTimeHtml += '				  <div class="chart" id="timeOfDay_div" style="height: 300px;"></div>';
                        getQueryByEachTimeHtml += '				</div>';
                        getQueryByEachTimeHtml += '		</div>';
                        getQueryByEachTimeHtml += '	<div class="overlay" id="overlay_getQueryByEachTime"><i class="fa fa-refresh fa-spin"></i></div>';
                        getQueryByEachTimeHtml += '</div>';
                        $('#getQueryByEachTimeHtml').html(getQueryByEachTimeHtml);
                        if ($('#timeOfDay_div').html().trim() == "" && $('#timeOfDay_div').isInViewport()) {
                            //getQueryByEachTime();
                        } 
                        //getQueryByEachTime();
                    }
                }
            }
            window.scrollTo(window.scrollX, window.scrollY - 1);
            window.scrollTo(window.scrollX, window.scrollY + 1);
            $('#loadingModal').modal('hide');
        }
    });
}


//INTENT SCORE 평균/최소/최대 테이블 페이지 버튼 클릭
$(document).on('click', '#scoreTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        drawScoreList($(this).val());
    }
});

//미답변 질문 테이블 페이지 버튼 클릭
$(document).on('click', '#noneQueryDivTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        drawNoneQuerytable($(this).val());
    }
});

//고객 별 첫 질문 테이블 페이지 버튼 클릭
$(document).on('click', '#fistQueryTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        drawfirstQuerytable($(this).val());
    }
});


function getFilterVal(page) {
/*
    var dateArr = $('#reservation').val().split('-');
    var startDate = $.trim(dateArr[0]);
    var endDate = $.trim(dateArr[1]);
*/
    var startDate = $('#startDate').val();
    var endDate = $('#endDate').val();

    var filterVal;
    if (page) {
        filterVal = {
            startDate: startDate, //$('input[name=daterangepicker_start]').val(),
            endDate: endDate, //$('input[name=daterangepicker_end]').val(),
            selDate: $('#selDate').val(),
            selChannel: $('#selChannel').val(),
            page: page
        };
    } else {
        filterVal = {
            startDate: startDate, //$('input[name=daterangepicker_start]').val(),
            endDate: endDate, //$('input[name=daterangepicker_end]').val(),
            selDate: $('#selDate').val(),
            selChannel: $('#selChannel').val()
        };
    }

    return filterVal;

}

//누적상담자수, 평균 응답 속도(ms), 평균 고객 질문 수, 평균 정상 답변율, 검색 응답률, 최대 고객 질문 수
function getScorePanel() {
        
    $('#allCustomer').text('Loading..');
    $('#avgReplySpeed').text('Loading..');
    $('#avgQueryCnt').text('Loading..');
    $('#avgCorrectAnswer').text('Loading..');
    $('#avgReply').text('Loading..');
    $('#maxQueryCnt').text('Loading..');
    //누적상담자수, 평균 응답 속도(ms), 평균 고객 질문 수
    getScorePanel1();
    
    setTimeout(function() {}, delayInMilliseconds);
    //평균 정상 답변율
    getScorePanel2();
    //검색 응답률
    //getScorePanel3();
    //최대 고객 질문 수
    //getScorePanel4();
}

//HISTORY 에서 SUCCESS, FAIL, ERROR, SUGGEST
function getCountPanel() {
    
    $('#successCount').text("Loading..");
    $('#failCount').text("Loading..");
    $('#errorCount').text("Loading..");
    $('#suggestCount').text("Loading..");
    $('#sapWord').text("Loading..");
    $('#sapPasswordInit').text("Loading..");
    $('#smallTalkCount').text("Loading..");
    $.ajax({
        url: '/board/getCountPanel',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            var boardCount = data.list[0];
            var checkDataCnt = data.list.length

            if(checkDataCnt==0){
                $('#totalCount').text("0");
                $('#successCount').text("0");
                $('#failCount').text("0");
                $('#errorCount').text("0");
                $('#sapWord').text("0");
                $('#sapPasswordInit').text("0");
                $('#suggestCount').text("0");
                $('#smallTalkCount').text("0");
            }else{
                $('#totalCount').text(boardCount.총합);
                $('#successCount').text(boardCount.응답);
                $('#failCount').text(boardCount.미응답);
                $('#errorCount').text(boardCount.ERROR);
                $('#sapWord').text(boardCount.용어사전);
                $('#sapPasswordInit').text(boardCount.SAP초기화);
                $('#suggestCount').text(boardCount.건의사항);
                $('#smallTalkCount').text(boardCount.SMALLTALK);
            }
            /*
            $('#totalCount').text(boardCount.총합);
            $('#successCount').text(boardCount.응답);
            $('#failCount').text(boardCount.미응답);
            $('#errorCount').text(boardCount.ERROR);
            $('#sapWord').text(boardCount.용어사전);
            $('#sapPasswordInit').text(boardCount.SAP초기화);
            $('#suggestCount').text(boardCount.건의사항);
            $('#smallTalkCount').text(boardCount.SMALLTALK);
            */
        },
        error : function() {   // 오류가 발생했을 때 호출된다. 
            console.log("error");
            $('#totalCount').text("0");
            $('#successCount').text("0");
            $('#failCount').text("0");
            $('#errorCount').text("0");
            $('#sapWord').text("0");
            $('#sapPasswordInit').text("0");
            $('#suggestCount').text("0");
        },
        complete : function () {   // 정상이든 비정상인든 실행이 완료될 경우 실행될 함수
            
        }
    })
}


//INTENT SCORE 평균/최소/최대
function drawScoreList(page) {

    $.ajax({
        url: '/board/intentScore',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(page),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.error_code != null && data.error_message != null) {
                
                makeReloadEvent('overlay_drawScoreList');

            } else {
                removeReloadEvent('overlay_drawScoreList');

                $("#overlay_drawScoreList").remove();
                var list = data.list;
                var scoreList = "";
                var minData = 0;
                var maxData = 0;

                for (var i = 0; i < list.length; i++) {
                    //minData = list[i].intentScoreMIN;
                    //maxData = list[i].intentScoreMAX;

                    //minData = minData.toFixed(4);
                    //maxData = maxData.toFixed(4);

                    scoreList += "<tr><td class=\"text-left\">" + list[i].intentName + "</td>";
                    scoreList += "<td>" + list[i].intentCount + "</td>";
                    //scoreList += "<td>" + list[i].intentScoreAVG + "</td>";
                    //scoreList += "<td>" + minData + "</td>";
                    //scoreList += "<td>" + maxData + "</td></tr>";
                    scoreList += "</tr>";
                }

                $("#scoreTableBody").html(scoreList);
                $('#scoreTablePaging .pagination').html('').append(data.pageList);
            }
        }
    })
}

//자주 묻는 질문에 대한 답변 top 10
function getOftQuestion() {
    $.ajax({
        url: "/board/getOftQuestion",
        type: "post",
        data: getFilterVal(),
    }).done(function (data) {
        if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
            alert($('#dupleMassage').val());
            location.href = '/users/logout';
        }
        if (data.error_code != null && data.error_message != null) {
            makeReloadEvent('overlay_getOftQuestion');
        } else {
            removeReloadEvent('overlay_getOftQuestion');
            $("#overlay_getOftQuestion").remove();
            var tableList = data.list;

            var scoreList = "";

            for (var i = 0; i < tableList.length; i++) {
                scoreList += "<tr><td>" + Number(i + 1) + "</td>";
                //scoreList += "<td>" + tableList[i].INTENT + "</td>";
                scoreList += "<td class=\"text-left\">" + tableList[i].KORQ + "</td>";
                scoreList += "<td>" + tableList[i].INTENT + "</td>";
                scoreList += "<td>" + tableList[i].CHANNEL + "</td>";
                scoreList += "<td>" + tableList[i].QNUM + "</td>";
                scoreList += "</tr>";
            }

            $("#OftQuestionTableBody").html(scoreList);

        }
    });
}

//응답(평균/최대/최소)/평균 머무르는 시간
function getResponseTime() {

    $.ajax({
        url: '/board/getResponseScore',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.error_code != null && data.error_message != null) {
                makeReloadEvent('overlay_getResponseTime');
            } else {
                removeReloadEvent('overlay_getResponseTime');
                $("#overlay_getResponseTime").remove();
                //BAR CHART
                var bar = new Morris.Bar({
                    element: 'responseTimeDiv',
                    resize: true,
                    data: [
                        { y: '평균 답변시간', a: data.list[0].REPLY_AVG },
                        { y: '최대 답변시간', a: data.list[0].MAX_REPLY },
                        { y: '최소 답변시간', a: data.list[0].MIN_REPLY },
                        { y: '총 답변 시간', a: data.list[0].REPLY_SUM }
                    ],
                    barColors: ['#5181ae', '#ff7659'],
                    xkey: 'y',
                    ykeys: ['a'],
                    labels: ['ms'],
                    hideHover: 'auto'
                });
            }
        }
    });
}



//시간대별 질문수
function getQueryByEachTime() {
    $.ajax({
        url: '/board/getQueryByEachTime',
        //dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.error_code != null && data.error_message != null) {
                makeReloadEvent('overlay_getQueryByEachTime');
            } else {
                removeReloadEvent('overlay_getQueryByEachTime');
                $("#overlay_getQueryByEachTime").remove();
                //BAR CHART
                var arrList = data.list;
                var jsonList = [];
                for (var i = 0; i < arrList.length; i++) {

                    var timeObj = new Object();

                    timeObj.y = pad(i, 2) + ":00";
                    timeObj.a = arrList[i];

                    jsonList.push(timeObj);

                }


                //BAR CHART
                var bar = new Morris.Bar({
                    element: 'timeOfDay_div',
                    resize: true,
                    data: jsonList,
                    barColors: ['#5181ae', '#ff7659'],
                    xkey: 'y',
                    ykeys: ['a'],
                    labels: ['질문수'],
                    hideHover: 'auto'
                });
            }


        }
    })
}

function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}


//미답변 질문
function drawNoneQuerytable(page) {
    $.ajax({
        url: '/board/nodeQuery',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(page),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            $("#overlay_drawNoneQuerytable").remove();
            if(data.length==0){
                $("#noneQueryDiv").html('<tr><td colspan=9>dfafdsa</td></tr>');
                $('#noneQueryDivTablePaging .pagination').html('').append('');
            }else{
                if (data.error_code != null && data.error_message != null) {
                    makeReloadEvent('overlay_drawNoneQuerytable');
                } else {
                    removeReloadEvent('overlay_drawNoneQuerytable');
                    var list = data.list;
                    var noneList = "";
    
                    for (var i = 0; i < list.length; i++) {
                        noneList += "<tr>";
                        //noneList += "<tr><td>" + list[i].intent + "</td>";
                        noneList += "<td>" + list[i].korQuery + "</td>";
                        noneList += "<td>" + list[i].channel + "</td>";
                        noneList += "<td>" + list[i].queryCnt + "</td>";
                        noneList += "<td>" + list[i].queryDate + "</td>";
                        //noneList += "<td>" + list[i].result + "</td>";
                        //noneList += "<td>" + list[i].textResult + "</td>";
                        //noneList += "<td>" + list[i].cardResult + "</td>";
                        //noneList += "<td>" + list[i].cardBtnResult + "</td>";
                        noneList += "</tr>";
                    }
    
                    $("#noneQueryDiv").html(noneList);
                    $('#noneQueryDivTablePaging .pagination').html('').append(data.pageList);
    
                }
            }



            
        },
        error : function() {   // 오류가 발생했을 때 호출된다. 
            console.log("error");
        },
        complete : function () {   // 정상이든 비정상인든 실행이 완료될 경우 실행될 함수
            
        }
    });
}

//고객 별 첫 질문 //bar
function drawFirstQuery() {
    $.ajax({
        url: '/board/firstQueryBar',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }

            if (data.error_code != null && data.error_message != null) {
                makeReloadEvent('overlay_drawFirstQuery');
            } else {
                removeReloadEvent('overlay_drawFirstQuery');
                $("#overlay_drawFirstQuery").remove();
                var jsonList = [];
                for (var i = 0; i < data.list.length; i++) {

                    var timeObj = new Object();

                    timeObj.x = data.list[i].INTENT;
                    timeObj.a = data.list[i].INTENT_CNT;

                    jsonList.push(timeObj);
                }

                //BAR CHART
                var bar = new Morris.Bar({
                    element: 'fistQueryDiv',
                    resize: true,
                    data: jsonList,
                    barColors: ['#5181ae', '#ff7659'],
                    xkey: 'x',
                    ykeys: ['a'],
                    labels: ['CNT'],
                    hideHover: 'auto'
                });
            }

        }
    })
};

//고객 별 첫 질문 //table
function drawfirstQuerytable(page) {
    $.ajax({
        url: '/board/firstQueryTable',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(page),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.error_code != null && data.error_message != null) {
                makeReloadEvent('overlay_drawfirstQuerytable');
            } else {
                removeReloadEvent('overlay_drawfirstQuerytable');

                $("#overlay_drawfirstQuerytable").remove();
                var list = data.list;
                var firstList = "";

                for (var i = 0; i < list.length; i++) {
                    firstList += "<tr>";
                    //firstList += "<tr><td>" + list[i].intent_name + "</td>";
                    firstList += "<td>" + list[i].koQuestion + "</td>";
                    firstList += "<td>" + list[i].channel + "</td>";
                    firstList += "<td>" + list[i].query_cnt + "</td>";
                    firstList += "<td>" + list[i].query_date + "</td>";
                    firstList += "</tr>";
                }
                $("#fistQueryTable").html(firstList);
                $('#fistQueryTablePaging .pagination').html('').append(data.pageList);

            }
        },
        error : function() {   // 오류가 발생했을 때 호출된다. 
            console.log("error");
        },
        complete : function () {   // 정상이든 비정상인든 실행이 완료될 경우 실행될 함수
            
        }
    });
}

function getScorePanel1() {
    $.ajax({
        url: '/board/getScorePanel1',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.list1) {
                var scores = data.list1[0];
                $('#allCustomer').text(scores.CUSOMER_CNT);
            } else {
                $('#allCustomer').text(0);
            }
            if (data.list2) {
                var scores = data.list2[0];
                $('#avgReplySpeed').text(scores.REPLY_SPEED);
                $('#avgQueryCnt').text(scores.USER_QRY_AVG);
            } else {
                $('#avgReplySpeed').text(0);
                $('#avgQueryCnt').text(0);
            }
        },
        error : function() {   
            $('#allCustomer').text(0);
            $('#avgReplySpeed').text(0);
            $('#avgQueryCnt').text(0);
        },
        complete : function() {
            //getScorePanel4();
        }
    })
}


function getScorePanel2() {
    $.ajax({
        url: '/board/getScorePanel2',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.result) {
                var scores = data.list;
                var CORRECT_QRY = scores.toString();
                $('#avgCorrectAnswer').text((CORRECT_QRY.length > 4 ? CORRECT_QRY.substr(0, 4) : CORRECT_QRY) + '%');
            } else {
                $('#avgCorrectAnswer').text(0);
            }
        },
        error : function() {   
            $('#avgCorrectAnswer').text(0);
        },
        complete : function() {
            getScorePanel4();
        }
    })
}
function getScorePanel3() {
    $.ajax({
        url: '/board/getScorePanel3',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.result) {
                var scores = data.list[0];
                $('#avgReply').text(scores.SEARCH_AVG + '%');
            } else {
                $('#avgReply').text(0);
            }
        },
        error : function() {   
            $('#avgReply').text(0);
        }
    })
}

function getScorePanel4() {
    $.ajax({
        url: '/board/getScorePanel4',
        dataType: 'json',
        type: 'POST',
        data: getFilterVal(),
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            if (data.result) {
                var scores = data.list[0];
                $('#maxQueryCnt').text(scores.MAX_QRY);
            } else {
                $('#maxQueryCnt').text(0);
            }
        },
        error : function() {   
            $('#maxQueryCnt').text(0);
        },
        complete : function() {
            //getScorePanel2();
        }
    })
}


function getSimulUrl(){
    $.ajax({
        url: '/board/getSimulUrlInfo',
        dataType: 'json',
        type: 'POST',
        success: function (data) {
            if (data.loginStatus == '___LOGIN_TIME_OUT_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == '___DUPLE_LOGIN_Y___') {
                alert($('#timeoutLogOut').val());
                location.href = '/users/logout';
            }
            if (data.loginStatus == 'DUPLE_LOGIN') { 
                alert($('#dupleMassage').val());
                location.href = '/users/logout';
            }
            $('#simulURL').val(data.simul_url);
        }
    });
}


function makeReloadEvent(divName) {
    
    $('#' + divName + '  .fa-spin').css('cursor', 'pointer');

    $('#' + divName + '  .fa-spin').on('mouseover',function(e){
    
        //var oWidth = $('#' + divName + '  .fa-spin').offset().top
        //var oHeight = $('#' + divName + '  .fa-spin').offset().top;
    
        // 레이어가 나타날 위치를 셋팅한다.
        var divLeft =  e.pageX; //$('#divInfo').css('width').split('px')[0]*1 +
        var divTop =  e.pageY; //$('#divInfo').css('height').split('px')[0]*1 +
    
        $('#divInfo').css({
            "top": divTop,
            "left": divLeft,
            "position": "absolute"
        }).show();
    });

    
    $('#' + divName + '  .fa-spin').on('mouseout',function(e){
        $('#divInfo').hide();
    });

    if (divName == 'overlay_drawfirstQuerytable') 
    {
        $('#' + divName + '  .fa-spin').on('click',function(e){
            removeReloadEvent(divName);
            drawfirstQuerytable(1);
        });
    }
    else if (divName == 'overlay_getOftQuestion') 
    {
        $('#' + divName + '  .fa-spin').on('click',function(e){
            removeReloadEvent(divName);
            getOftQuestion();
        });
    }
    else if (divName == 'overlay_getResponseTime') 
    {
        $('#' + divName + '  .fa-spin').on('click',function(e){
            removeReloadEvent(divName);
            getResponseTime();
        });
    }
    else if (divName == 'overlay_drawNoneQuerytable') 
    {
        $('#' + divName + '  .fa-spin').on('click',function(e){
            removeReloadEvent(divName);
            drawNoneQuerytable(1);
        });
    }
    else if (divName == 'overlay_drawFirstQuery') 
    {
        $('#' + divName + '  .fa-spin').on('click',function(e){
            removeReloadEvent(divName);
            drawFirstQuery();
        });
    }
    else if (divName == 'overlay_getQueryByEachTime') 
    {
        $('#' + divName + '  .fa-spin').on('click',function(e){
            removeReloadEvent(divName);
            getQueryByEachTime();
        });
    }
}


function removeReloadEvent(divName) { 
    $('#divInfo').hide();
    $('#' + divName + ' .fa-spin').css('cursor', null);
    $('#' + divName + ' .fa-spin').off('click');
    $('#' + divName + ' .fa-spin').off('mouseover');
    $('#' + divName + ' .fa-spin').off('mouseout');
}