var CKANRequest = /** @class */ (function () {
    var mainGroupArray = [];
    function CKANRequest() {

    }
    CKANRequest.prototype.getDatasets = async function () {
        //const request = new XMLHttpRequest();
        var cam = cesiumCamera;
        var camPos = cam.positionCartographic;
        var view = cam.computeViewRectangle(Cesium.Ellipsoid.WGS84);
        west = view.west * 180 / Cesium.Math.PI;
        east = view.east * 180 / Cesium.Math.PI;
        north = view.north * 180 / Cesium.Math.PI;
        south = view.south * 180 / Cesium.Math.PI;
        var url = document.getElementById('urlCKAN').value;
        var packageUrl = url + "/api/3/action/package_search?ext_bbox=" + west + "%2C" + south + "%2C" + east + "%2C" + north + "&rows=99999999999999999";
        //console.log(packageUrl);
        var results = [];
        var groups;
        mainGroupArray = [];
        groups = await CKANRequest.prototype.getMainGroups(url);


        CKANRequest.prototype.sendHttpRequest('GET', packageUrl).then(function (responseData) {
            //result= parseResponse(responseData);
            console.log(responseData.result.results);
            var size = responseData.result.results.length;
            if (size == 0) {
                document.getElementById("CKAN_Results").innerHTML = "<b> No data available</b>";
                document.getElementById("CKAN_Results").style.display = "block";
                document.getElementById("ResultWindow").style.display = "block";
                document.getElementById("CloseCKANButton").style.display = "block";
                document.getElementById("MinCKANButton").style.display = "block";
            }
            console.log(responseData.result.results.length);
            for (var index = 0; index < responseData.result.results.length; index++) {
                var tempUrl = url + "/api/3/action/package_show?id=" + responseData.result.results[index].id;
                var tempResponseData = responseData;
                //console.log(tempUrl);
                CKANRequest.prototype.sendHttpRequest('GET', tempUrl).then(async function (responseData) {
                    //console.log(responseData.result);

                    results.push(responseData.result);
                    //console.log(tempResponseData.result.results.length);
                    //console.log(results.length);
                    if (results.length === tempResponseData.result.results.length) {
                        //console.log(results);
                        //console.log(url);

                        //groups = await CKANRequest.prototype.getMainGroups(url);

                        async function setGroups() {
                            if (groups != undefined) {
                                if (groups.length == 0) {
                                    setTimeout(setGroups, 1000);
                                } else {
                                    //console.log(groups.length);
                                    //
                                    //console.log("loop")
                                    //var text = "<dl>";


                                    for (let i = 0; i < groups.length; i++) {
                                        var tempDatasetArr = [];
                                        //text = text + "<dt>" + groups[i] + "</dt>";
                                        for (let j = 0; j < results.length; j++) {
                                            //console.log(results[j]);
                                            for (let k = 0; k < results[j].groups.length; k++) {
                                                if (results[j].groups[k].display_name === groups[i]) {
                                                    //text = text + "<dd>" + results[j].title + "</dd>";
                                                    tempDatasetArr.push(results[j]);
                                                }

                                            }

                                        }
                                        var tempGr = new MainGroup(groups[i], tempDatasetArr);
                                        mainGroupArray.push(tempGr);
                                    }

                                    //text = text + "</dl>";

                                    //x.innerHTML = text;
                                    //x.style.display = "block";
                                }
                            } else {
                                setTimeout(setGroups, 1000);
                            }
                        }
                        await setGroups().then(console.log(mainGroupArray));
                        //console.log(mainGroupArray);
                        var x = document.getElementById("CKAN_Results");
                        var text = "";


                        for (let i = 0; i < mainGroupArray.length; i++) {
                            if (mainGroupArray[i].datasetArray.length > 0) {
                                text = text + "<b>" + mainGroupArray[i].name + "</b>";

                                for (let j = 0; j < mainGroupArray[i].datasetArray.length; j++) {

                                    text = text + "<p>&emsp;" + mainGroupArray[i].datasetArray[j].title + "<button id='AddButton' name='" + i + "/" + j + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'>+</button></p>";
                                }
                                //text=text+"<br>";
                            }

                        }

                        //text = text + "</ul>";
                        x.innerHTML = text;
                        x.style.display = "block";
                        document.getElementById("ResultWindow").style.display = "block";
                        document.getElementById("CloseCKANButton").style.display = "block";
                        document.getElementById("MinCKANButton").style.display = "block";


                    }


                });

            }

        });

        //console.log(results.length);




        //console.log(view);
        /*
        const dataPointNW = { longitude: view.west * 180 / Cesium.Math.PI, latitude: view.north * 180 / Cesium.Math.PI, height: 0 };
        //console.log(dataPointNW);
        const pointEntityNW = cesiumViewer.entities.add({
            description: `NW`,
            position: Cesium.Cartesian3.fromDegrees(dataPointNW.longitude, dataPointNW.latitude, dataPointNW.height),
            point: { pixelSize: 20, color: Cesium.Color.RED }
        });
        const dataPointNE = { longitude: view.east * 180 / Cesium.Math.PI, latitude: view.north * 180 / Cesium.Math.PI, height: 0 };
        //console.log(dataPointNW);
        const pointEntityNE = cesiumViewer.entities.add({
            description: `NE`,
            position: Cesium.Cartesian3.fromDegrees(dataPointNE.longitude, dataPointNE.latitude, dataPointNE.height),
            point: { pixelSize: 20, color: Cesium.Color.RED }
        });
        const dataPointSW = { longitude: view.west * 180 / Cesium.Math.PI, latitude: view.south * 180 / Cesium.Math.PI, height: 0 };
        //console.log(dataPointNW);
        const pointEntitySW = cesiumViewer.entities.add({
            description: `SW`,
            position: Cesium.Cartesian3.fromDegrees(dataPointSW.longitude, dataPointSW.latitude, dataPointSW.height),
            point: { pixelSize: 20, color: Cesium.Color.RED }
        });
        const dataPointSE = { longitude: view.east * 180 / Cesium.Math.PI, latitude: view.south * 180 / Cesium.Math.PI, height: 0 };
        //console.log(dataPointNW);
        const pointEntitySE = cesiumViewer.entities.add({
            description: `SE`,
            position: Cesium.Cartesian3.fromDegrees(dataPointSE.longitude, dataPointSE.latitude, dataPointSE.height),
            point: { pixelSize: 20, color: Cesium.Color.RED }
        });
        const p1= cesiumViewer.entities.add({
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray([
                    dataPointNW.longitude,
                    dataPointNW.latitude,
                    dataPointNE.longitude,
                    dataPointNE.latitude,
                    dataPointSE.longitude,
                    dataPointSE.latitude,
                    dataPointSW.longitude,
                    dataPointSW.latitude,
                    dataPointNW.longitude,
                    dataPointNW.latitude,
                ]),
                width: 6,
                material: Cesium.Color.RED,
                clampToGround: true,
            },
        });
        */

    };
    CKANRequest.prototype.getMainGroups = async function (url) {
        var groups = [];
        var mainGroups = [];
        var count = 0;
        var l = 100;
        //console.log(url);
        var groupListURL = url + "/api/3/action/group_list";
        //console.log(groupListURL);
        await CKANRequest.prototype.sendHttpRequest('GET', groupListURL).then(function (responseData) {
            var result = responseData.result;
            l = result.length;
            for (let index = 0; index < result.length; index++) {
                groups[groups.length] = result[index];
                var tempGroupURL = url + "/api/3/action/group_show?id=" + result[index];
                //console.log(tempGroupURL);

                CKANRequest.prototype.sendHttpRequest('GET', tempGroupURL).then(function (response) {
                    count++;
                    //console.log(result.length);
                    if (response.result.groups[0] != undefined) {
                        if (response.result.groups[0].name === "main-categories") {
                            mainGroups.push(response.result.display_name);

                        }

                    }
                    if (count == l) {
                        //console.log(mainGroups)
                        return mainGroups;
                    }
                });


            }


        });/*
        var check = function () {
            if (count === l) {
                console.log("C");

            } else {
                setTimeout(check, 1000);
                console.log("T");
            }
        }
        check();

        console.log(mainGroups.length);*/
        return mainGroups;



        /*
        for (let index = 0; index < results.length; index++) {
            const g = results[index].groups[0].display_name;
            var included = false;
            if (groups.length === 0) {
                groups.push(g);
                //console.log(g);

            }
            else {
                for (let index2 = 0; index2 < groups.length; index2++) {
                    if (groups[index2] === g) {
                        included = true;
                        break;
                    }
                }
                if (!included) {
                    groups.push(g);
                }
            }

        }*/
        //return groups;
    };
    CKANRequest.prototype.sendHttpRequest = function (method, url, data) {
        var promise = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.responseType = 'json';
            if (data) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
            xhr.onload = function () {
                if (xhr.status >= 400) {
                    reject(xhr.response);
                }
                else {
                    resolve(xhr.response);
                }
            };
            xhr.onerror = function () {
                reject('Something went wrong!');
            };
            xhr.send(JSON.stringify(data));
        });
        return promise;
    };
    CKANRequest.prototype.closeResults = function () {
        document.getElementById("ResultWindow").style.display = "none";
        document.getElementById("CloseCKANButton").style.display = "none";
        document.getElementById("MinCKANButton").style.display = "none";
        document.getElementById("MaxCKANButton").style.display = "none";
    };
    CKANRequest.prototype.minResults = function () {
        document.getElementById("CKAN_Results").style.display = "none";
        document.getElementById("MinCKANButton").style.display = "none";
        document.getElementById("MaxCKANButton").style.display = "block";
    };
    CKANRequest.prototype.maxResults = function () {
        document.getElementById("CKAN_Results").style.display = "block";
        document.getElementById("MinCKANButton").style.display = "block";
        document.getElementById("MaxCKANButton").style.display = "none";
    };
    CKANRequest.prototype.addToMap = function (name) {
        if (document.getElementsByName(name)[0].innerHTML == "+") {
            var chars = name.split("/");
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].spatial);
            document.getElementsByName(name)[0].innerHTML = "-";
            var spatial = mainGroupArray[chars[0]].datasetArray[chars[1]].spatial;
            spatial = spatial.replace(/\s+/g, '');
            console.log(spatial);
            var splitspatial = spatial.split('"type":').join(",").split(",");
            var type = splitspatial[1];
            var coordinateArray = splitspatial.join(",").split('"coordinates":')[1].split('],[');
            console.log(type);
            if (type == '"Point"' | type == ' "Point"') {
                //console.log("Point!");
                coordinateArray = coordinateArray.join(";");
                coordinateArray = coordinateArray.substring(1, coordinateArray.length - 2).split(",");
                console.log(coordinateArray);
                dataPoint = { longitude: parseFloat(coordinateArray[0]), latitude: parseFloat(coordinateArray[1]), height: 0 };
                const pointEntity = cesiumViewer.entities.add({
                    name: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                    description: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                    position: Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height),
                    point: { pixelSize: 20, color: Cesium.Color.RED }
                });
                cesiumViewer.flyTo(pointEntity);

            }
            if (type == '"MultiPolygon"') {
                //console.log("Polygon!");
                var multi = spatial.indexOf("]]],[[[");
                //console.log(coordinateArray);
                console.log(multi);
                if (multi != -1) {
                    var hole=[];
                    var polygonCoos=[];
                    coordinateArray=coordinateArray.join(",")
                    coordinateArray = coordinateArray.substring(4, coordinateArray.length - 5).split(",");
                    console.log(coordinateArray);
                    for (let index = 0; index < coordinateArray.length; index++) {
                        if(coordinateArray[index].indexOf("[[")!=-1){
                            console.log(index);
                            coordinateArray[index]=coordinateArray[index].substring(2,coordinateArray[index].length);
                            
                            while(index<coordinateArray.length){
                                polygonCoos[polygonCoos.length]=parseFloat(coordinateArray[index]);
                                index++;
                            }
                            break;
                        }
                        else if(coordinateArray[index].indexOf("]]")==-1){
                            hole[index]=parseFloat(coordinateArray[index]);
                        }
                        else{
                            coordinateArray[index]=coordinateArray[index].substring(0,coordinateArray[index].length-2);
                            hole[index]=parseFloat(coordinateArray[index]);
                            
                        }
                        
                    }
                    console.log(polygonCoos);
                    console.log(hole);
                    var polygon = cesiumViewer.entities.add({
                        name: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                        polygon: {
                            hierarchy: {
                                positions: Cesium.Cartesian3.fromDegreesArray(
                                    polygonCoos,
                                ),
                                holes: [
                                    {
                                        positions: Cesium.Cartesian3.fromDegreesArray(
                                            hole,
                                        ),
                                    },
                                ],
                            },
                            material: Cesium.Color.RED,
                        },
                    });
                    cesiumViewer.flyTo(polygon);
                    

                }
                else {
                    coordinateArray = coordinateArray.join(",");
                    coordinateArray = coordinateArray.substring(4, coordinateArray.length - 5).split(",");
                    //coordinateArray.split(",");
                    console.log(coordinateArray);
                    //adding Points
                    for (let index = 0; index < coordinateArray.length; index++) {
                        coordinateArray[index] = parseFloat(coordinateArray[index]);

                    }
                    //console.log(coordinateArray);
                    var polygon = cesiumViewer.entities.add({
                        name: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                        polygon: {
                            hierarchy: Cesium.Cartesian3.fromDegreesArray(
                                coordinateArray,
                            ),
                            material: Cesium.Color.RED,
                        },
                    });
                    cesiumViewer.flyTo(polygon);
                }

            }

        } else if (document.getElementsByName(name)[0].innerHTML == "-") {
            var chars = name.split("/");
            console.log("Remove");
            document.getElementsByName(name)[0].innerHTML = "+";
        }
        //document.getElementsByName("R"+name)[0].style.display="block";
    };


    return CKANRequest;
}());
