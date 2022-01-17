var CKANRequest = /** @class */ (function () {
    var mainGroupArray = [];
    var setUp = false;
    var connDataArray = [];
    var connDataCount = 0;
    var wmsModel;
    var dataLayers = [];
    var viewModel;
    var imageryLayers;


    function CKANRequest() {

    }
    CKANRequest.prototype.setUp = async function () {
        //make all entities invisible
        var entities = cesiumViewer.entities;
        //console.log(entities._entities._array.length);
        if (entities._entities._array.length > 0) {
            var x = document.getElementById("CKAN_Results");
            var but = x.getElementsByClassName("cesium-button");
            for (let index = 0; index < but.length; index++) {
                but[index].innerHTML = "+";

            }
        }
        for (let index = 0; index < entities._entities._array.length; index++) {
            if (entities._entities._array[index].show = true) {
                entities._entities._array[index].show = false;
            }

        }
        entities.show = !entities.show;

        document.getElementById("CKAN_Results").innerHTML = "<b> Loading data...</b>";
        document.getElementById("CKAN_Results").style.display = "block";
        document.getElementById("ResultWindow").style.display = "block";

        //if called the first time replace the iframe with a new div
        if (setUp == false) {
            //replace the iframe with a new div and add an EventListener for selected Entities, iFrame is not deleted and is used for wms information

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
            //iframeObj.parentNode.removeChild(iframeObj);

            cesiumViewer.selectedEntityChanged.addEventListener(function (selectedEntity) {
                if (Cesium.defined(selectedEntity)) {
                    if (Cesium.defined(selectedEntity.name)) {
                        document.getElementsByClassName("cesium-infoBox-title")[0].innerHTML = selectedEntity.name;
                        tableDiv.innerHTML = selectedEntity.descr;
                    } else {
                        tableDiv.innerHTML = "";
                        console.log('Unknown entity selected.');
                    }
                } else {
                    console.log('Deselected.');
                }
            });
            //viewModel for WMS Layer Management inspired of:
            //https://sandcastle.cesium.com/?src=Imagery%20Layers%20Manipulation.html&label=All
            imageryLayers = cesiumViewer.imageryLayers;
            viewModel = {
                layers: [],
                baseLayers: [],
                upLayer: null,
                downLayer: null,
                selectedLayer: null,

            };
            setUp = true;
        }

        CKANRequest.prototype.getDatasets();
    }
    CKANRequest.prototype.getDatasets = async function () {
        // Communication to the CKAN API,  filling the ResultWindow with the Catalog Entries
        var cam = cesiumCamera;
        var camPos = cam.positionCartographic;

        //get all input information
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

        var results = []; //all results fitting the spatial input parameters

        var groups;
        mainGroupArray = [];
        groups = await CKANRequest.prototype.getMainGroups(url);

        //all datasets matching the url query
        var datasets = fetch(packageUrl).then((resp) => resp.json()).then(function (data) {
            return data.result;
        })
            .catch(function (error) {
                console.log(error);
            });
        //result= parseResponse(responseData);
        //console.log(responseData.result.results);
        var data = await datasets;
        var size = data.results.length;
        // if no data is available
        if (size == 0) {
            document.getElementById("CKAN_Results").innerHTML = "<b> No data available</b>";
            document.getElementById("CKAN_Results").style.display = "block";
            document.getElementById("ResultWindow").style.display = "block";
            document.getElementById("CloseCKANButton").style.display = "block";
            document.getElementById("MinCKANButton").style.display = "block";
        }


        // get full representations of the datasets
        for (var index = 0; index < data.results.length; index++) {
            var tempUrl = url + "/api/3/action/package_show?id=" + data.results[index].id;
            var tempResponseData = data;
            //console.log(tempUrl);
            var result = fetch(tempUrl).then((resp) => resp.json()).then(function (data) {
                return data.result;
            }).catch(function (error) {
                console.log(error);
            });
            var res = await result;
            //console.log(responseData.result);

            //control if date is inside the set input temporal parameters
            if (startdate != "" && enddate != "") {
                if (CKANRequest.prototype.compareTime(startdate, enddate, res.begin_collection_date, res.end_collection_date)) {
                    results.push(res);


                }


            }
            else {
                results.push(res);

            }
        }

        //console.log(tempResponseData.result.results.length);
        console.log(results);



        //group results according to the MainGroups
        async function setGroups() {
            if (groups != undefined) {
                if (groups.length == 0) {
                    setTimeout(setGroups, 1000);
                } else {



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
                    var addedDataArray = []
                    var addedGroup = new MainGroup("Extra Datasets", addedDataArray)
                    mainGroupArray.push(addedGroup);

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
        CKANRequest.prototype.refreshResultWindow();



    };
    CKANRequest.prototype.getMainGroups = async function (url) {
        // Use CKAN API to get MainGroups of Catalog
        var groups = [];
        var mainGroups = [];


        //console.log(url);
        var groupListURL = url + "/api/3/action/group_list";
        //console.log(groupListURL);
        var grouplist = fetch(groupListURL).then((resp) => resp.json()).then(function (data) {
            return data.result;
        }).catch(function (error) {
            console.log(error);
        });
        var result = await grouplist;
        l = result.length;
        for (let index = 0; index < result.length; index++) {
            groups[groups.length] = result[index];
            var tempGroupURL = url + "/api/3/action/group_show?id=" + result[index];
            //console.log(tempGroupURL);

            var mainGroup = fetch(tempGroupURL).then((resp) => resp.json()).then(function (data) {
                return data.result;
            }).catch(function (error) {
                console.log(error);
            });
            var main = await mainGroup;
            //console.log(result.length);
            if (main.groups[0] != undefined) {
                if (main.groups[0].name === "main-categories") {
                    mainGroups.push(main.display_name);

                }

            }




        }
        return mainGroups;




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
        var entities = cesiumViewer.entities;
        entities.show = true;
        //console.log(document.getElementsByName(name)[0].innerHTML);
        //console.log('<img src="utils/CKAN-integration/images/visibility_off_white_18dp.svg">')
        if (document.getElementsByName(name)[0].innerHTML == '<span class="material-icons md-12">check_box_outline_blank</span>') {
            //split name to get information on which dataset should be added
            var chars = name.split("/");

            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].spatial);
            document.getElementsByName(name)[0].innerHTML = '<span class="material-icons md-12">check_box</span>';
            if (document.getElementById("ConnectionInfo").style.display == "block" && document.getElementById("ConnectionTitle").innerHTML == chars[2]) {
                var tableString = document.getElementById("connTable").innerHTML;
                var newTableString = tableString.replace("check_box_outline_blank", "check_box");
                document.getElementById("connTable").innerHTML = newTableString;
            }
            var groupstring = ""; // parse groupArray
            for (let index = 0; index < mainGroupArray[chars[0]].datasetArray[chars[1]].groups.length; index++) {
                groupstring = groupstring + mainGroupArray[chars[0]].datasetArray[chars[1]].groups[index].display_name + ", ";
            }
            // Remove last comma
            groupstring = groupstring.substring(0, groupstring.length - 2);

            var resourcesString = '';
            for (let index = 0; index < mainGroupArray[chars[0]].datasetArray[chars[1]].resources.length; index++) {
                resourcesString = resourcesString + "<tr><th>Resource " + (index + 1) + "</th><td>";
                if (mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].restricted.search("public") == -1) {
                    resourcesString = resourcesString + "restricted non public resource: "
                }
                if (mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].format == "WMS") {

                    resourcesString = resourcesString + "<button id='WMSButton' name='" + chars[0] + "/" + chars[1] + "/" + index + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addWMS(name)'>WMS</button>" +
                        "</td></tr>";
                }
                else if (mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].format == "GeoJSON") {
                    resourcesString = resourcesString + "<button id='GeoJSONButton' name='" + mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].url + ";" + mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].name + ";" + mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].description +
                        "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addGeoJSON(name)'>GeoJSON: " + mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].url + "</button>"
                }
                else {
                    resourcesString = resourcesString + "<a href='" +
                        mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].url + "' target='_blank'>" + mainGroupArray[chars[0]].datasetArray[chars[1]].resources[index].url + "</a>" +
                        "</td></tr>";
                }
            }
            var relationshipObjectString = "";
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length);
            for (let index = 0; index < mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length; index++) {
                var id = mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object[index].__extras.subject_package_id;
                var url = document.getElementById('urlCKAN').value + "/api/3/action/package_show?id=" + id;
                var dataset = fetch(url).then((resp) => resp.json()).then(function (data) {
                    return data.result;
                }).catch(function (error) {
                    console.log(error);
                });
                var connData = await dataset;
                //console.log(connData);
                if (connData != undefined) {
                    //console.log("defined");
                    connDataArray.push(connData);

                    relationshipObjectString += "<tr><th>Connection: " + mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + "</button></td></tr>";
                    connDataCount++;
                }
            }
            var relationshipSubjectString = "";
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length);
            for (let index = 0; index < mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_subject.length; index++) {
                var id = mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_subject[index].__extras.object_package_id;
                var url = document.getElementById('urlCKAN').value + "/api/3/action/package_show?id=" + id;
                var dataset = fetch(url).then((resp) => resp.json()).then(function (data) {
                    return data.result;
                }).catch(function (error) {
                    console.log(error);
                });
                var connData = await dataset;
                //console.log(connData);
                if (connData != undefined) {
                    //console.log("defined");
                    connDataArray.push(connData);
                    relationshipSubjectString += "<tr><th>Connection: " + mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + "</button></td></tr>";
                    connDataCount++;
                }
            }

            //Entity Description is displayed in the customInfobox if an entitiy is selected
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
                relationshipSubjectString +
                relationshipObjectString +
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


            //if entity is already created only make it visible
            if (cesiumViewer.entities.getById(mainGroupArray[chars[0]].datasetArray[chars[1]].title) != undefined) {
                var entity = cesiumViewer.entities.getById(mainGroupArray[chars[0]].datasetArray[chars[1]].title);
                entity.show = !entity.show;
                cesiumViewer.flyTo(cesiumViewer.entities);
                return;
            }

            //parse spatial attribute
            CKANRequest.prototype.parseSpatial(mainGroupArray[chars[0]].datasetArray[chars[1]], entityDescription);


        } else if (document.getElementsByName(name)[0].innerHTML == '<span class="material-icons md-12">check_box</span>') {
            // entity should be made invisible if button was an checked box
            var chars = name.split("/");
            //console.log("Remove");
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].title);
            var entity = cesiumViewer.entities.getById(mainGroupArray[chars[0]].datasetArray[chars[1]].title);
            entity.show = !entity.show;
            cesiumViewer.flyTo(cesiumViewer.entities);
            //make button an unchecked box
            document.getElementsByName(name)[0].innerHTML = '<span class="material-icons md-12">check_box_outline_blank</span>';
            //if a connectiontable is open with the entity the checkbox in the table has to be altered
            if (document.getElementById("ConnectionInfo").style.display == "block" && document.getElementById("ConnectionTitle").innerHTML == chars[2]) {
                var tableString = document.getElementById("connTable").innerHTML;
                var newTableString = tableString.replace("check_box", "check_box_outline_blank");
                document.getElementById("connTable").innerHTML = newTableString;
            }
        }

        //document.getElementsByName("R"+name)[0].style.display="block";
    };

    CKANRequest.prototype.openAdditionalInput = function () {

        //Temporal filters can be added to the CKAN Request
        if (document.getElementById("additionalInput").innerHTML == '<span class="material-icons md-12" style="filter: none;">expand_more</span>' | document.getElementById("additionalInput").innerHTML == '<span class="material-icons md-12">expand_more</span>') {
            document.getElementById("additionalInput").innerHTML = "<span class='material-icons md-12'>expand_less</span>";
            document.getElementById("temporalInput").style.display = "block";
        } else if (document.getElementById("additionalInput").innerHTML == '<span class="material-icons md-12">expand_less</span>') {
            document.getElementById("additionalInput").innerHTML = "<span class='material-icons md-12'>expand_more</span>";
            document.getElementById("temporalInput").style.display = "none";
        }


    }
    CKANRequest.prototype.zoomOnEntities = function () {
        cesiumViewer.flyTo(cesiumViewer.entities);
    }
    CKANRequest.prototype.compareTime = function (startdate, enddate, collectionStart, collectionEnd) {
        //return false if collectionStart or end is outside the queried time frame
        if (collectionEnd == undefined || collectionEnd == "") {
            //if collectionEnd is not defined use today
            var today = new Date();
            collectionEnd = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate();
        }
        if (collectionStart == undefined || collectionStart == "") {
            //if collectionStart is not defined use startdate --> start is always in time frame
            collectionStart = startdate;
        }
        //parse date into array with year, month and day
        startArray = startdate.split("-");
        endArray = enddate.split("-");
        collectionStartArray = collectionStart.split("-");
        collectionEndArray = collectionEnd.split("-");

        //compare year
        if (parseInt(startArray[0]) > parseInt(collectionStartArray[0]) || parseInt(endArray[0]) < parseInt(collectionEndArray[0])) {
            //collectionStart before queried startdate or collection end after queried enddate
            return false;
        }

        if (parseInt(startArray[0]) == parseInt(collectionStartArray[0])) {
            //Same year
            if (parseInt(startArray[1]) > parseInt(collectionStartArray[1])) {
                //collection Start month before queried start month
                return false;
            }
            if (parseInt(startArray[1]) == parseInt(collectionStartArray[1])) {
                //same month
                if (parseInt(startArray[2]) > parseInt(collectionStartArray[2])) {
                    // collection Start day before queried startday
                    return false;
                }
            }
        }
        if (parseInt(endArray[0]) == parseInt(collectionEndArray[0])) {
            //same year
            if (parseInt(endArray[1]) < parseInt(collectionEndArray[1])) {
                //collection end month after queried end month
                return false;
            }
            if (parseInt(endArray[1]) == parseInt(collectionEndArray[1])) {
                //same month
                if (parseInt(endArray[2]) < parseInt(collectionEndArray[2])) {
                    //collection end day after queried end day
                    return false;
                }
            }
        }
        //startdate before collection Start and enddate after collection end
        return true;
    }

    CKANRequest.prototype.showConnection = async function (ind) {
        //build a window for connected dataset

        var connData = connDataArray[ind];
        var groupstring = ""; // parse groupArray

        for (let index = 0; index < connData.groups.length; index++) {
            groupstring = groupstring + connData.groups[index].display_name + ", ";
        }
        // Remove last comma
        groupstring = groupstring.substring(0, groupstring.length - 2);

        var resourcesString = ''; //parse connected Resources display them using links
        for (let index = 0; index < connData.resources.length; index++) {
            resourcesString = resourcesString + "<tr><th>Resource " + (index + 1) + "</th><td>";
            if (connData.resources[index].restricted.search("public") == -1) {
                resourcesString = resourcesString + "restricted non public resource: "
            }
            if (connData.resources[index].format == "WMS") {
                resourcesString = resourcesString + "<button id='WMSButton' name='" + connData.resources[index].url + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addWMS(name)'>WMS</button>" +
                    "</td></tr>";
            }
            else if (connData.resources[index].format == "GeoJSON") {
                resourcesString = resourcesString + "<button id='WMSButton' name='" + connData.resources[index].url + ";" + connData.resources[index].name + ";" + connData.resources[index].description + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addGeoJSON(name)'>GeoJSON: " + connData.resources[index].url + "</button>"
            }
            else {
                resourcesString = resourcesString + "<a href='" +
                    connData.resources[index].url + "' target='_blank'>" + connData.resources[index].url + "</a>" +
                    "</td></tr>";
            }

        }
        //parse relations as object, display them using buttons which lead to the connected datasets which open in a new window
        var relationshipObjectString = "";

        for (let index = 0; index < connData.relationships_as_object.length; index++) {
            var id = connData.relationships_as_object[index].__extras.subject_package_id;
            var url = document.getElementById('urlCKAN').value + "/api/3/action/package_show?id=" + id;
            var dataset = fetch(url).then((resp) => resp.json()).then(function (data) {
                return data.result;
            }).catch(function (error) {
                console.log(error);
            });

            var connDataNew = await dataset;
            //console.log(connData);

            if (connDataNew != undefined) {
                //console.log("defined");
                connDataArray.push(connDataNew);
                relationshipObjectString += "<tr><th>Connection: " + connData.relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connDataNew.title + "</button></td></tr>";
                connDataCount++;
            }
        }

        //parse relations as subject, display them using buttons which lead to the connected datasets which open in a new window

        var relationshipSubjectString = "";
        for (let index = 0; index < connData.relationships_as_subject.length; index++) {
            var id = connData.relationships_as_subject[index].__extras.object_package_id;
            var url = document.getElementById('urlCKAN').value + "/api/3/action/package_show?id=" + id;
            //get full representation of connected dataset
            var dataset = fetch(url).then((resp) => resp.json()).then(function (data) {
                return data.result;
            }).catch(function (error) {
                console.log(error);
            });

            var connDataNew = await dataset;
            //console.log(connData);
            if (connDataNew != undefined) {
                connDataArray.push(connDataNew);
                relationshipSubjectString += "<tr><th>Connection: " + connData.relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connDataNew.title + "</button></td></tr>";
                connDataCount++; //connDataCount used as index in connDataArray and as a name for the button to identify which dataset is connected to which button
            }

        }
        //fill html element ConnectionInfo
        var connInfo = document.getElementById("ConnectionInfo");

        document.getElementById("ConnectionTitle").innerHTML = connData.title;
        var spatialString = "";
        var ind = "";

        if (connData.spatial != "") {
            //if dataset has spatial information a button should be added to add the information to the map
            var exists = false;//test if the dataset is already part of the queried datasets
            for (let i = 0; i < mainGroupArray.length; i++) {
                for (let j = 0; j < mainGroupArray[i].datasetArray.length; j++) {
                    if (connData.id == mainGroupArray[i].datasetArray[j].id) {
                        exists = true;
                        ind = `${i}/${j}`; //safe the indices of the dataset in the mainGroupArray
                        break;
                    }
                }
                if (exists) {
                    break;
                }
            }
            if (exists) {
                var name = ind + "/" + connData.title;
                console.log(name)
                if (document.getElementsByName(name)[0].innerHTML == '<span class="material-icons md-12">check_box_outline_blank</span>') {//dataset exists but is currently not visible
                    spatialString = "<tr><th>Spatial</th><td><button type='button' id='ConnectionSpatialAdd' class='cesium-button' name='" + name + "' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-18'>check_box_outline_blank</span></button></td></tr>";
                    //CKANRequest.prototype.addToMap(name);  
                }
                else {//entity already visible
                    spatialString = "<tr><th>Spatial</th><td><button type='button' id='ConnectionSpatialAdd' class='cesium-button' name='" + name + "' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-18'>check_box</span></button></td></tr>";

                }
            }
            else {// dataset does not exist --> spatial entity has to be created
                mainGroupArray[mainGroupArray.length - 1].datasetArray.push(connData);
                var name = `${mainGroupArray.length - 1}/${mainGroupArray[mainGroupArray.length - 1].datasetArray.length - 1}`
                name = name + "/" + connData.title;
                spatialString = "<tr><th>Spatial</th><td><button type='button' id='ConnectionSpatialAdd' class='cesium-button' name='" + name + "' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-18'>check_box_outline_blank</span></button></td></tr>";
                CKANRequest.prototype.refreshResultWindow();

            }

        }
        else {
            console.log(connData);
        }

        document.getElementById("connTable").innerHTML = '<tbody>' +
            "<tr><th>Author</th><td>" +
            connData.author +
            "</td></tr>" +
            "<tr><th>Maintainer</th><td>" +
            connData.maintainer +
            "</td></tr>" +
            "<tr><th>Title</th><td>" +
            connData.title +
            "</td></tr>" +
            "<tr><th>Language</th><td>" +
            connData.language +
            "</td></tr>" +
            "<tr><th>ID</th><td>" +
            connData.id +
            "</td></tr>" +
            "<tr><th>Type</th><td>" +
            connData.type +
            "</td></tr>" +
            "<tr><th>State</th><td>" +
            connData.state +
            "</td></tr>" +
            "<tr><th>Is Open</th><td>" +
            connData.isopen +
            "</td></tr>" +
            "<tr><th>Organization</th><td>" +
            connData.title +
            "</td></tr>" +
            "<tr><th>Groups</th><td>" +
            groupstring +
            "</td></tr>" +
            "<tr><th>URL</th><td>" +
            connData.url +
            "</td></tr>" +
            "<tr><th>Num Resources</th><td>" +
            connData.num_resources +
            "</td></tr>" +
            resourcesString +
            relationshipSubjectString +
            relationshipObjectString +
            spatialString +
            "<tr><th>Created</th><td>" +
            connData.metadata_created +
            "</td></tr>" +
            "<tr><th>Last Modified</th><td>" +
            connData.metadata_modified +
            "</td></tr>" +
            "<tr><th>Notes</th><td>" +
            connData.notes +
            "</td></tr>" +
            "</tbody>";

        connInfo.style.display = "block";


    }
    CKANRequest.prototype.closeConnectionWindow = function () {
        document.getElementById("ConnectionInfo").style.display = "none";
    }
    CKANRequest.prototype.spatialPlusMinus = function () {
        if (document.getElementById("ConnectionSpatialAdd").innerHTML == '<span class="material-icons md-18">check_box</span>') {
            document.getElementById("ConnectionSpatialAdd").innerHTML = '<span class="material-icons md-18">check_box_outline_blank</span>';
        }
        else {
            document.getElementById("ConnectionSpatialAdd").innerHTML = '<span class="material-icons md-18">check_box</span>';
        }
    }
    CKANRequest.prototype.addGeoJSON = async function (resource) {
        var data=resource.split(";"); //resource format: url;name;description
        var url=data[0];
        var name=data[1];
        var description=data[2];
        if(cesiumViewer.entities.getById(name)!=undefined){
            cesiumViewer.entities.getById(name).show=true;
            return;
        }
        var dataset = fetch(url).then((resp) => resp.json()).then(function (data) {
            return data;
        }).catch(function (error) {
            console.log(error);
        });
        description+="<button id='RemoveGeoJSON' name='"+name+"' class='cesium-button' onclick='CKANRequest.prototype.removeGeoJSON(name)'>Remove From Map</button>"
        var geojson = await dataset;
        
        //console.log(geojson);
        //const obj = JSON.parse(geojson);
        var dataSource = Cesium.GeoJsonDataSource.load(geojson, { fill: Cesium.Color.RED.withAlpha(0.5), });
        cesiumViewer.dataSources.add(dataSource);
        var dataSources = cesiumViewer.dataSources._dataSources;
        var entityArray = dataSources[dataSources.length - 1]._entityCollection._entities._array;
        if (entityArray.length > 1) {
            //if there are more then one entities for a dataset a parent entity has to be created 
            //so that the different entities can be modified using a single id
            //descr is used because description would be displayed using the iframe which is not wanted
            cesiumViewer.entities.add(new Cesium.Entity({ id: name }));
            for (let index = 0; index < entityArray.length; index++) {
                entityArray[index].descr = description;
                entityArray[index].name = name;
                entityArray[index].id = name;
                entityArray[index].parent = cesiumViewer.entities.getById(name);
                cesiumViewer.entities.add(entityArray[index]);
            }

        }
        else {
            //if only one entity is part of the resource there is no need for a paren entity
            //descr is used because description would be displayed using the iframe which is not wanted
            entityArray[0].descr = description;
            entityArray[0].name = name;
            entityArray[0].id = name;

            entityArray[0]._id = name;
            cesiumViewer.entities.add(entityArray[0]);
        }
        
       
        cesiumViewer.flyTo(cesiumViewer.entities);

    }
    CKANRequest.prototype.removeGeoJSON= function(name){
        var entity=cesiumViewer.entities.getById(name);
        entity.show=false;
        
        //cesiumViewer.entities.remove(entity);
        //console.log(cesiumViewer.entities);
    }
    CKANRequest.prototype.parseSpatial = function (dataset, entityDescription) {
        //parse spatial attribute
        var spatial = dataset.spatial;
        //console.log(spatial);
        const obj = JSON.parse(spatial);
        var dataSource = Cesium.GeoJsonDataSource.load(obj, { fill: Cesium.Color.RED.withAlpha(0.5), });
        cesiumViewer.dataSources.add(dataSource);
        var dataSources = cesiumViewer.dataSources._dataSources;
        var entityArray = dataSources[dataSources.length - 1]._entityCollection._entities._array;
        if (entityArray.length > 1) {
            //if there are more then one entities for a dataset a parent entity has to be created 
            //so that the different entities can be modified using a single id
            cesiumViewer.entities.add(new Cesium.Entity({ id: dataset.title }));
            for (let index = 0; index < entityArray.length; index++) {
                entityArray[index].descr = entityDescription;
                entityArray[index].name = dataset.title;
                entityArray[index].id = dataset.title;
                entityArray[index].parent = cesiumViewer.entities.getById(dataset.title);
                cesiumViewer.entities.add(entityArray[index]);
            }

        }
        else {
            //descr is used because description would be displayed using the iframe which is not wanted
            entityArray[0].descr = entityDescription;
            entityArray[0].name = dataset.title;
            entityArray[0].id = dataset.title;

            entityArray[0]._id = dataset.title;
            cesiumViewer.entities.add(entityArray[0]);
        }

        cesiumViewer.flyTo(cesiumViewer.entities);
    }
    CKANRequest.prototype.refreshResultWindow = function () {
        var x = document.getElementById("CKAN_Results");
        var text = "";

        // fill the result window
        for (let i = 0; i < mainGroupArray.length; i++) {
            if (mainGroupArray[i].datasetArray.length > 0) {
                text = text + "<b>" + mainGroupArray[i].name + "</b>";

                for (let j = 0; j < mainGroupArray[i].datasetArray.length; j++) {
                    if (cesiumViewer.entities.getById(mainGroupArray[i].datasetArray[j].title) != undefined && cesiumViewer.entities.getById(mainGroupArray[i].datasetArray[j].title).show == true) {
                        text = text + "<p>" + "<button id='AddButton' name='" + i + "/" + j + "/" + mainGroupArray[i].datasetArray[j].title + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-12'>check_box</span></button>&emsp;" + mainGroupArray[i].datasetArray[j].title + "</p>";
                    } else {
                        text = text + "<p>" + "<button id='AddButton' name='" + i + "/" + j + "/" + mainGroupArray[i].datasetArray[j].title + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-12'>check_box_outline_blank</span></button>&emsp;" + mainGroupArray[i].datasetArray[j].title + "</p>";
                    }
                }
                //text=text+"<br>";
            }

        }
        x.innerHTML = text;
        x.style.display = "block";
        document.getElementById("ResultWindow").style.display = "block";
        document.getElementById("CloseCKANButton").style.display = "block";
        document.getElementById("MinCKANButton").style.display = "block";
    }
    CKANRequest.prototype.addWMS = async function (name) {
        var data = name.split("/");
        var url = mainGroupArray[data[0]].datasetArray[data[1]].resources[data[2]].url;
        var dataset = fetch(url + "Service=WMS&Request=GetCapabilities").then((resp) => resp.text()).then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(function (data) { return data; });
        wmsModel = {
            name: '',
            iconUrl: '',
            tooltip: '',
            url: '',
            layers: '',
            additionalParameters: '',
            proxyUrl: '/proxy/'
        };

        wmsModel.url = url;
        wmsModel.iconUrl = "https://banner2.cleanpng.com/20180409/udq/kisspng-computer-icons-web-map-service-layer-5acb54ec0f8346.8689149915232749880636.jpg";
        //wmsModel.name = mainGroupArray[data[0]].datasetArray[data[1]].title
        wmsModel.tooltip = mainGroupArray[data[0]].datasetArray[data[1]].title + " - WMS";

        var wmsData = await dataset;

        var layers = wmsData.getElementsByTagName("Layer");
        var selector = document.getElementById("layerSelector");
        selector.innerHTML = "";
        //console.log(layers);
        if (layers.length == 0) {
            var opt = document.createElement('option');
            opt.value = "No layers found";
            opt.innerHTML = "No layers found";
            selector.appendChild(opt);
            document.getElementById("LayerWindow").style.display = "block";
            document.getElementById("WMSLayerButton").style.display = "none";
            return;
        }

        for (let index = 0; index < layers.length; index++) {
            //console.log(layers[index].attributes.queryable)
            if (layers[index].attributes.queryable != undefined && layers[index].attributes.queryable.nodeValue == "1") {

                var layerMetadata = layers[index].children;
                var layerName;
                var layerTitle;
                for (let index = 0; index < layerMetadata.length; index++) {
                    if (layerMetadata[index].tagName == "Name") {
                        layerName = layerMetadata[index].innerHTML;
                    }
                    if (layerMetadata[index].tagName == "Title") {
                        layerTitle = layerMetadata[index].innerHTML;
                    }



                }

                var opt = document.createElement('option');
                //console.log(layerTitle + layerName);
                opt.value = layerName;
                opt.innerHTML = layerTitle;
                selector.appendChild(opt);
            }

        }
        document.getElementById("LayerWindow").style.display = "block"
        document.getElementById("WMSLayerButton").style.display = "block";
        //console.log(addWmsViewModel);

        //console.log(addWmsViewModel.url);

    }
    CKANRequest.prototype.wmsLayerToMap = function () {
        //the selected layer of the selector is added to the wmsModel
        var selLayer = document.getElementById("layerSelector");
        var layer = selLayer.options[selLayer.selectedIndex].value;
        wmsModel.layers = layer;
        wmsModel.name = selLayer.options[selLayer.selectedIndex].innerHTML;
        CKANRequest.prototype.addWebMapServiceProvider(wmsModel);
        document.getElementById("LayerWindow").style.display = "none";

    }
    CKANRequest.prototype.addWebMapServiceProvider = function (wmsViewModel) {
        //add the wms imagery as an imageryLayer to the map
        imageryLayers = cesiumViewer.imageryLayers;

        addAdditionalLayerOption(wmsViewModel.name,
            new Cesium.WebMapServiceImageryProvider({
                url: wmsViewModel.url.trim(),
                layers: wmsViewModel.layers.trim(),
                parameters: {
                    transparent: true,
                    format: "image/png",
                },
            }),
            1.0,
            true);
        updateLayerList();

    }
    CKANRequest.prototype.closeLayerWindow = function () {
        document.getElementById("LayerWindow").style.display = "none";
    }
    //https://sandcastle.cesium.com/?src=Imagery%20Layers%20Manipulation.html&label=All
    function updateLayerList() {
        //update the layers in the viewModel according to the imagery layers
        var numLayers = imageryLayers.length;
        viewModel.layers.splice(0, viewModel.layers.length);
        for (var i = numLayers - 1; i >= 0; --i) {
            viewModel.layers.push(imageryLayers.get(i));
        }
        updateLayerWindow();
    }
    function addAdditionalLayerOption(name, imageryProvider, alpha, show) {
        // a new layer is added to the imagery layers
        var layer = imageryLayers.addImageryProvider(imageryProvider);
        layer.alpha = Cesium.defaultValue(alpha, 1.0);
        layer.show = Cesium.defaultValue(show, true);
        layer.name = name;
        //Cesium.knockout.track(layer, ["alpha", "show", "name"]);
    }
    function updateLayerWindow() {
        //the window where the layer options are listed gets updated according to the layers in the viewModel
        var layerList = document.getElementById("LoadedLayersTable");
        layerList.innerHTML = "";
        //format: checkbox whether layer is shown   Name    alpha range     buttons to change "zValue"
        //-1 because the basic imagery layer of Cesium should not be displayed as it should not be disabled or raised/lowered
        for (let index = 0; index < viewModel.layers.length - 1; index++) {
            layerList.innerHTML += "<tr><td><input id='box" +
                index + "' type='checkbox' onclick='CKANRequest.prototype.checkVisible(id)' checked></td><td><span>" +
                viewModel.layers[index].name + "</span></td><td><input type='range' min='0' max='1' step='0.01' value='" +
                viewModel.layers[index].alpha + "'></td><td><button type='button' id='lay" + index + "' class='cesium-button' onclick='CKANRequest.prototype.raiseLayer(id)'>▲</button></td>" +
                "<td><button type='button' id='lay" + index + "'class='cesium-button' onclick='CKANRequest.prototype.lowerLayer(id)'>▼</button></td></tr>";

        }
        document.getElementById("LoadedLayersWindow").style.display = "block";

    }
    CKANRequest.prototype.checkVisible = function (id) {
        //when a checkbox is clicked the corresponding imagerylayer ahas to be shown or not shown
        var index = id.substring(3, id.length)
        var box = document.getElementById(id);
        if (box.checked) {
            viewModel.layers[index].show = true;
        } else {
            viewModel.layers[index].show = false;
        }
    }
    CKANRequest.prototype.raiseLayer = function (id) {
        //raise a layer 1 step
        var index = id.substring(3, id.length)
        if (index > 0) {
            imageryLayers.raise(viewModel.layers[index]);
            viewModel.upLayer = viewModel.layers[index];
            viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
            updateLayerList();
            window.setTimeout(function () {
                viewMod
                el.upLayer = viewModel.downLayer = null;
            }, 10);
        }
    }
    CKANRequest.prototype.lowerLayer = function (id) {
        //lower a layer 1 step
        var index = id.substring(3, id.length)
        //the basic imagery Layer of Cesium should always stay as the lowest layer ->-2
        if (index >= 0 && index < imageryLayers.length - 2) {
            imageryLayers.lower(viewModel.layers[index]);
            viewModel.downLayer = viewModel.layers[index];
            viewModel.upLayer = viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
            updateLayerList();
            window.setTimeout(function () {
                viewModel.upLayer = viewModel.downLayer = null;
            }, 10);
        }
    }


    return CKANRequest;
}());
