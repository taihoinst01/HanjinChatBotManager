module.exports = {
    pagination : function (curPage, totalCount) {
        if( curPage && totalCount ){
            var paging_result='';
            var maxPageInSet = 10, // 페이지 카운트 갯수
                maxEntityInPage = 10, // 한 페이지당 컨텐츠 수
                totalPage = Math.ceil(totalCount/maxEntityInPage), // 전체 페이지수
                totalSet = Math.ceil(totalPage/maxPageInSet), // 전체 세트수
                curSet = Math.ceil(curPage/maxPageInSet), // 현재 세트번호
                startPage = ((curSet-1)*maxPageInSet)+1, // 현재 세트내 출력될 시작 페이지
                endPage = (startPage+maxPageInSet)-1; // 현재 세트내 출력될 마지막 페이지
            
            paging_result += '<ul class="pagination pagination-sm no-margin ">';
            //paging_result += '<li><a href="#"><i class="fa fa-angle-double-left"></i></a></li>';
            //paging_result += '<li><a href="#"><i class="fa fa-angle-left"></i></a></li>';
            /** 1개 세트내 Previous 페이지 출력여부 설정(PreviousPage=StartPage-1) **/
            if(curSet > 1){
                paging_result += '<li class="li_paging" value="'+ (startPage-1) +'"><a href="#" onclick="return false;"><i class="fa fa-angle-left"></i></a></li>';
            }
            /** 1개 세트내 페이지 출력여부 설정(페이지 순환하면서 요청페이지와 같을 경우 해당 페이지 비활성화 처리) **/
            for(var i=startPage; i<=endPage;i++){
                if(i>totalPage) break;
                paging_result += '<li class='+ (i==curPage ? '"li_paging active"':'"li_paging"') +' value="'+ i +'"><a href="#" onclick="return false;">'+ i + '</a></li>';
            }
            /** 1개 세트내 Next 페이지 출력여부 설정(NextPage=EndPage+1) **/
            if(curSet<totalSet){
                paging_result += '<li class="li_paging" value="'+ (endPage+1) +'"><a href="#" onclick="return false;"><i class="fa  fa-angle-right"></i></a></li>';
            }
            //paging_result += '<li><a href="#"><i class="fa  fa-angle-right"></i></a></li>';
            //paging_result += '<li><a href="#"><i class="fa  fa-angle-double-right"></i></a></li>';
            paging_result += '</ul>';
            return paging_result;
        }
    }
};