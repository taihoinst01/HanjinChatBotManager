module.exports = {

    // null üũ �Լ�
    nullCheck: function (targetValue, nullValue) {
        if (targetValue == '' || targetValue == undefined || targetValue == null) {
            return nullValue;
        } else {
            return targetValue
        }
    },

    //
    getIntentEntityList: function (body, appId) {
        var intentList = [];
        var entityList = [];
        var childrenList = [];
        //var closedEntityList = [];
        body.forEach(x => {
            switch (x.typeId) {
                case 0://"readableType": "Intent Classifier"
                    x.appId = appId;
                    intentList.push(x);
                    break;
                case 1://"readableType": "Entity Extractor",
                    x.appId = appId;
                    entityList.push(x);
                    break;
                case 2://Prebuilt Entity Extractor
                    x.appId = appId;
                    entityList.push(x);
                    break;
                case 3://"readableType": "Hierarchical Entity Extractor",
                    var tmpEntity = new Object();
                    tmpEntity.appId = appId;
                    tmpEntity.id = x.id;
                    tmpEntity.name = x.name;
                    tmpEntity.typeId = x.typeId;
                    entityList.push(tmpEntity);
                    x.children.forEach(k => {
                        var tmpObj = new Object();
                        tmpObj.entityId = x.id;
                        tmpObj.childId = k.id;
                        tmpObj.name = k.name;
                        tmpObj.typeId = x.typeId;
                        childrenList.push(tmpObj);
                    });
                    break;
                case 4://"readableType": "Composite Entity Extractor",
                    var tmpEntity = new Object();
                    tmpEntity.appId = appId;
                    tmpEntity.id = x.id;
                    tmpEntity.name = x.name;
                    tmpEntity.typeId = x.typeId;
                    entityList.push(tmpEntity);
                    x.children.forEach(k => {
                        var tmpObj = new Object();
                        tmpObj.entityId = x.id;
                        tmpObj.childId = k.id;
                        tmpObj.name = k.name;
                        tmpObj.typeId = x.typeId;
                        childrenList.push(tmpObj);
                    });
                    break;
                case 5://"readableType": "Closed List Entity Extractor",
                    var tmpEntity = new Object();
                    tmpEntity.appId = appId;
                    tmpEntity.id = x.id;
                    tmpEntity.name = x.name;
                    tmpEntity.typeId = x.typeId;
                    entityList.push(tmpEntity);
                    x.subLists.forEach(k => {
                        var tmpObj = new Object();
                        tmpObj.entityId = x.id;
                        tmpObj.childId = k.id;
                        tmpObj.name = k.canonicalForm;
                        tmpObj.typeId = x.typeId;
                        var childListStr = "";
                        for (var t=0; t<k.list.length; t++) {
                            childListStr += k.list[t];
                            if (t != k.list.length-1)  childListStr += ",";
                        }
                        tmpObj.childList = childListStr;
                        childrenList.push(tmpObj);
                    });

                    break;
                
                default:
                    break;
            }
        });
        var returnObj = new Object();
        returnObj.intentList = intentList;
        returnObj.entityList = entityList;
        returnObj.childrenList = childrenList;
        //returnObj.closedEntityList = closedEntityList;
        return returnObj;
    },

    getChildEntityList: function (body) {

        //typeId expected is {3,4}

        var childrenList = [];
        //var closedEntityList = [];
        switch (body.typeId) {
            case 3://"readableType": "Hierarchical Entity Extractor",
                body.children.forEach( k => {
                    var tmpObj = new Object();
                    tmpObj.entityId = body.id;
                    tmpObj.childId = k.id;
                    tmpObj.name = k.name;
                    tmpObj.typeId = body.typeId;
                    childrenList.push(tmpObj);
                });
                
                break;
            case 4://"readableType": "Composite Entity Extractor",
                body.children.forEach( k => {
                    var tmpObj = new Object();
                    tmpObj.entityId = body.id;
                    tmpObj.childId = k.id;
                    tmpObj.name = k.name;
                    tmpObj.typeId = body.typeId;
                    childrenList.push(tmpObj);
                });
                break;
            case 5://"readableType": "Composite Entity Extractor",
                body.subLists.forEach( k => {
                    var tmpObj = new Object();
                    tmpObj.entityId = body.id;
                    tmpObj.childId = k.id;
                    tmpObj.name = k.canonicalForm;
                    tmpObj.typeId = body.typeId;
                    var childListStr = "";
                    for (var t=0; t<k.list.length; t++) {
                        childListStr += k.list[t];
                        if (t != k.list.length-1)  childListStr += ",";
                    }
                    tmpObj.childList = childListStr;
                    childrenList.push(tmpObj);
                });
                break;
            default:
                break;
        }
        
        //returnObj.closedEntityList = closedEntityList;
        return childrenList;

    },

    getIntentList: function (body, appId) { 
        var intentList = [];
        body.forEach(x => {
            x.appId = appId;
            /*
            var tmpObj = new Object();
            tmpObj.APP_ID = appId;
            tmpObj.INTENT_ID = x.id;
            tmpObj.INTENT = x.name;
            */
            intentList.push(x);
        });
        return intentList;
    },

    getSimpleList: function (body, appId) { 
        var simpleList = [];
        body.forEach(x => {
            x.appId = appId;
            /*
            var tmpObj = new Object();
            tmpObj.APP_ID = appId;
            tmpObj.ENTITY_ID = x.id;
            tmpObj.ENTITY = x.name;
            */
            simpleList.push(x);
        });
        return simpleList;
    },

    getHierarchyList: function (body, appId) { 
        var hierarchyObj = new Object();
        var hierarchyList = [];
        var childrenList = [];
        body.forEach(x => {
            x.appId = appId;
            /*
            var tmpObj = new Object();
            tmpObj.APP_ID = appId;
            tmpObj.ENTITY_ID = x.id;
            tmpObj.ENTITY = x.name;
            */
            hierarchyList.push(x);
            x.children.forEach(k => {
                var tmpObj = new Object();
                tmpObj.entityId = x.id;
                tmpObj.childId = k.id;
                tmpObj.name = k.name;
                tmpObj.typeId = x.typeId;
                childrenList.push(tmpObj);
            });
        });
        hierarchyObj.hierarchyList = hierarchyList;
        hierarchyObj.childrenList = childrenList;
        return hierarchyObj;
    },

    getCompositeList: function (body, appId) { 
        var compositeObj = new Object();
        var compositeList = [];
        var childrenList = [];
        body.forEach(x => {
            x.appId = appId;
            /*
            var tmpObj = new Object();
            tmpObj.APP_ID = appId;
            tmpObj.ENTITY_ID = x.id;
            tmpObj.ENTITY = x.name;
            */
            compositeList.push(x);

            x.children.forEach(k => {
                var tmpObj = new Object();
                tmpObj.entityId = x.id;
                tmpObj.childId = k.id;
                tmpObj.name = k.name;
                tmpObj.typeId = x.typeId;
                childrenList.push(tmpObj);
            });
        });
        compositeObj.compositeList = compositeList;
        compositeObj.childrenList = childrenList;
        return compositeObj;
    },

    getClosedList: function (body, appId) { 
        var closedObj = new Object();
        var closedList = [];
        var childrenList = [];
        body.forEach(x => {
            x.appId = appId;
            /*
            var tmpObj = new Object();
            tmpObj.APP_ID = appId;
            tmpObj.ENTITY_ID = x.id;
            tmpObj.ENTITY = x.name;
            */
            closedList.push(x);

            x.subLists.forEach( k => {
                var tmpObj = new Object();
                tmpObj.entityId = x.id;
                tmpObj.childId = k.id;
                tmpObj.name = k.canonicalForm;
                tmpObj.typeId = x.typeId;
                var childListStr = "";
                for (var t=0; t<k.list.length; t++) {
                    childListStr += k.list[t];
                    if (t != k.list.length-1)  childListStr += ",";
                }
                tmpObj.childList = childListStr;
                childrenList.push(tmpObj);
            });
        });
        closedObj.closedList = closedList;
        closedObj.childrenList = childrenList;
        return closedObj;
    },

};