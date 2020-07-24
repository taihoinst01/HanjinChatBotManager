

var entityHash = {};

//가장 먼저 실행.
var language;
;(function($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function(data) {
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
            language= data.lang;
            console.log(language);
            //google.charts.load('current', {'packages':['corechart']});
            google.charts.load('visualization', {'packages':['corechart', 'table']} );
            google.charts.load('current', {packages: ['corechart', 'bar']});

            //google.charts.setOnLoadCallback(drawStatusOverview);
            google.charts.setOnLoadCallback(drawStatusOverview);
            //google.charts.setOnLoadCallback(getScorePanel);

            //google.charts.setOnLoadCallback(getOftQuestion);
            google.charts.setOnLoadCallback(getOftQuestion);
            //google.charts.setOnLoadCallback(getQueryByEachTime);
            //google.charts.setOnLoadCallback(drawNoneQuerylist);

            //google.charts.setOnLoadCallback(getResponseScores);
            google.charts.setOnLoadCallback(getResponseScores);
            //google.charts.setOnLoadCallback(drawFirstQueryTable);
            //google.charts.setOnLoadCallback(drawStuff);
            google.charts.setOnLoadCallback(drawNoneQuerylist);

        }
    });
})(jQuery);
/*
//var entityList = [];
//실행 순서 1
$(document).ready(function () {   
});
//실행 순서 2
$(document).ready(function () {
});
*/
//top버튼
$(window).scroll(function() {
    if ($(this).scrollTop() > 350) {
        $('.goTop').fadeIn();
    } else {
        $('.goTop').fadeOut();
    }
});
/*html button tag onclick에 적용.
$(".goTop").click(function() {
    alert("ddddddddddMOVE_TOP_BTN")
   $('html, body').animate({
       scrollTop : '300'
   }, 3000, 'easeOutBack');
   return false;
});
*/
//slider 시작
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();

var minDate = new Date(yyyy.toString()-1, mm.toString()-1, dd.toString());
var maxDate = new Date(yyyy.toString(), mm.toString()-1, dd.toString());
var slider;
var startDate;
var endDate;
$(document).ready(function () {
    //getLanguage();
    slider = $('#slider').slider({range: true, max: daysDiff(minDate, maxDate),
            slide: function(event, ui) { resync(ui.values); }});
    startDate = $('#startDate').datepicker({minDate: minDate, maxDate: maxDate,
            onSelect: function(dateStr) { resync(); }}).
        keyup(function() { resync(); });
    endDate = $('#endDate').datepicker({minDate: minDate, maxDate: maxDate,
            onSelect: function(dateStr) { resync(); }}).
        keyup(function() { resync(); });
    resync([0, 365]);
    $('#slider div:eq(0)').css('left','0%').css('width','100%');
    $('#slider span:eq(1)').css('left','100%');

    
    
    //안쓰는 차트
    //getEndpointHistory();
    //getEntityLabel();

    //조회 버튼
    $('#selectBtn').click(function() {
        setTimeout("google.charts.setOnLoadCallback(drawStatusOverview);", 10);
        setTimeout("google.charts.setOnLoadCallback(getOftQuestion);", 30);
        setTimeout("google.charts.setOnLoadCallback(getResponseScores);", 50);
        setTimeout("google.charts.setOnLoadCallback(drawNoneQuerylist);", 70);
    });
});


function getLanguage() {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function(data) {
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
            language = data.lang;
            console.log(language);
        }
    });
}

function resync(values) {
    if (values) {
        var date = new Date(minDate.getTime());
        date.setDate(date.getDate() + values[0]);
        startDate.val($.datepicker.formatDate('mm/dd/yy', date));
        date = new Date(minDate.getTime());
        date.setDate(date.getDate() + values[1]);
        endDate.val($.datepicker.formatDate('mm/dd/yy', date));
    }
    else {
        var start = daysDiff(minDate, startDate.datepicker('getDate') || minDate);
        var end = daysDiff(minDate, endDate.datepicker('getDate') || maxDate);
        start = Math.min(start, end);
        slider.slider('values', 0, start);
        slider.slider('values', 1, end);
    }
    startDate.datepicker('option', 'maxDate', endDate.datepicker('getDate') || maxDate);
    endDate.datepicker('option', 'minDate', startDate.datepicker('getDate') || minDate);
}

function daysDiff(d1, d2) {
    return  Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

//slider 끝




function getEntityListAjax () {
    var appId = $('#appId').val();//getParameters('appId');
    var subKey = $('#subKey').val();
    var params = {
        // Request parameters
        "skip": "0",
        "take": "500",
    };
    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/luis/api/v2.0/apps/" + appId + "/versions/0.1/models?" + $.param(params),
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subKey);
        },
        type: "GET",
        // Request body
        data: "",
    })
    .done(function(data) {
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
        //entityList = data;
        mkEntityList (data);
    })
    .fail(function() {
        //alert("error");
    });
}


function mkEntityList (list) {
    /*
    for (var i=0; i<list.length; i++) {
        if(list[i].readableType.indexOf("Entity") != -1) {
            entityList.push(list[i]);
        }
    }
    */
    for (var i=0; i<list.length; i++) {
        if(list[i].readableType.indexOf("Entity") != -1) {
            var strParent = list[i].name;

            for (var j=0; j<list[i].children.length; j++) {
                var entity = list[i].children[j];
                var strChild = entity.name;
                entityHash[entity.id] = strParent + "::" + strChild;
            }
        }
    }
}

var getParameters = function (paramName) {
    // 리턴값을 위한 변수 선언
    var returnValue;

    // 현재 URL 가져오기
    var url = location.href;

    // get 파라미터 값을 가져올 수 있는 ? 를 기점으로 slice 한 후 split 으로 나눔
    var parameters = (url.slice(url.indexOf('?') + 1, url.length)).split('&');

    // 나누어진 값의 비교를 통해 paramName 으로 요청된 데이터의 값만 return
    for (var i = 0; i < parameters.length; i++) {
        var varName = parameters[i].split('=')[0];
        if (varName.toUpperCase() == paramName.toUpperCase()) {
            returnValue = parameters[i].split('=')[1];
            return decodeURIComponent(returnValue);
        }
    }
};

/*//안쓰는 차트 설정 참고용
function getEndpointHistory () {
    var appId = $('#appId').val();//getParameters('appId');
    var subKey = $('#subKey').val();
    var date = getIsoDate();

    var params = {
        // These are optional request parameters. They are set to their default values.  //$.param(params)
        "timezoneOffset": "0",
        "verbose": "false",
        "spellCheck": "false",
        "staging": "false",
    };
    //"https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/" + pApp.getId() + "/versions/" + pApp.getVersionId() + "/stats/endpointhitshistory"
    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/" + appId + "/versions/0.1/stats/endpointhitshistory?from=" 
            + date.fromDate + "&to=" + date.toDate,
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subKey);
        },
        type: "GET",
        // The request body may be empty for a GET request
        data: "",
    })
    .done(function(data) {
        //Object.values(data)
        var historyArr = data;
        var sumOfhits = 0;
        google.charts.load('current', {'packages':['annotationchart']});
        google.charts.setOnLoadCallback(drawChart);


        function drawChart() {
            var data = new google.visualization.DataTable();
            data.addColumn('date', 'Date');
            data.addColumn('number', '');
            //data.addColumn('string', 'Kepler title');
            //data.addColumn('string', 'Kepler text');

            for (var i in historyArr) {
                data.addRow([new Date(i), historyArr[i]]);
                sumOfhits += historyArr[i];
            }
            var newDate = new Date();
            var chart = new google.visualization.AnnotationChart(document.getElementById('chart_div'));
            var options = {
                //displayZoomButtons: false,   //줌버튼
                //zoomEndTime: new Date(),
                //vAxis: { gridlines: { count: 4 } },
                min : 0,
                max : 5000,
                //zoomStartTime: newDate.getTime() - (1000*60*60*24*360*2),
                //zoomStartTime: parseDate(2016, 11, 29),
                //allValuesSuffix:"asdfasf",   //우측 상단 추가 string 표시
                //displayDateBarSeparator: false,  // 우측상단 구분자|추가
                //legendPosition: 'sameRow', //newRow
                displayAnnotations: true
                //displayRangeSelector: false //하단 범위지정
            };
            //chart.setVisibleChartRange('1d', '1y');
            chart.draw(data, options);
         }

         $("#spanEndpointCount").html(sumOfhits);



    })
    .fail(function() {
        //alert("error");
    });
}

function getIsoDate() {
    var dt = new Date();
    // 월을 구하고 1만큼 증가

    var mnth = dt .getUTCMonth(); 
    mnth++;

    var day = dt.getUTCDate();
    if(day < 10) {
        day = "0"+day;
    }

    var fromDay = dt.getUTCDate()-7;
    if(fromDay < 10) {
        fromDay = "0"+fromDay;
    }

    var yr = dt.getUTCFullYear();
    var hrs = dt.getUTCHours();

    if(hrs < 10) { 
        hrs = "0"+hrs;
    }

    var min = dt.getUTCMinutes();

    if(min < 10) {
        min = "0"+min;
    }

    var sec = dt.getUTCSeconds();

    if(sec < 10) {
        sec = "0"+sec
    };

    var toDate = yr+"-"+mnth+"-"+day+"T"+hrs+":"+min+":"+sec+"Z";
    var fromDate = yr+"-"+mnth+"-"+fromDay+"T"+hrs+":"+min+":"+sec+"Z";
    var date = {
        toDate:toDate,
        fromDate:fromDate
    };
    return date;
}
*/
/* //안스는 차트, 참고용
function getEntityLabel() {
    var appId = $('#appId').val();//getParameters('appId');
    var subKey = $('#subKey').val();

    var params = {
    };
    
    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/" + appId + "/versions/0.1/stats/labelsperentity",
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subKey);
        },
        type: "GET",
        // The request body may be empty for a GET request
        data: "",
    })
    .done(function(data) {
        
        var entityList = data;

        // 2. Column 차트 - Entity Breakdown..
        google.charts.load("current", {packages:['corechart']});
        google.charts.setOnLoadCallback(drawChartColumn);

        function drawChartColumn() {

            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Task', 'name');
            data.addColumn('number', 'Labels Count', 'labelsCnt');
            

            for (var i in entityList) {
                data.addRow([ entityHash[i], entityList[i]]);
            }
            var options = {
                title: 'Intent Breakdown \nON LABELED UTTERANCES',
                chartArea: {
                      left: "3%",
                      top: "13%",
                      height: "85%",
                      width: "85%"
                },
                is3D: false
            };

            var chart = new google.visualization.PieChart(document.getElementById('columnchart_values'));
            chart.draw(data, options);

            function pieClickHandler (obj) {
                if(obj.targetID.indexOf("legendscrollbutton") != -1){
                    //오른쪽 목록 상,하 버튼
                }else if (obj.targetID.indexOf("slice") == -1){
                    //link(intent) 이벤트(else부분)가 걸려있는 곳 말고 다른곳 클릭시 새창에 띄우기.
                    
                }else{
                    //차트 클릭시 이벤트
                }
            }
            google.visualization.events.addListener(chart, 'click', pieClickHandler);
            
        }


    })
    .fail(function() {
        //alert("error");
    });
}
*/



function drawStatusOverview() {
    
    $.ajax({
        url: '/board/intentScore',
        dataType: 'json',
        type: 'POST',
        data: $('#filterForm').serializeObject(),
        success: function(data) {
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
                  alert(data.error_message);
            } else {
                    var tableList = data.list;
                    var tmpColumn1 = new Array();
                    var tmpColumn2 = new Array();
                    var tmpColumn3 = new Array();
                    var tmpColumn4 = new Array();

                    var inputData = new google.visualization.DataTable();

                    console.log(language);

                    //declare the columns
                    inputData.addColumn('string', 'INTENT');
                    inputData.addColumn('number', language.Number);
                    inputData.addColumn('number', language.average);
                    inputData.addColumn('number', language.minimum);
                    inputData.addColumn('number', language.maximum);

                    //insert data here
                    //don't forget to set the classname TotalCell to the last datarow!!!


                    for (var i=0; i< tableList.length; i++) {
                        inputData.addRow([tableList[i].intentName, tableList[i].intentCount, tableList[i].intentScoreAVG, tableList[i].intentScoreMIN, tableList[i].intentScoreMAX]);
                        tmpColumn1.push(tableList[i].intentCount);
                        tmpColumn2.push(tableList[i].intentScoreAVG);
                        tmpColumn3.push(tableList[i].intentScoreMIN);
                        tmpColumn4.push(tableList[i].intentScoreMAX);
                    }
                    inputData.addRow(
                        [{
                            v: language.Sum,
                            p: {
                                className: 'TotalCell'
                            }
                          },
                          google.visualization.data.sum(tmpColumn1),
                          google.visualization.data.sum(tmpColumn2),
                          google.visualization.data.sum(tmpColumn3),
                          google.visualization.data.sum(tmpColumn4),
                        ]
                    );


                    //attach table to the html
                    StatusTable = new google.visualization.Table(document.getElementById('score'));

                    //add the listener events
                    google.visualization.events.addListener(StatusTable, 'ready', function () {
                        resetStyling('score');
                    });

                    //sorting event
                    google.visualization.events.addListener(StatusTable, 'sort', function (ev) {
                        //find the last row
                        var parentRow = $('#score td.TotalCell').parent();
                        //set the TotalRow row to the last row again.
                        if (!parentRow.is(':last-child')) {
                            parentRow.siblings().last().after(parentRow);
                        }

                        //reset the styling of the table
                        resetStyling('score');
                    });

                    var heightVal;
                    if (tableList.length < 10) {
                        heightVal = 'auto';
                    } else {
                        heightVal = '90%';
                    }


                    //draw the table
                    StatusTable.draw(inputData, {
                        showRowNumber: false,
                        width: '100%',
                        height: heightVal
                    });
              }
          }
    }).always(function(){
        google.charts.setOnLoadCallback(getScorePanel);
    });

}

//Also add the css class Totalrow
function resetStyling(id) {
    $('#' + id + ' table')
        .removeClass('google-visualization-table-table')
        .addClass('table table-bordered table-condensed table-striped table-hover');
    var parentRow = $('#' + id + ' td.TotalCell').parent();
    parentRow.addClass('TotalRow');
}

function getOftQuestion() {
    $.ajax({
        url: "/board/getOftQuestion",
        type: "post",
        data: $("#filterForm").serialize(),
    }).done(function(data) {
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
            alert(data.error_message);
      } else {
              var tableList = data.list;

              var inputData = new google.visualization.DataTable();

              //declare the columns
              inputData.addColumn('string', 'INTENT');
              inputData.addColumn('string', language.HangulQuestion);
              inputData.addColumn('string', language.channel);
              inputData.addColumn('number', language.QuestionCount);
              inputData.addColumn('string', language.Date);

              //insert data here
              //don't forget to set the classname TotalCell to the last datarow!!!

            for (var i=0; i< tableList.length; i++) {
                //inputData.addRow([tableList[i].INTENT, tableList[i].KORQ, tableList[i].CHANNEL, tableList[i].QNUM, tableList[i].DATE]);
                inputData.addRow([tableList[i].INTENT, tableList[i].KORQ, tableList[i].CHANNEL, tableList[i].QNUM, tableList[i].DATE]);
            }
              
            //attach table to the html
            StatusTable = new google.visualization.Table(document.getElementById('oftQuestion'));
            
            //add the listener events
            google.visualization.events.addListener(StatusTable, 'ready', function () {
                //resetStyling('score');
            });

            //sorting event
            google.visualization.events.addListener(StatusTable, 'sort', function (ev) {
                //find the last row
                var parentRow = $('#score td.TotalCell').parent();
                //set the TotalRow row to the last row again.
                if (!parentRow.is(':last-child')) {
                    parentRow.siblings().last().after(parentRow);
                }

                //reset the styling of the table
                //resetStyling('score');
            });
            var heightVal;
            if (tableList.length < 10) {
                heightVal = "100%"
            } else {
                heightVal = "330px"
            }

            //draw the table
            StatusTable.draw(inputData, {
                showRowNumber: false,
                width: '100%',
                height: heightVal
            });
            
            if (tableList.length === 0) {
                var tdHtml = '<tr class="google-visualization-table-tr-even google-visualization-table-tr-odd"> ' 
                           + '<td class="google-visualization-table-td" colspan="5" style="padding: 10% 40%;"><div style="width:150px;">' + language.noData + '</div></td></tr>'
                $('#oftQuestion').find('tbody').append(tdHtml);
            }
        }
    }).always(function(){
        google.charts.setOnLoadCallback(getQueryByEachTime);
        
    });
}





function drawNoneQuerylist() {
    $.ajax({
        url: '/board/nodeQuery',
        dataType: 'json',
        type: 'POST',
        data: $('#filterForm').serializeObject(),
        success: function(data) {
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
                  alert(data.error_message);
              } else {
                    var noneList = data.list;

                    var inputData3 = new google.visualization.DataTable();

                    //declare the columns
                    inputData3.addColumn('string', 'INTENT');
                    inputData3.addColumn('string', language.HangulQuestion);
                    inputData3.addColumn('number', language.QuestionCount);
                    inputData3.addColumn('string', language.Date);
                    inputData3.addColumn('string', language.channel);
                    inputData3.addColumn('string', language.Result);
                    inputData3.addColumn('string', language.TEXT_response);
                    inputData3.addColumn('string', language.CARD_response);
                    inputData3.addColumn('string', language.CARDBTN_response);
                    inputData3.addColumn('string', language.MEDIA_response);
                    inputData3.addColumn('string', language.MEDIABTN_response);

                    //insert data here
                    //don't forget to set the classname TotalCell to the last datarow!!!

                    for (var i=0; i< noneList.length; i++) {
                        inputData3.addRow([   noneList[i].intent
                                            , noneList[i].korQuery
                                            , noneList[i].queryCnt
                                            , noneList[i].queryDate
                                            , noneList[i].channel
                                            , noneList[i].result
                                            , noneList[i].textResult
                                            , noneList[i].cardResult
                                            , noneList[i].cardBtnResult
                                            , noneList[i].mediaResult
                                            , noneList[i].mediaBtnResult]);
                    }

                    StatusTable3 = new google.visualization.Table(document.getElementById('noneQueryDiv'));
                    /*
                    //add the listener events
                    google.visualization.events.addListener(StatusTable2, 'ready', function () {
                        resetStyling('StatusOverview2');
                    });

                    //sorting event
                    google.visualization.events.addListener(StatusTable2, 'sort', function (ev) {
                        //find the last row
                        var parentRow2 = $('#StatusOverview2 td.TotalCell').parent();
                        //set the TotalRow row to the last row again.
                        if (!parentRow2.is(':last-child')) {
                            parentRow2.siblings().last().after(parentRow2);
                        }

                        //reset the styling of the table
                        resetStyling('StatusOverview2');
                    }); */

                    StatusTable3.draw(inputData3,
                        {
                            page: 'enable',
                            pageSize: 500,
                            scrollLeftStartPosition: 100,
                            showRowNumber: false,
                            width: '100%',
                            height: '500px',
                            allowHtml: true,
                            chartArea: {
                                left: "20%",
                                //top: "13%",
                                //height: "85%",
                                width: "100%"
                            }
                        });
                   }
                   
                   if (noneList.length === 0) {
                    var tdHtml = '<tr class="google-visualization-table-tr-even google-visualization-table-tr-odd"> ' 
                               + '<td class="google-visualization-table-td" colspan="11" style="padding: 10% 45%;"><div style="width:150px;">' + language.noData + '</div></td></tr>'
                    $('#noneQueryDiv').find('tbody').append(tdHtml);
                    }
                    
              }
      }).always(function(){
        google.charts.setOnLoadCallback(drawStuff);
    });
}









var barChart;
var inputDataforBar;
// bar 그래프를 그린다.
function drawStuff() {
    $.ajax({
        url: '/board/firstQueryBar',
        dataType: 'json',
        type: 'POST',
        data: $('#filterForm').serializeObject(),
        success: function(data) {
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
            inputDataforBar = new google.visualization.DataTable();
            if (data.list.length < 3) {
                inputDataforBar.addRows(3);
                inputDataforBar.addColumn('string','INTENT');
                inputDataforBar.addColumn('number','CNT');
                for (var i=data.list.length; i < 3; i++) {
                    inputDataforBar.setCell(i, 0, ' ');
                    inputDataforBar.setCell(i, 1, 0);
                }
            } else {
                inputDataforBar.addRows(data.list.length);
                inputDataforBar.addColumn('string','INTENT');
                inputDataforBar.addColumn('number','CNT');
            }
            
            //inputDataforBar.addRows(data.list.length);
            
            //inputData.addColumn({type:'string', role: 'style' });
            //inputData.addColumn({type:'string', role: 'annotation' });
            if (data.list != null && data.list.length >0) {
                for (var i=0;i<data.list.length; i++) {
                    inputDataforBar.setCell(i, 0, data.list[i].INTENT);
                    inputDataforBar.setCell(i, 1, data.list[i].INTENT_CNT);
                    //inputData.setCell(i, 2, 'adsfdsfadsfads');
                }
            }

            var options = {
            //title: language.Customer_First_Questions,
            width: '85%',
            height: '85%',
            legend: { position: 'none' },
            chart: { title: language.Customer_First_Questions },
            bars: 'horizontal', // Required for Material Bar Charts.
            bar: { groupWidth: "20%" }
            };

            barChart = new google.charts.Bar(document.getElementById('top_x_div'));
            barChart.draw(inputDataforBar, options);

            //google.visualization.events.addListener(barChart, 'select', selectHandler);
            /* //바 클릭시 이벤트
            function selectHandler() {
                var selection = barChart.getSelection();
                var message = '';
                for (var i = 0; i < selection.length; i++) {
                    var item = selection[i];
                    if (item.row != null && item.column != null) {
                        $('#intentName').val(inputDataforBar.getFormattedValue(item.row, 0));
                    } else if (item.row != null) {
                        $('#intentName').val(inputDataforBar.getFormattedValue(item.row, 0));
                    } else if (item.column != null) {
                        $('#intentName').val(inputDataforBar.getFormattedValue(0, 0));
                    }
                }
            }
            */
        }
    })
};

// table을 그린다.
function drawFirstQueryTable() {
    $.ajax({
        url: '/board/firstQueryTable',
        dataType: 'json',
        type: 'POST',
        data: $('#filterForm').serializeObject(),
        success: function(data) {
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
            var inputData = new google.visualization.DataTable();
            //inputData.addRows(data.list.length);
            inputData.addColumn('string', language.HangulQuestion);
            inputData.addColumn('string', language.Date);
            inputData.addColumn('string', language.channel);
            inputData.addColumn('number', language.QuestionCount);
            inputData.addColumn('number', language.Intent_score);
            inputData.addColumn('string', language.Intent_name);
            inputData.addColumn('string', language.TEXT_response);
            inputData.addColumn('string', language.CARD_response);
            inputData.addColumn('string', language.CARDBTN_response);
            inputData.addColumn('string', language.MEDIA_response);
            inputData.addColumn('string', language.MEDIABTN_response);
            inputData.addColumn('string', language.Type);


            for (var i=0;i<data.list.length; i++) {
                inputData.addRow([   
                      data.list[i].koQuestion
                    , data.list[i].query_date
                    , data.list[i].channel
                    , data.list[i].query_cnt
                    , data.list[i].intent_score
                    , data.list[i].intent_name
                    , data.list[i].txt_answer
                    , data.list[i].card_answer
                    , data.list[i].cardBtn_answer
                    , data.list[i].media_answer
                    , data.list[i].mediaBtn_answer
                    , data.list[i].message_type
                ]);
                /*
                inputData.setCell(i,0,data.list[i].koQuestion);
                inputData.setCell(i,1,data.list[i].query_date);
                inputData.setCell(i,2,data.list[i].channel);
                inputData.setCell(i,3,data.list[i].query_cnt);
                inputData.setCell(i,4,data.list[i].intent_score);
                inputData.setCell(i,5,data.list[i].intent_name);
                inputData.setCell(i,6,data.list[i].txt_answer);
                inputData.setCell(i,7,data.list[i].card_answer);
                inputData.setCell(i,8,data.list[i].cardBtn_answer);
                inputData.setCell(i,9,data.list[i].media_answer);
                inputData.setCell(i,10,data.list[i].mediaBtn_answer);
                inputData.setCell(i,11,data.list[i].message_type);
                */
            }
            

            var table = new google.visualization.Table(document.getElementById('table_div'));
            table.draw(inputData, 
                       { 
                        page: 'enable',
                        pageSize: 500,
                        scrollLeftStartPosition: -100,
                        showRowNumber: false, 
                        width: '100%',
                        height: '340px',
                        allowHtml: true,
                        explorer: {axis: 'horizontal'}
                    });
            
            $('#table_div').find('.google-visualization-table-th:contains(' + language.HangulQuestion + ')').css('width', '300px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.query_date + ')').css('width', '150px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.channel + ')').css('width', '100px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.query_cnt + ')').css('width', '50px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.intent_score + ')').css('width', '80px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.intent_name + ')').css('width', '100px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.txt_answer + ')').css('width', '100px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.card_answer + ')').css('width', '100px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.cardBtn_answer + ')').css('width', '100px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.media_answer + ')').css('width', '100px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.mediaBtn_answer + ')').css('width', '100px');
            $('#table_div').find('.google-visualization-table-th:contains(' + language.message_type + ')').css('width', '80px');

            if (data.list.length === 0) {
                var tdHtml = '<tr class="google-visualization-table-tr-even google-visualization-table-tr-odd"> ' 
                            + '<td class="google-visualization-table-td" colspan="13" style="padding: 10% 42%;"><div style="width:150px;">' + language.noData + '</div></td></tr>'
                $('#table_div').find('tbody').append(tdHtml);
                }
            /* 
            google.visualization.events.addListener(table, 'select', selectHandler);
                function selectHandler() {
                    var selection = table.getSelection();
                        var message = '';
                        for (var i = 0; i < selection.length; i++) {
                        var item = selection[i];
                        if (item.row != null && item.column != null) {
                            $('#intentName').val(inputData.getFormattedValue(item.row, 0));
                        } else if (item.row != null) {
                            $('#intentName').val(inputData.getFormattedValue(item.row, 0));
                        } else if (item.column != null) {
                            $('#intentName').val(inputData.getFormattedValue(0, 0));
                        }
                    }
                    filterSearch(5);
              }
            */
        }
    })
  }




//누적 상담자, 평균답변속도 등등 
function getScorePanel() {
    $.ajax({
        url: '/board/getScorePanel',
        dataType: 'json',
        type: 'POST',
        data: $('#filterForm').serializeObject(),
        success: function(data) {
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
            var scores = data.list[0];
            $('#allCustomer').html(scores.CUSOMER_CNT);
            $('#avgReplySpeed').html(scores.REPLY_SPEED);
            $('#avgQueryCnt').html(scores.USER_QRY_AVG);

            var CORRECT_QRY = scores.CORRECT_QRY.toString();
            $('#avgCorrectAnswer').html(  (CORRECT_QRY.length>4? CORRECT_QRY.substr(0,4) : CORRECT_QRY ) + '%'  );
            $('#avgReply').html(scores.SEARCH_AVG + '%');
            $('#maxQueryCnt').html(scores.MAX_QRY);
        }
    })
}

//누적 상담자, 평균답변속도 등등 
function getResponseScores() {
    $.ajax({
        url: '/board/getResponseScore',
        dataType: 'json',
        type: 'POST',
        data: $('#filterForm').serializeObject(),
        success: function(data) {
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
            
            var arrTmp = [];
            var arr0 = ['NAME', 'ms'];
            var arr1 = [language.Average_response_rate, data.list[0].REPLY_AVG];
            var arr2 = [language.Maximum_response_rate, data.list[0].MAX_REPLY];
            var arr3 = [language.Minimum_response_rate, data.list[0].MIN_REPLY];
            var arr4 = [language.Mean_stay_time, data.list[0].REPLY_SUM];
            arrTmp.push(arr0);
            arrTmp.push(arr1);
            arrTmp.push(arr2);
            arrTmp.push(arr3);
            arrTmp.push(arr4);

            var data = google.visualization.arrayToDataTable(arrTmp);
      
              var options = {
                //title: 'Population of Largest U.S. Cities',
                chartArea: {
                    left: "24%",
                    //top: "13%",
                    height: "85%",
                    width: "62%"
                }
                /*
                hAxis: {
                  title: 'Total Population',
                  minValue: 0
                },
                vAxis: {
                  title: 'City'
                }
                */
              };
      
              var chart = new google.visualization.BarChart(document.getElementById('resonseScoreDiv'));
      
              google.visualization.events.addListener(chart, 'ready', function(){
                didWait = true;
              });
      
              chart.draw(data, options);
        }
    }).always(function(){
        google.charts.setOnLoadCallback(drawFirstQueryTable);
    });
}



//시간대별 질문수
function getQueryByEachTime() {
    $.ajax({
        url: '/board/getQueryByEachTime',
        //dataType: 'json',
        type: 'POST',
        data: $('#filterForm').serializeObject(),
        success: function(data) {
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
            var arrList = data.list;
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Time of Day');
            //data.addColumn({type: 'string', role: 'annotation'});
            data.addColumn('number', language.QuestionCount); //QuestionCount
            data.addColumn({type: 'number', role: 'annotation'});
            
            for (var i=0; i<arrList.length; i++) {
                //var key = Object.keys(arrList[i])[0];
                //var val = arrList[i][key];
                data.addRow([{v: pad(i, 2)+":00", f: pad(i, 2)+":00"}, arrList[i], arrList[i]]);
            }

            var options = {
                //title: 'Motivation Level Throughout the Day',
                hAxis: {
                },
                vAxis: {
                },
                width: "100%",
                legend: { position: "none" },
                chartArea: {
                    left: "5%",
                    //top: "13%",
                    height: "85%",
                    width: "95%"
                }
            };
            var chart_div = document.getElementById('timeOfDay_div');
            //chart_div.clearChart();
            var chart = new google.visualization.ColumnChart(document.getElementById('timeOfDay_div'));
            chart.clearChart();
            chart.draw(data, options);
            
        }
    })
}

function pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

