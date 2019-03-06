module.exports = {
    
    // null 체크 함수
    nullCheck : function (targetValue, nullValue) {
        if(targetValue == '' ||  targetValue == undefined || targetValue == null){
            return nullValue;
        }else{
            return targetValue
        }
    }
};