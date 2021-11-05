var CKANRequest = /** @class */ (function () {
    var mainGroupArray = [];
    var setUp = false;


    function CKANRequest() {

    }
    CKANRequest.prototype.setUp = async function () {
        if (setUp == false) {
            //replace the iframe with a new div and add an EventListener to for selected Entities

            var tableDiv = document.getElementById("custom_infoBoxTable")
            if (Cesium.defined(tableDiv)) {
                tableDiv.parentElement.removeChild(tableDiv);
            }

            tableDiv = document.createElement("div");

            tableDiv.id = "custom_infoBoxTable";
            tableDiv.className = "cesium-infoBox-description";
            var infoBox = document.getElementsByClassName("cesium-infoBox")[0];
            var iframeObj = document.getElementsByClassName("cesium-infoBox-iframe")[0];
            //console.log(infoBox)
            infoBox.insertBefore(tableDiv, iframeObj);
            iframeObj.parentNode.removeChild(iframeObj);

            cesiumViewer.selectedEntityChanged.addEventListener(function (selectedEntity) {
                if (Cesium.defined(selectedEntity)) {
                    if (Cesium.defined(selectedEntity.name)) {
                        document.getElementsByClassName("cesium-infoBox-title")[0].innerHTML = selectedEntity.name;
                        tableDiv.innerHTML = selectedEntity.description;
                    } else {
                        console.log('Unknown entity selected.');
                    }
                } else {
                    console.log('Deselected.');
                }
            });
            setUp = true;
        }

        //console.log(tableDiv);
        //var cesiumInfo = document.querySelectorAll('div.cesium-infoBox')[0];
        //cesiumInfo.appendChild(tableDiv);



        CKANRequest.prototype.getDatasets();
    }
    CKANRequest.prototype.getDatasets = async function () {
        // Communication to the CKAN API,  filling the ResultWindow with the Catalog Entries
        var cam = cesiumCamera;
        var camPos = cam.positionCartographic;
        var view = cam.computeViewRectangle(Cesium.Ellipsoid.WGS84);
        west = view.west * 180 / Cesium.Math.PI;
        east = view.east * 180 / Cesium.Math.PI;
        north = view.north * 180 / Cesium.Math.PI;
        south = view.south * 180 / Cesium.Math.PI;
        var startdate = document.getElementById("startDate").value;
        var enddate = document.getElementById("endDate").value;
        //console.log(startdate);
        var url = document.getElementById('urlCKAN').value;
        var packageUrl = url + "/api/3/action/package_search?ext_bbox=" + west + "%2C" + south + "%2C" + east + "%2C" + north + "&rows=99999999999999999";
        //console.log(packageUrl);
        var results = [];
        var control = [];
        var groups;
        mainGroupArray = [];
        groups = await CKANRequest.prototype.getMainGroups(url);


        CKANRequest.prototype.sendHttpRequest('GET', packageUrl).then(function (responseData) {
            //result= parseResponse(responseData);
            //console.log(responseData.result.results);
            var size = responseData.result.results.length;
            if (size == 0) {
                document.getElementById("CKAN_Results").innerHTML = "<b> No data available</b>";
                document.getElementById("CKAN_Results").style.display = "block";
                document.getElementById("ResultWindow").style.display = "block";
                document.getElementById("CloseCKANButton").style.display = "block";
                document.getElementById("MinCKANButton").style.display = "block";
            }
            //console.log(responseData.result.results.length);
            for (var index = 0; index < responseData.result.results.length; index++) {
                var tempUrl = url + "/api/3/action/package_show?id=" + responseData.result.results[index].id;
                var tempResponseData = responseData;
                //console.log(tempUrl);
                CKANRequest.prototype.sendHttpRequest('GET', tempUrl).then(async function (responseData) {
                    //console.log(responseData.result);
                    if (startdate != "" && enddate != "") {
                        if (CKANRequest.prototype.compareTime(startdate, enddate, responseData.result.begin_collection_date, responseData.result.end_collection_date)) {
                            results.push(responseData.result);
                            control.push(responseData.result);
                            //console.log("innerhalb");
                        }
                        //console.log("außerhalb");
                        control.push(responseData.result);
                    }
                    else {
                        results.push(responseData.result);
                        control.push(responseData.result);
                    }


                    //console.log(tempResponseData.result.results.length);
                    //console.log(results.length);
                    if (control.length === tempResponseData.result.results.length) {
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
                                    if (cesiumViewer.entities.getById(mainGroupArray[i].datasetArray[j].title) != undefined && cesiumViewer.entities.getById(mainGroupArray[i].datasetArray[j].title).show == true) {
                                        text = text + "<p>&emsp;" + mainGroupArray[i].datasetArray[j].title + "<button id='AddButton' name='" + i + "/" + j + "/" + mainGroupArray[i].datasetArray[j].title + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'>-</button></p>";
                                    } else {
                                        text = text + "<p>&emsp;" + mainGroupArray[i].datasetArray[j].title + "<button id='AddButton' name='" + i + "/" + j + "/" + mainGroupArray[i].datasetArray[j].title + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'>+</button></p>";
                                    }
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
        // Use CKAN API to get MainGroups of Catalog
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
        //HTTPRequest function
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
        //Close Button in Result Window
        document.getElementById("ResultWindow").style.display = "none";
        document.getElementById("CloseCKANButton").style.display = "none";
        document.getElementById("MinCKANButton").style.display = "none";
        document.getElementById("MaxCKANButton").style.display = "none";
    };
    CKANRequest.prototype.minResults = function () {
        //Minimize Button in Result Window

        document.getElementById("CKAN_Results").style.display = "none";
        document.getElementById("MinCKANButton").style.display = "none";
        document.getElementById("MaxCKANButton").style.display = "block"


    };
    CKANRequest.prototype.maxResults = function () {
        //Maximize Button in Result Window
        document.getElementById("CKAN_Results").style.display = "block";
        document.getElementById("MinCKANButton").style.display = "block";
        document.getElementById("MaxCKANButton").style.display = "none";
    };
    CKANRequest.prototype.addToMap = async function (name) {
        // Add spatial information as entities to the Cesium Map, or remove it 
        if (document.getElementsByName(name)[0].innerHTML == "+") {
            var chars = name.split("/");

            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].spatial);
            document.getElementsByName(name)[0].innerHTML = "-";
            var groupstring = "";
            for (let index = 0; index < mainGroupArray[chars[0]].datasetArray[chars[1]].groups.length; index++) {
                groupstring = groupstring + mainGroupArray[chars[0]].datasetArray[chars[1]].groups[index].display_name + ", ";
            }

            groupstring = groupstring.substring(0, groupstring.length - 2);

            var resourcesString = '';
            for (let index = 0; index < mainGroupArray[chars[0]].datasetArray[chars[1]].resources.length; index++) {
                resourcesString = resourcesString + "<tr><th>Resource " + (index + 1) + "</th><td><a href='" +
                    mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].url + "' target='_blank'>" + mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].url + "</a>" +
                    "</td></tr>";

            }
            var relationshipObjectString = "";
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length);
            for (let index = 0; index < mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length; index++) {
                var id= mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object[index].__extras.subject_package_id;
                var connectedSubject=await CKANRequest.prototype.getDatasetRepresentation(id).then(console.log(connectedSubject));
                
                async function setRelationObjectString(){
                    if (connectedSubject!=undefined){
                        console.log("defined");
                        relationshipObjectString+="<tr><th>Connection: "+mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object[index].type+" as object</th><td>"+connectedSubject.title+"</td></tr>";
                    }else{
                        setTimeout(setRelationObjectString(),1000);
                    }
                    //
                }
                await setRelationObjectString();
                console.log(connectedSubject);
                
            }

            //Entity Description is displayed in the Infobox if an entitiy is selected
            var entityDescription = '<table class="cesium-infoBox-defaultTable"><tbody>' +
                "<tr><th>Author</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].author +
                "</td></tr>" +
                "<tr><th>Maintainer</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].maintainer +
                "</td></tr>" +
                "<tr><th>Title</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].title +
                "</td></tr>" +
                "<tr><th>Language</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].language +
                "</td></tr>" +
                "<tr><th>ID</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].id +
                "</td></tr>" +
                "<tr><th>Type</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].type +
                "</td></tr>" +
                "<tr><th>State</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].state +
                "</td></tr>" +
                "<tr><th>Is Open</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].isopen +
                "</td></tr>" +
                "<tr><th>Organization</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].organization.title +
                "</td></tr>" +
                "<tr><th>Groups</th><td>" +
                groupstring +
                "</td></tr>" +
                "<tr><th>URL</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].url +
                "</td></tr>" +
                "<tr><th>Num Resources</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].num_resources +
                "</td></tr>" +
                resourcesString +
                relationshipObjectString+
                "<tr><th>Created</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].metadata_created +
                "</td></tr>" +
                "<tr><th>Last Modified</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].metadata_modified +
                "</td></tr>" +
                "<tr><th>Notes</th><td>" +
                mainGroupArray[chars[0]].datasetArray[chars[1]].notes +
                "</td></tr>" +
                "</tbody></table>";
            //var tableElement=document.getElementById("infoBoxTable");
            //var infoBoxDescription=tableElement.querySelectorAll('div.cesium-infoBox-description')[0];

            //infoBoxDescription.innerHTML=entityDescription;
            if (cesiumViewer.entities.getById(mainGroupArray[chars[0]].datasetArray[chars[1]].title) != undefined) {
                var entity = cesiumViewer.entities.getById(mainGroupArray[chars[0]].datasetArray[chars[1]].title);
                entity.show = !entity.show;
                cesiumViewer.flyTo(cesiumViewer.entities);
                return;
            }
            var spatial = mainGroupArray[chars[0]].datasetArray[chars[1]].spatial;
            spatial = spatial.replace(/\s+/g, '');
            //console.log(spatial);
            var splitspatial = spatial.split('"type":').join(",").split(",");
            var type = splitspatial[1];
            var coordinateArray = splitspatial.join(",").split('"coordinates":')[1].split('],[');
            //console.log(type);
            if (type == '"Point"' | type == ' "Point"') {
                //console.log("Point!");
                coordinateArray = coordinateArray.join(";");
                coordinateArray = coordinateArray.substring(1, coordinateArray.length - 2).split(",");
                //console.log(coordinateArray);
                var pinBuilder = new Cesium.PinBuilder();
                dataPoint = { longitude: parseFloat(coordinateArray[0]), latitude: parseFloat(coordinateArray[1]), height: 0 };
                const pointEntity = cesiumViewer.entities.add({
                    name: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                    id: mainGroupArray[chars[0]].datasetArray[chars[1]].title,

                    position: Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.height),
                    billboard: {
                        image: pinBuilder.fromColor(Cesium.Color.RED.withAlpha(0.8), 40).toDataURL(),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    },
                });

                pointEntity.description = entityDescription;
                cesiumViewer.flyTo(cesiumViewer.entities);

            }
            if (type == '"MultiPolygon"') {
                //console.log("Polygon!");
                var multi = spatial.indexOf("]]],[[[");
                //console.log(coordinateArray);
                //console.log(multi);
                if (multi != -1) {
                    var hole = [];
                    var polygonCoos = [];
                    coordinateArray = coordinateArray.join(",")
                    coordinateArray = coordinateArray.substring(4, coordinateArray.length - 5).split(",");
                    //console.log(coordinateArray);
                    for (let index = 0; index < coordinateArray.length; index++) {
                        if (coordinateArray[index].indexOf("[[") != -1) {
                            //console.log(index);
                            coordinateArray[index] = coordinateArray[index].substring(2, coordinateArray[index].length);

                            while (index < coordinateArray.length) {
                                polygonCoos[polygonCoos.length] = parseFloat(coordinateArray[index]);
                                index++;
                            }
                            break;
                        }
                        else if (coordinateArray[index].indexOf("]]") == -1) {
                            hole[index] = parseFloat(coordinateArray[index]);
                        }
                        else {
                            coordinateArray[index] = coordinateArray[index].substring(0, coordinateArray[index].length - 2);
                            hole[index] = parseFloat(coordinateArray[index]);

                        }

                    }
                    //console.log(polygonCoos);
                    //console.log(hole);
                    var polygon = cesiumViewer.entities.add({
                        name: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                        id: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
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
                            material: Cesium.Color.RED.withAlpha(0.5),
                        },
                    });
                    cesiumViewer.flyTo(cesiumViewer.entities);


                }
                else {
                    coordinateArray = coordinateArray.join(",");
                    coordinateArray = coordinateArray.substring(4, coordinateArray.length - 5).split(",");
                    //coordinateArray.split(",");
                    //console.log(coordinateArray);
                    //adding Points
                    for (let index = 0; index < coordinateArray.length; index++) {
                        coordinateArray[index] = parseFloat(coordinateArray[index]);

                    }
                    //console.log(coordinateArray);
                    var polygon = cesiumViewer.entities.add({
                        name: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                        id: mainGroupArray[chars[0]].datasetArray[chars[1]].title,
                        polygon: {
                            hierarchy: Cesium.Cartesian3.fromDegreesArray(
                                coordinateArray,
                            ),
                            material: Cesium.Color.RED.withAlpha(0.5),
                        },
                    });
                    cesiumViewer.flyTo(cesiumViewer.entities);
                }
                polygon.description = entityDescription;
                cesiumViewer.flyTo(cesiumViewer.entities);


            }

        } else if (document.getElementsByName(name)[0].innerHTML == "-") {
            var chars = name.split("/");
            //console.log("Remove");
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].title);
            var entity = cesiumViewer.entities.getById(mainGroupArray[chars[0]].datasetArray[chars[1]].title);
            entity.show = !entity.show;
            cesiumViewer.flyTo(cesiumViewer.entities);
            document.getElementsByName(name)[0].innerHTML = "+";

        }

        //document.getElementsByName("R"+name)[0].style.display="block";
    };

    CKANRequest.prototype.openAdditionalInput = function () {
        //Temporal filters can be added to the CKAN Request
        if (document.getElementById("additionalInput").innerHTML == "Additional Input...") {
            document.getElementById("additionalInput").innerHTML = "Close Additional Input";
            document.getElementById("temporalInput").style.display = "block";
        } else if (document.getElementById("additionalInput").innerHTML == "Close Additional Input") {
            document.getElementById("additionalInput").innerHTML = "Additional Input...";
            document.getElementById("temporalInput").style.display = "none";
        }


    }
    CKANRequest.prototype.compareTime = function (startdate, enddate, collectionStart, collectionEnd) {
        if (collectionEnd == undefined) {
            var today = new Date();
            collectionEnd = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate();
        }
        if (collectionStart == undefined || collectionStart == "") {
            collectionStart = startdate;
        }
        startArray = startdate.split("-");
        endArray = enddate.split("-");
        collectionStartArray = collectionStart.split("-");
        collectionEndArray = collectionEnd.split("-");
        //console.log(startArray);
        //console.log(collectionStartArray);
        if (parseInt(startArray[0]) > parseInt(collectionStartArray[0]) || parseInt(endArray[0]) < parseInt(collectionEndArray[0])) {
            //console.log("Startjahr später oder Endjahr früher");
            return false;
        }
        if (parseInt(startArray[0]) == parseInt(collectionStartArray[0])) {
            if (parseInt(startArray[1]) > parseInt(collectionStartArray[1])) {
                //console.log("Startmonat später");
                return false;
            }
            if (parseInt(startArray[1]) == parseInt(collectionStartArray[1])) {
                if (parseInt(startArray[2]) > parseInt(collectionStartArray[2])) {
                    //console.log("Starttag später");
                    return false;
                }
            }
        }
        if (parseInt(endArray[0]) == parseInt(collectionEndArray[0])) {
            if (parseInt(endArray[1]) < parseInt(collectionEndArray[1])) {
                //console.log("Endmonat früher");
                return false;
            }
            if (parseInt(endArray[1]) == parseInt(collectionEndArray[1])) {
                if (parseInt(endArray[2]) < parseInt(collectionEndArray[2])) {
                    //console.log("Endtag früher")
                    return false;
                }
            }
        }
        //console.log("innerhalb")
        return true;
    }

    CKANRequest.prototype.getDatasetRepresentation = async function (id) {
        var url = document.getElementById('urlCKAN').value + "/api/3/action/package_show?id=" + id;
        
        CKANRequest.prototype.sendHttpRequest('GET', url).then(function (responseData) {
            console.log(responseData.result)
            return responseData.result;
        });
        

    }




    return CKANRequest;
}());
