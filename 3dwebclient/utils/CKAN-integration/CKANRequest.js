var CKANRequest = /** @class */ (function () {
    var start; //for runtime measurements
    var time;
    var register; //always pointing to the curreent grouping register which is either mainGroupArray or orgGroupArray
    var mainGroupArray = [];
    var orgGroupArray = [];
    var setUp = false;
    var connDataArray = [];
    var connDataCount = 0;
    var wmsModel;
    var dataLayers = [];
    var viewModel;
    var imageryLayers;


    function CKANRequest() {

    }
    CKANRequest.prototype.startCKANExtension = function () {
        //Open the User interface to start a Request to a CKAN Server
        document.getElementById("CKAN_StartButton").innerHTML = '<span class="material-icons md-18" style="filter: none;">extension_off</span>';
        document.getElementById("CKAN_StartButton").onclick = function () { CKANRequest.prototype.closeCKANExtension() };
        document.getElementById("CKAN_UI").style.display = "block";

    }
    CKANRequest.prototype.closeCKANExtension = function () {
        //Close the User interface to start a Request to a CKAN Server
        document.getElementById("CKAN_StartButton").innerHTML = '<span class="material-icons md-18" style="filter: none;">extension</span>';
        document.getElementById("CKAN_StartButton").onclick = function () { CKANRequest.prototype.startCKANExtension() };
        document.getElementById("CKAN_UI").style.display = "none";

    }
    CKANRequest.prototype.setUp = async function () {
        //set up pre settings
        //reset registries
        start = performance.now();
        mainGroupArray = [];
        orgGroupArray = [];
        //make all entities invisible
        var entities = cesiumViewer.entities;
        //console.log(entities._entities._array.length);

        for (let index = 0; index < entities._entities._array.length; index++) {
            if (entities._entities._array[index].show = true) {
                entities._entities._array[index].show = false;
            }

        }


        document.getElementById("CKAN_Results").innerHTML = "<br><b> Loading data...</b></br>";
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

        CKANRequest.prototype.getDatasets();// Start the communication to the CKAN API

    }
    CKANRequest.prototype.getDatasets = async function () {
        // Communication to the CKAN API,  filling the ResultWindow with the Catalog Entries
        var cam = cesiumCamera;
        var camPos = cam.positionCartographic;

        //get all input information

        //get spatial filter
        var view = cam.computeViewRectangle(Cesium.Ellipsoid.WGS84);
        west = view.west * 180 / Cesium.Math.PI;
        east = view.east * 180 / Cesium.Math.PI;
        north = view.north * 180 / Cesium.Math.PI;
        south = view.south * 180 / Cesium.Math.PI;


        //get temporal filter
        var startdate = document.getElementById("startDate").value;
        var enddate = document.getElementById("endDate").value;

        //get search filter
        var searchTerm = document.getElementById("searchTerm").value;
        var searchedEntries;
        //console.log(startdate);
        if (searchTerm != "") {
            document.getElementById("CKAN_Results").innerHTML = "Applying search Filter";
            searchedEntries = await CKANRequest.prototype.searchCatalog();
        }

        //Build URL for Request using a spatial filter
        var url = document.getElementById('urlCKAN').value;
        var packageUrl = url + "/api\/action/package_search?ext_bbox=" + west + "%2C" + south + "%2C" + east + "%2C" + north + "&sort=title desc&rows=99999999999999999";

        var results = []; //all results fitting the spatial input parameters

        var groups;
        var organizations;
        mainGroupArray = [];
        document.getElementById("CKAN_Results").innerHTML += "<br>Querying Groups...</br>"; //Information for user
        groups = await CKANRequest.prototype.getMainGroups(url);//Main Groups of Catalog are queried
        document.getElementById("CKAN_Results").innerHTML += "<br>Querying Organizations...</br>";//Information for user
        organizations = await CKANRequest.prototype.getOrganizations(url);//organizations of catalog are queried
        //console.log(organizations);
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
        document.getElementById("CKAN_Results").innerHTML += "Found " + size + " catalog entries";
        // if no data is available
        if (size == 0) {
            document.getElementById("CKAN_Results").innerHTML = "<b> No data available</b>";
            document.getElementById("CKAN_Results").style.display = "block";
            document.getElementById("ResultWindow").style.display = "block";
            document.getElementById("CloseCKANButton").style.display = "block";
            document.getElementById("MinCKANButton").style.display = "block";
        }


        // get full representations of the datasets
        console.log(data.results);
        var unfilteredRes = data.results;//[]; //unfiltered Result
        /*
        for (var index = 0; index < data.results.length; index++) {
            document.getElementById("CKAN_Results").innerHTML = "Loaded " + index + " / " + data.results.length + " datasets";
            var tempUrl = url + "/api/action/package_show?id=" + data.results[index].id;
            var tempResponseData = data;
            //console.log(tempUrl);
            var result = fetch(tempUrl).then((resp) => resp.json()).then(function (data) {
                return data.result;
            }).catch(function (error) {
                console.log(error);
            });
            var res = await result;
            //console.log(responseData.result);
            unfilteredRes.push(res);
            

        }*/
        if (startdate != "" && enddate != "") {
            unfilteredRes = CKANRequest.prototype.filterTemporal(unfilteredRes, startdate, enddate);//control if date is inside the set input temporal parameters
        }
        if (searchTerm != "") {
            unfilteredRes = CKANRequest.prototype.filterSearchTerm(unfilteredRes, searchedEntries);//control if date is metching the set input search parameters
        }
        results = unfilteredRes;//results are now filtered
        //console.log(tempResponseData.result.results.length);
        console.log(results);

        //group results according to the MainGroups and organizations
        async function setGroups() {

            for (let i = 0; i < groups.length; i++) {
                var tempDatasetArrGr = [];

                //text = text + "<dt>" + groups[i] + "</dt>";
                for (let j = 0; j < results.length; j++) {
                    //console.log(results[j]);
                    for (let k = 0; k < results[j].groups.length; k++) {
                        if (results[j].groups[k].display_name === groups[i]) {
                            //text = text + "<dd>" + results[j].title + "</dd>";
                            tempDatasetArrGr.push(results[j]);
                        }

                    }

                }
                var tempGr = new MainGroup(groups[i], tempDatasetArrGr);
                mainGroupArray.push(tempGr);
            }
            for (let i = 0; i < organizations.length; i++) {
                var tempDatasetArrOrg = [];
                for (let j = 0; j < results.length; j++) {
                    if (results[j].organization.id === organizations[i].id) {
                        tempDatasetArrOrg.push(results[j]);
                    }
                }
                var tempOrg = new OrgGroup(organizations[i], tempDatasetArrOrg);
                orgGroupArray.push(tempOrg);
            }
            var addedDataArray = [];
            var addedGroup = new MainGroup("Extra Datasets", addedDataArray);//for additional Datasets that are loaded but are not matching the set filters
            mainGroupArray.push(addedGroup);
            var newOrga = Object;

            newOrga.display_name = "Extra Datasets";
            newOrga.description = "Datasets outside the spatial Filter relevant only via relation";
            newOrga.title = "extra datasets";
            newOrga.name = "extra datasets";
            newOrga.type = "organization";
            newOrga.id = "0000";

            var addedOrga = new OrgGroup(newOrga, addedDataArray);
            //text = text + "</dl>";
            //x.innerHTML = text;
            //x.style.display = "block";
            orgGroupArray.push(addedOrga);


        }
        document.getElementById("CKAN_Results").innerHTML = "Grouping...";
        await setGroups().then(console.log(mainGroupArray));
        console.log(orgGroupArray);
        CKANRequest.prototype.refreshResultWindow(); //Fill result window with results
        //visualize spatial filter
        CKANRequest.prototype.visualizeSpatialFilter(west, north, east, south);//generate an entity displaying the bounding box used for the spatial filter

    };
    CKANRequest.prototype.filterTemporal = function (array, startdate, enddate) {
        // go through array and filter out non matching entries
        var filteredArray = [];
        for (let index = 0; index < array.length; index++) {
            const res = array[index];
            if (CKANRequest.prototype.compareTime(startdate, enddate, res.begin_collection_date, res.end_collection_date)) {
                filteredArray.push(res);
            }
        }
        return filteredArray;
    }
    CKANRequest.prototype.filterSearchTerm = function (array, searchedEntries) {
        //go through unfiltered results and compare to searched entries
        var filteredArray = [];
        for (let index = 0; index < array.length; index++) {
            const res = array[index];
            var isPart = false;
            for (let j = 0; j < searchedEntries.length; j++) {
                if (searchedEntries[j].id == res.id) {
                    isPart = true;
                    break
                }

            }
            if (isPart) {
                filteredArray.push(res);
            }
        }
        return filteredArray;
    }
    CKANRequest.prototype.getOrganizations = async function (url) {
        //Use CKAN API to get Organizations of Catalog
        var orgas = [];
        var orgaListURL = url + "/api/action/organization_list";
        var orgaList = fetch(orgaListURL).then((resp) => resp.json()).then(function (data) {
            return data.result;
        }).catch(function (error) {
            console.log(error);
        });
        var result = await orgaList;
        for (let index = 0; index < result.length; index++) {

            var tempOrgaURL = url + "/api/action/organization_show?id=" + result[index];
            var orga = fetch(tempOrgaURL).then((resp) => resp.json()).then(function (data) {
                return data.result;
            }).catch(function (error) {
                console.log(error);
            });
            var organization = await orga;
            orgas.push(organization);

        }
        return orgas;
    }
    CKANRequest.prototype.getMainGroups = async function (url) {
        // Use CKAN API to get MainGroups of Catalog
        var groups = [];
        var mainGroups = [];


        //console.log(url);
        var groupListURL = url + "/api/action/group_list";
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
            var tempGroupURL = url + "/api/action/group_show?id=" + result[index];
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
    CKANRequest.prototype.addToMap = async function (id) {
        //start=performance.now();
        // Add spatial information as entities to the Cesium Map, or remove it 
        var entry = CKANRequest.prototype.getDataset(id);
        //console.log(dataset);
        var entities = cesiumViewer.entities;
        entities.show = true;

        if (document.getElementsByName(id)[0].innerHTML == '<span class="material-icons md-12">check_box_outline_blank</span>') {
            //split name to get information on which dataset should be added
            //var chars = name.split("/");

            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].spatial);
            document.getElementsByName(id)[0].innerHTML = '<span class="material-icons md-12">check_box</span>';
            if (document.getElementById("ConnectionInfo").style.display == "block" && document.getElementById("ConnectionTitle").innerHTML == entry.title) {
                var tableString = document.getElementById("connTable").innerHTML;
                var newTableString = tableString.replace("check_box_outline_blank", "check_box");
                document.getElementById("connTable").innerHTML = newTableString;
            }
            var groupstring = ""; // parse groupArray
            for (let index = 0; index < entry.groups.length; index++) {
                groupstring = groupstring + entry.groups[index].display_name + ", ";
            }
            var tagstring = ""; // parse tagArray
            for (let index = 0; index < entry.tags.length; index++) {
                tagstring = tagstring + entry.tags[index].display_name + ", ";
            }
            // Remove last comma
            tagstring = tagstring.substring(0, tagstring.length - 2);

            var resourcesString = '';
            for (let index = 0; index < entry.resources.length; index++) {
                resourcesString = resourcesString + "<tr><th>Resource " + (index + 1) + "</th><td>";
                if (entry.resources[index].restricted.search("public") == -1) {
                    resourcesString = resourcesString + "restricted non public resource: "
                }
                if (entry.resources[index].format == "WMS") {

                    resourcesString = resourcesString + "<button id='WMSButton' name='" + id + "/" + index + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addWMS(name)'>WMS</button>" +
                        "</td></tr>";
                }
                else if (entry.resources[index].format == "GeoJSON") {
                    resourcesString = resourcesString + "<button id='GeoJSONButton' name='" + entry.resources[index].url + ";" + entry.resources[index].name + ";" + entry.resources[index].description +
                        "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addGeoJSON(name)'>GeoJSON: " + entry.resources[index].name + "</button>"
                }
                else if (entry.resources[index].format == "KML") {
                    resourcesString = resourcesString + "<button id='KMLButton' name='" + id + "/" + index + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addKML(name)'>KML</button>" +
                        "</td></tr>";
                }
                else {
                    resourcesString = resourcesString + "<a href='" +
                        entry.resources[index].url + "' target='_blank'>" + entry.resources[index].url + "</a>" +
                        "</td></tr>";
                }
            }
            var relationshipObjectString = "";
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length);
            for (let index = 0; index < entry.relationships_as_object.length; index++) {
                var id = entry.relationships_as_object[index].__extras.subject_package_id;
                var inFilter = checkID(id);
                var url = document.getElementById('urlCKAN').value + "/api/action/package_show?id=" + id;
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
                    if (!inFilter) {
                        relationshipObjectString += "<tr><th>Connection: " + entry.relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + " (Not matching your set Filters!!!)</button></td></tr>";
                    }
                    else {
                        relationshipObjectString += "<tr><th>Connection: " + entry.relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + "</button></td></tr>";
                    }
                    connDataCount++;
                }
            }
            var relationshipSubjectString = "";
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length);
            for (let index = 0; index < entry.relationships_as_subject.length; index++) {
                var id = entry.relationships_as_subject[index].__extras.object_package_id;
                var inFilter = checkID(id);
                var url = document.getElementById('urlCKAN').value + "/api/action/package_show?id=" + id;
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
                    if (!inFilter) {
                        relationshipSubjectString += "<tr><th>Connection: " + entry.relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + " (Not matching your set Filters!!!)</button></td></tr>";
                    }
                    else {
                        relationshipSubjectString += "<tr><th>Connection: " + entry.relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + "</button></td></tr>";
                    }
                    connDataCount++;
                }
            }

            //Entity Description is displayed in the customInfobox if an entitiy is selected
            var entityDescription = '<table class="cesium-infoBox-defaultTable"><tbody>' +
                "<tr><th>Author</th><td>" +
                entry.author +
                "</td></tr>" +
                "<tr><th>Maintainer</th><td>" +
                entry.maintainer +
                "</td></tr>" +
                "<tr><th>Title</th><td>" +
                entry.title +
                "</td></tr>" +
                "<tr><th>Language</th><td>" +
                entry.language +
                "</td></tr>" +
                "<tr><th>ID</th><td>" +
                entry.id +
                "</td></tr>" +
                "<tr><th>Type</th><td>" +
                entry.type +
                "</td></tr>" +
                "<tr><th>State</th><td>" +
                entry.state +
                "</td></tr>" +
                "<tr><th>Is Open</th><td>" +
                entry.isopen +
                "</td></tr>" +
                "<tr><th>Organization</th><td>" +
                entry.organization.title +
                "</td></tr>" +
                "<tr><th>Groups</th><td>" +
                groupstring +
                "</td></tr>" +
                "<tr><th>URL</th><td>" +
                entry.url +
                "</td></tr>" +
                "<tr><th>Num Resources</th><td>" +
                entry.num_resources +
                "</td></tr>" +
                resourcesString +
                relationshipSubjectString +
                relationshipObjectString +
                "<tr><th>Created</th><td>" +
                entry.metadata_created +
                "</td></tr>" +
                "<tr><th>Last Modified</th><td>" +
                entry.metadata_modified +
                "</td></tr>" +
                "<tr><th>Begin Collection Date</th><td>" +
                entry.begin_collection_date +
                "</td></tr>" +
                "<tr><th>End Collection Date</th><td>" +
                entry.end_collection_date +
                "</td></tr>" +
                "<tr><th>Name</th><td>" +
                entry.name +
                "</td></tr>" +
                "<tr><th>Creator User ID</th><td>" +
                entry.creator_user_id +
                "</td></tr>" +
                "<tr><th>License ID / License Title</th><td>" +
                entry.license_id + " / " + entry.license_title +
                "</td></tr>" +
                "<tr><th>Revision ID</th><td>" +
                entry.revision_id +
                "</td></tr>" +
                "<tr><th>Tags</th><td>" +
                tagstring +
                "</td></tr>" +
                "<tr><th>Version</th><td>" +
                entry.version +
                "</td></tr>" +
                "<tr><th>Notes</th><td>" +
                entry.notes +
                "</td></tr>" +
                "</tbody></table>";


            //if entity is already created only make it visible
            if (cesiumViewer.entities.getById(entry.title) != undefined) {
                var entity = cesiumViewer.entities.getById(entry.title);
                entity.show = !entity.show;
                //cesiumViewer.flyTo(cesiumViewer.entities.getById(entry.title));
                return;
            }

            //parse spatial attribute
            CKANRequest.prototype.parseSpatial(entry, entityDescription);


        } else if (document.getElementsByName(id)[0].innerHTML == '<span class="material-icons md-12">check_box</span>') {
            // entity should be made invisible if button was an checked box
            //var chars = name.split("/");
            //console.log("Remove");
            //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].title);
            var entity = cesiumViewer.entities.getById(entry.title);
            entity.show = !entity.show;
            //cesiumViewer.flyTo(cesiumViewer.entities);
            //make button an unchecked box
            document.getElementsByName(id)[0].innerHTML = '<span class="material-icons md-12">check_box_outline_blank</span>';
            //if a connectiontable is open with the entity the checkbox in the table has to be altered
            if (document.getElementById("ConnectionInfo").style.display == "block" && document.getElementById("ConnectionTitle").innerHTML == entry.title) {
                var tableString = document.getElementById("connTable").innerHTML;
                var newTableString = tableString.replace("check_box", "check_box_outline_blank");
                document.getElementById("connTable").innerHTML = newTableString;
            }
        }

        //document.getElementsByName("R"+name)[0].style.display="block";
    };

    CKANRequest.prototype.openAdditionalInput = function () {

        //Temporal filters can be added to the CKAN Request
        if (document.getElementById("additionalInput").innerHTML == '<span class="material-icons md-18" style="filter: none;">filter_alt</span>' | document.getElementById("additionalInput").innerHTML == '<span class="material-icons md-18">filter_alt</span>') {
            document.getElementById("additionalInput").innerHTML = "<span class='material-icons md-18'>expand_less</span>";
            document.getElementById("additionalInputDiv").style.display = "block";
            //document.getElementById("searchCatalog").style.display = "block";
        } else if (document.getElementById("additionalInput").innerHTML == '<span class="material-icons md-18">expand_less</span>') {
            document.getElementById("additionalInput").innerHTML = "<span class='material-icons md-18'>filter_alt</span>";
            document.getElementById("additionalInputDiv").style.display = "none";
            //document.getElementById("searchCatalog").style.display = "none";
        }


    }
    CKANRequest.prototype.searchCatalog = async function () {
        //Search in Catalog using API function package_search
        var searchTerm = document.getElementById("searchTerm").value;
        packageUrl = document.getElementById('urlCKAN').value + "/api/action/package_search?q=" + searchTerm;
        var datasets = fetch(packageUrl).then((resp) => resp.json()).then(function (data) {
            return data.result;
        })
            .catch(function (error) {
                console.log(error);
            });
        var data = await datasets;
        return data.results;
        //console.log(data);

    }
    CKANRequest.prototype.zoomOnEntities = function () {
        //optimal zoom to view all visible entities
        cesiumViewer.flyTo(cesiumViewer.entities);
    }
    CKANRequest.prototype.compareTime = function (startdate, enddate, collectionStart, collectionEnd) {
        //return false if there is no temporal overlap, which is only happening if the inserted end date is before the collection startdate or the inserted start date is after the collection enddate
        if (collectionEnd == undefined || collectionEnd == "") {
            //if collectionEnd is not defined use today
            var today = new Date();
            collectionEnd = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate();
        }
        if (collectionStart == undefined || collectionStart == "") {
            //if collectionStart is not defined use startdate --> temporal overlap is only dependent on collection end
            collectionStart = startdate;
        }
        //parse date into array with year, month and day
        startArray = startdate.split("-");
        endArray = enddate.split("-");
        collectionStartArray = collectionStart.split("-");
        collectionEndArray = collectionEnd.split("-");

        //compare year
        if (parseInt(startArray[0]) > parseInt(collectionEndArray[0]) || parseInt(endArray[0]) < parseInt(collectionStartArray[0])) {
            //collection end before queried startdate or collection start after queried enddate
            return false;
        }

        if (parseInt(startArray[0]) == parseInt(collectionEndArray[0])) {
            //Same year
            if (parseInt(startArray[1]) > parseInt(collectionEndArray[1])) {
                //collection end month before queried start month
                return false;
            }
            if (parseInt(startArray[1]) == parseInt(collectionEndArray[1])) {
                //same month
                if (parseInt(startArray[2]) > parseInt(collectionEndArray[2])) {
                    // collection end day before queried startday
                    return false;
                }
            }
        }
        if (parseInt(endArray[0]) == parseInt(collectionStartArray[0])) {
            //same year
            if (parseInt(endArray[1]) < parseInt(collectionStartArray[1])) {
                //collection start month after queried end month
                return false;
            }
            if (parseInt(endArray[1]) == parseInt(collectionStartArray[1])) {
                //same month
                if (parseInt(endArray[2]) < parseInt(collectionStartArray[2])) {
                    //collection start day after queried end day
                    return false;
                }
            }
        }
        //overlap between both time periods
        return true;
    }
    checkID = function (id) { //checks if an ID is already partof the requested CatalogEntries
        for (let i = 0; i < mainGroupArray.length; i++) {
            for (let j = 0; j < mainGroupArray[i].datasetArray.length; j++) {
                var data = mainGroupArray[i].datasetArray[j];
                if (data.id == id) {
                    return true;
                }
            }
        }
        return false;
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

        var tagstring = ""; // parse tagArray
        for (let index = 0; index < connData.tags.length; index++) {
            tagstring = tagstring + connData.tags[index].display_name + ", ";
        }
        // Remove last comma
        tagstring = tagstring.substring(0, tagstring.length - 2);

        var resourcesString = ''; //parse connected Resources display them using links
        for (let index = 0; index < connData.resources.length; index++) {
            resourcesString = resourcesString + "<tr><th>Resource " + (index + 1) + "</th><td>";
            if (connData.resources[index].restricted.search("public") == -1) {
                resourcesString = resourcesString + "restricted non public resource: "
            }
            if (connData.resources[index].format == "WMS") {
                resourcesString = resourcesString + "<button id='WMSButton' name='" + connData.resources[index].id + "/" + index + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addWMS(name)'>WMS</button>" +
                    "</td></tr>";
            }
            else if (connData.resources[index].format == "GeoJSON") {
                resourcesString = resourcesString + "<button id='WMSButton' name='" + connData.resources[index].url + ";" + connData.resources[index].name + ";" + connData.resources[index].description + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addGeoJSON(name)'>GeoJSON: " + connData.resources[index].name + "</button>"
            }
            else if (connData.resources[index].format == "KML") {
                resourcesString = resourcesString + "<button id='KMLButton' name='" + connData.resources[index].id + "/" + index + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addKML(name)'>KML</button>" +
                    "</td></tr>";
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
            var inFilter = checkID(id);
            var url = document.getElementById('urlCKAN').value + "/api/action/package_show?id=" + id;
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
                if (!inFilter) {
                    relationshipObjectString += "<tr><th>Connection: " + connData.relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connDataNew.title + " (Not matching your set Filters!!!)</button></td></tr>";
                }
                else {
                    relationshipObjectString += "<tr><th>Connection: " + connData.relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connDataNew.title + "</button></td></tr>";
                }
                connDataCount++;
            }
        }

        //parse relations as subject, display them using buttons which lead to the connected datasets which open in a new window

        var relationshipSubjectString = "";
        for (let index = 0; index < connData.relationships_as_subject.length; index++) {
            var id = connData.relationships_as_subject[index].__extras.object_package_id;
            var inFilter = checkID(id);
            var url = document.getElementById('urlCKAN').value + "/api/action/package_show?id=" + id;
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
                if (!inFilter) {
                    relationshipSubjectString += "<tr><th>Connection: " + connData.relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connDataNew.title + " (Not fitting your set Filters!!!)</button></td></tr>";
                }
                else {
                    relationshipSubjectString += "<tr><th>Connection: " + connData.relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connDataNew.title + "</button></td></tr>";
                }
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
            for (let i = 0; i < register.length; i++) {
                for (let j = 0; j < register[i].datasetArray.length; j++) {
                    if (connData.id == register[i].datasetArray[j].id) {
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
                var name = connData.id;
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
                //orgGroupArray[orgGroupArray.length - 1].datasetArray.push(connData);
                var name = connData.id;
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
            "<tr><th>Begin Collection Date</th><td>" +
            connData.begin_collection_date +
            "</td></tr>" +
            "<tr><th>End Collection Date</th><td>" +
            connData.end_collection_date +
            "</td></tr>" +
            "<tr><th>Name</th><td>" +
            connData.name +
            "</td></tr>" +
            "<tr><th>Creator User ID</th><td>" +
            connData.creator_user_id +
            "</td></tr>" +
            "<tr><th>License ID / License Title</th><td>" +
            connData.license_id + " / " + connData.license_title +
            "</td></tr>" +
            "<tr><th>Revision ID</th><td>" +
            connData.revision_id +
            "</td></tr>" +
            "<tr><th>Tags</th><td>" +
            tagstring +
            "</td></tr>" +
            "<tr><th>Version</th><td>" +
            connData.version +
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

    CKANRequest.prototype.addGeoJSON = async function (resource) {
        //solution for GeoJSON format
        var data = resource.split(";"); //resource format: url;name;description
        var url = data[0];
        var name = data[1];
        var description = data[2];
        if (cesiumViewer.entities.getById(name) != undefined) {
            cesiumViewer.entities.getById(name).show = true;
            return;
        }

        /*
        var options = {
            url: url.trim(),
            name: name.trim(),
            layerDataType: 'GeoJSON',
            layerClampToGround: true,
        }
        var _layers = new Array();
        _layers.push(new CitydbKmlLayer(options));
        loadLayerGroup(_layers);
        */
        var dataset = fetch(url).then((resp) => resp.json()).then(function (data) {
            return data;
        }).catch(function (error) {
            console.log(error);
        });
        description += "<button id='RemoveGeoJSON' name='" + name + "' class='cesium-button' onclick='CKANRequest.prototype.removeGeoJSON(name)'>Remove From Map</button>"
        var geojson = await dataset;

        //console.log(geojson);
        //const obj = JSON.parse(geojson);
        var dataSource = Cesium.GeoJsonDataSource.load(geojson, { fill: Cesium.Color.YELLOW.withAlpha(0.5), });
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


        //cesiumViewer.flyTo(cesiumViewer.entities.getById(name));

    }
    CKANRequest.prototype.removeGeoJSON = function (name) {
        var entity = cesiumViewer.entities.getById(name);
        entity.show = false;

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
        }/*
        time = performance.now();
        console.log("Time: " + (time - start) + " ms.")*/
        //cesiumViewer.flyTo(cesiumViewer.entities.getById(dataset.title));
    }
    CKANRequest.prototype.refreshResultWindow = function () {
        //refresh the result window to show current result set grouped with information on if the entry is visiualized
        var selector = document.getElementById("GroupBySelector").value;
        //console.log(selector);
        if (selector == "MainGroup") {
            register = mainGroupArray;
            CKANRequest.prototype.refreshResultWindowMainGroup();
        }
        else if (selector == "Organization") {
            CKANRequest.prototype.refreshResultWindowOrganization();
            register = orgGroupArray;
        }
        time = performance.now();
        console.log("Time: " + (time - start) + " ms.")

    }
    CKANRequest.prototype.refreshResultWindowOrganization = function () {
        var x = document.getElementById("CKAN_Results");
        var text = "";

        // fill the result window
        for (let i = 0; i < orgGroupArray.length; i++) {
            if (orgGroupArray[i].datasetArray.length > 0) {
                if (orgGroupArray[i].expanded) {
                    text = text + "<p><b>" + orgGroupArray[i].organization.display_name + "</b>  <button id='CollapseButton' name='" + orgGroupArray[i].organization.display_name + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.collapseOrg(name)'>-</button></p>";

                    for (let j = 0; j < orgGroupArray[i].datasetArray.length; j++) {
                        var title = orgGroupArray[i].datasetArray[j].title;
                        if (title.length > 45) {
                            title = title.substring(0, 43);
                            title = title + "...";
                            console.log(title);
                        }
                        if (cesiumViewer.entities.getById(orgGroupArray[i].datasetArray[j].title) != undefined && cesiumViewer.entities.getById(orgGroupArray[i].datasetArray[j].title).show == true) {
                            text = text + "<p>" + "<button id='AddButton' name='" + orgGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-12'>check_box</span></button>&emsp;<button class='link' id='title' name='" + orgGroupArray[i].datasetArray[j].id + "' onClick='CKANRequest.prototype.zoomOnEntry(name)' title='" + orgGroupArray[i].datasetArray[j].title + "'>" + title + "</button><button id='InfoButton' name='" + orgGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.showInfo(name)'><span class='material-icons md-18'>info</span></button></p>";
                        } else {
                            text = text + "<p>" + "<button id='AddButton' name='" + orgGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-12'>check_box_outline_blank</span></button>&emsp;<button class='link' id='title' name='" + orgGroupArray[i].datasetArray[j].id + "' onClick='CKANRequest.prototype.zoomOnEntry(name)' title='" + orgGroupArray[i].datasetArray[j].title + "'>" + title + "</button><button id='InfoButton' name='" + orgGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.showInfo(name)'><span class='material-icons md-18'>info</span></button></p>";
                        }
                    }
                } else {
                    text = text + "<p><b>" + orgGroupArray[i].organization.display_name + "</b>  <button id='CollapseButton' name='" + orgGroupArray[i].organization.display_name + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.expandOrg(name)'>+</button></p>";
                }
                //text=text+"<br>";
            }

        }
        x.innerHTML = text;
        x.style.display = "block";
        document.getElementById("ResultWindow").style.display = "block";
        document.getElementById("CloseCKANButton").style.display = "block";
        document.getElementById("MinCKANButton").style.display = "block";
        document.getElementById("OpenGroupByWindow").style.display = "block";
    }
    CKANRequest.prototype.refreshResultWindowMainGroup = function () {
        var x = document.getElementById("CKAN_Results");
        var text = "";

        // fill the result window
        for (let i = 0; i < mainGroupArray.length; i++) {
            if (mainGroupArray[i].datasetArray.length > 0) {
                if (mainGroupArray[i].expanded) {
                    text = text + "<p><b>" + mainGroupArray[i].name + "</b>  <button id='CollapseButton' name='" + mainGroupArray[i].name + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.collapseGroup(name)'>-</button></p>";
                    for (let j = 0; j < mainGroupArray[i].datasetArray.length; j++) {
                        var title = mainGroupArray[i].datasetArray[j].title;
                        if (title.length > 45) {
                            title = title.substring(0, 43);
                            title = title + "...";
                            console.log(title);
                        }
                        if (cesiumViewer.entities.getById(mainGroupArray[i].datasetArray[j].title) != undefined && cesiumViewer.entities.getById(mainGroupArray[i].datasetArray[j].title).show == true) {
                            text = text + "<p>" + "<button id='AddButton' name='" + mainGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-12'>check_box</span></button>&emsp;<button class='link' id='title' name='" + mainGroupArray[i].datasetArray[j].id + "' onClick='CKANRequest.prototype.zoomOnEntry(name)' title='" + mainGroupArray[i].datasetArray[j].title + "'>" + title + "</button><button id='InfoButton' name='" + mainGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.showInfo(name)'><span class='material-icons md-16'>info</span></button></p>";
                        } else {
                            text = text + "<p>" + "<button id='AddButton' name='" + mainGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.addToMap(name)'><span class='material-icons md-12'>check_box_outline_blank</span></button>&emsp;<button class='link' id='title' name='" + mainGroupArray[i].datasetArray[j].id + "' onClick='CKANRequest.prototype.zoomOnEntry(name)' title='" + mainGroupArray[i].datasetArray[j].title + "'>" + title + "</button><button id='InfoButton' name='" + mainGroupArray[i].datasetArray[j].id + "' type='button'  class='cesium-button' onclick='CKANRequest.prototype.showInfo(name)'><span class='material-icons md-16'>info</span></button></p>";
                        }
                    }
                } else {
                    text = text + "<p><b>" + mainGroupArray[i].name + "</b>  <button id='CollapseButton' name='" + mainGroupArray[i].name + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.expandGroup(name)'>+</button></p>";
                }

                //text=text+"<br>";
            }

        }
        x.innerHTML = text;
        x.style.display = "block";
        document.getElementById("ResultWindow").style.display = "block";
        document.getElementById("CloseCKANButton").style.display = "block";
        document.getElementById("MinCKANButton").style.display = "block";
        document.getElementById("OpenGroupByWindow").style.display = "block";
    }
    CKANRequest.prototype.collapseGroup = function (name) {
        for (let index = 0; index < mainGroupArray.length; index++) {
            if (mainGroupArray[index].name == name) {
                mainGroupArray[index].setExpanded(false);
            }
        }
        CKANRequest.prototype.refreshResultWindow();
    }
    CKANRequest.prototype.expandGroup = function (name) {
        for (let index = 0; index < mainGroupArray.length; index++) {
            if (mainGroupArray[index].name == name) {
                mainGroupArray[index].setExpanded(true);
            }
        }
        CKANRequest.prototype.refreshResultWindow();
    }
    CKANRequest.prototype.collapseOrg = function (name) {
        for (let index = 0; index < orgGroupArray.length; index++) {
            if (orgGroupArray[index].organization.display_name == name) {
                orgGroupArray[index].setExpanded(false);
            }
        }
        CKANRequest.prototype.refreshResultWindow();
    }
    CKANRequest.prototype.expandOrg = function (name) {
        for (let index = 0; index < orgGroupArray.length; index++) {
            if (orgGroupArray[index].organization.display_name == name) {
                orgGroupArray[index].setExpanded(true);
            }
        }
        CKANRequest.prototype.refreshResultWindow();
    }

    CKANRequest.prototype.addKML = async function (name) {
        //add KML layer using Citydb functions
        var data = name.split("/");
        var entry = this.getDataset(data[0]);
        var resource = entry.resources[data[1]];
        var url = resource.url
        var options = {
            url: url.trim(),
            name: resource.name.trim(),
            layerDataType: 'kml',
            layerClampToGround: true,
        }
        var _layers = new Array();
        _layers.push(new CitydbKmlLayer(options));
        loadLayerGroup(_layers);
    }
    CKANRequest.prototype.addWMS = async function (name) {
        //build layer selector window by calling getCapabilities operation
        var data = name.split("/");
        var entry = this.getDataset(data[0]);
        var url = entry.resources[data[1]].url;
        var dataset = fetch(url + "Service=WMS&Request=GetCapabilities").then((resp) => resp.text()).then(str => new window.DOMParser().parseFromString(str, "application/xml"))
            .then(function (data) { return data; });
        wmsModel = {
            name: '',
            iconUrl: '',
            tooltip: '',
            url: '',
            layers: '',
            additionalParameters: '',
            proxyUrl: '/proxy/',
            legendURL: ''
        };

        wmsModel.url = url;
        wmsModel.iconUrl = "https://banner2.cleanpng.com/20180409/udq/kisspng-computer-icons-web-map-service-layer-5acb54ec0f8346.8689149915232749880636.jpg";

        //wmsModel.name = mainGroupArray[data[0]].datasetArray[data[1]].title
        wmsModel.tooltip = entry.title + " - WMS";

        var wmsData = await dataset;

        //wmsModel.legendURL=
        var layers = wmsData.getElementsByTagName("Layer");
        var legends = wmsData.getElementsByTagName("LegendURL");
        var legendURL = [];
        for (let index = 0; index < legends.length; index++) {
            var hrefInd = legends[index].innerHTML.search("href");
            var href = legends[index].innerHTML.substring(hrefInd, legends[index].innerHTML.length)
            console.log(href)
            //legendURL[index]=;

        }
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
        //console.log(legendURL);
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
                if (layerTitle.startsWith("<![CDATA")) {
                    layerTitle = layerTitle.substring(9, layerTitle.length - 3);
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
        //start=performance.now()
        var selLayer = document.getElementById("layerSelector");
        var layer = selLayer.options[selLayer.selectedIndex].value;
        wmsModel.layers = layer;
        wmsModel.name = selLayer.options[selLayer.selectedIndex].innerHTML;
        CKANRequest.prototype.addWebMapServiceProvider(wmsModel);
        document.getElementById("LayerWindow").style.display = "none";

        //time = performance.now();
        console.log("Time: " + (time - start) + " ms.")

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
                viewModel.layers[index].name + "</span></td><td><input id='opacityRange' name='" + index + "' title='Opacity' type='range' min='0' max='1' step='0.01' onchange='CKANRequest.prototype.changeAlpha(name, value)' value='" +
                viewModel.layers[index].alpha + "'></td><td><button type='button' id='lay" + index + "' class='cesium-button' onclick='CKANRequest.prototype.raiseLayer(id)'>▲</button></td>" +
                "<td><button type='button' id='lay" + index + "'class='cesium-button' onclick='CKANRequest.prototype.lowerLayer(id)'>▼</button></td></tr>";

        }
        document.getElementById("LoadedLayersWindow").style.display = "block";

    }
    CKANRequest.prototype.checkVisible = function (id) {
        //when a checkbox is clicked the corresponding imagerylayer has to be shown or not shown
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
    CKANRequest.prototype.changeAlpha = function (index, value) { //change the opacity of a layer
        viewModel.layers[index].alpha = value;
    }
    CKANRequest.prototype.closeLoadedLayersWindow = function () {
        document.getElementById("LoadedLayersWindow").style.display = "none";
        document.getElementById("WMSOpener").style.display = "block";

    }
    CKANRequest.prototype.openLoadedLayersWindow = function () {
        document.getElementById("LoadedLayersWindow").style.display = "block";
        document.getElementById("WMSOpener").style.display = "none";
    }
    CKANRequest.prototype.openGroupBy = function () {
        if (document.getElementById("GroupByWindow").style.display == "block") {
            document.getElementById("GroupByWindow").style.display = "none";
        }
        else {
            document.getElementById("GroupByWindow").style.display = "block";
        }
    }
    CKANRequest.prototype.getDataset = function (id) {//get a dataset of the resultset using its id by calling the getDataset function of the registerr group classes
        for (let index = 0; index < register.length; index++) {
            const element = register[index];
            var dataset = element.getDataset(id);
            if (dataset != -1) {
                return dataset;
            }

        }
        return -1;
    }
    CKANRequest.prototype.visualizeSpatialFilter = function (west, north, east, south) {

        const dataPointNW = { longitude: west, latitude: north, height: 0 };
        const dataPointNE = { longitude: east, latitude: north, height: 0 };
        const dataPointSW = { longitude: west, latitude: south, height: 0 };
        const dataPointSE = { longitude: east, latitude: south, height: 0 };

        const spatialFilter = cesiumViewer.entities.add({
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
                width: 3,
                id: 'spatialFilter',
                material: Cesium.Color.BLUE,
                clampToGround: true,
            },
        });


    }
    CKANRequest.prototype.showInfo = async function (id) {// open a window displaying the metadata
        var entry = CKANRequest.prototype.getDataset(id);

        var groupstring = ""; // parse groupArray
        for (let index = 0; index < entry.groups.length; index++) {
            groupstring = groupstring + entry.groups[index].display_name + ", ";
        }
        // Remove last comma
        groupstring = groupstring.substring(0, groupstring.length - 2);
        var tagstring = ""; // parse tagArray
        for (let index = 0; index < entry.tags.length; index++) {
            tagstring = tagstring + entry.tags[index].display_name + ", ";
        }
        // Remove last comma
        tagstring = tagstring.substring(0, tagstring.length - 2);

        var resourcesString = '';
        for (let index = 0; index < entry.resources.length; index++) {
            resourcesString = resourcesString + "<tr><th>Resource " + (index + 1) + "</th><td>";
            if (entry.resources[index].restricted.search("public") == -1) {
                resourcesString = resourcesString + "restricted non public resource: "
            }
            if (entry.resources[index].format == "WMS") {

                resourcesString = resourcesString + "<button id='WMSButton' name='" + id + "/" + index + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addWMS(name)'>WMS</button>" +
                    "</td></tr>";
            }
            else if (entry.resources[index].format == "GeoJSON") {
                resourcesString = resourcesString + "<button id='GeoJSONButton' name='" + entry.resources[index].url + ";" + entry.resources[index].name + ";" + entry.resources[index].description +
                    "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addGeoJSON(name)'>GeoJSON: " + entry.resources[index].name + "</button>"
            }
            else if (entry.resources[index].format == "KML") {
                resourcesString = resourcesString + "<button id='KMLButton' name='" + id + "/" + index + "' type='button' class='cesium-button' onclick='CKANRequest.prototype.addKML(name)'>KML</button>" +
                    "</td></tr>";
            }
            else {
                resourcesString = resourcesString + "<a href='" +
                    entry.resources[index].url + "' target='_blank'>" + entry.resources[index].url + "</a>" +
                    "</td></tr>";
            }
        }
        var relationshipObjectString = "";
        //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length);
        for (let index = 0; index < entry.relationships_as_object.length; index++) {
            var id = entry.relationships_as_object[index].__extras.subject_package_id;
            var inFilter = checkID(id);
            var url = document.getElementById('urlCKAN').value + "/api/action/package_show?id=" + id;
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
                if (!inFilter) {
                    relationshipObjectString += "<tr><th>Connection: " + entry.relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + " (Not matching your set Filters!!!)</button></td></tr>";
                }
                else {
                    relationshipObjectString += "<tr><th>Connection: " + entry.relationships_as_object[index].type + " as object</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + "</button></td></tr>";
                }
                connDataCount++;
            }

        }
        var relationshipSubjectString = "";
        //console.log(mainGroupArray[chars[0]].datasetArray[chars[1]].relationships_as_object.length);
        for (let index = 0; index < entry.relationships_as_subject.length; index++) {
            var id = entry.relationships_as_subject[index].__extras.object_package_id;
            var inFilter = checkID(id);
            var url = document.getElementById('urlCKAN').value + "/api/action/package_show?id=" + id;
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
                if (!inFilter) {
                    relationshipSubjectString += "<tr><th>Connection: " + entry.relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + " (Not matching your set Filters!!!)</button></td></tr>";
                }
                else {
                    relationshipSubjectString += "<tr><th>Connection: " + entry.relationships_as_subject[index].type + " as subject</th><td><button type='button' name='" + connDataCount + "' class='cesium-button' onclick='CKANRequest.prototype.showConnection(name)'>" + connData.title + "</button></td></tr>";
                }
                connDataCount++;
            }
        }

        //Entity Description is displayed in the customInfobox if an entitiy is selected
        var entityDescription = '<table class="cesium-infoBox-defaultTable"><tbody>' +
            "<tr><th>Author</th><td>" +
            entry.author +
            "</td></tr>" +
            "<tr><th>Maintainer</th><td>" +
            entry.maintainer +
            "</td></tr>" +
            "<tr><th>Title</th><td>" +
            entry.title +
            "</td></tr>" +
            "<tr><th>Language</th><td>" +
            entry.language +
            "</td></tr>" +
            "<tr><th>ID</th><td>" +
            entry.id +
            "</td></tr>" +
            "<tr><th>Type</th><td>" +
            entry.type +
            "</td></tr>" +
            "<tr><th>State</th><td>" +
            entry.state +
            "</td></tr>" +
            "<tr><th>Is Open</th><td>" +
            entry.isopen +
            "</td></tr>" +
            "<tr><th>Organization</th><td>" +
            entry.organization.title +
            "</td></tr>" +
            "<tr><th>Groups</th><td>" +
            groupstring +
            "</td></tr>" +
            "<tr><th>URL</th><td>" +
            entry.url +
            "</td></tr>" +
            "<tr><th>Num Resources</th><td>" +
            entry.num_resources +
            "</td></tr>" +
            resourcesString +
            relationshipSubjectString +
            relationshipObjectString +
            "<tr><th>Created</th><td>" +
            entry.metadata_created +
            "</td></tr>" +
            "<tr><th>Last Modified</th><td>" +
            entry.metadata_modified +
            "</td></tr>" +
            "<tr><th>Begin Collection Date</th><td>" +
            entry.begin_collection_date +
            "</td></tr>" +
            "<tr><th>End Collection Date</th><td>" +
            entry.end_collection_date +
            "</td></tr>" +
            "<tr><th>Name</th><td>" +
            entry.name +
            "</td></tr>" +
            "<tr><th>Creator User ID</th><td>" +
            entry.creator_user_id +
            "</td></tr>" +
            "<tr><th>License ID / License Title</th><td>" +
            entry.license_id + " / " + entry.license_title +
            "</td></tr>" +
            "<tr><th>Revision ID</th><td>" +
            entry.revision_id +
            "</td></tr>" +
            "<tr><th>Tags</th><td>" +
            tagstring +
            "</td></tr>" +
            "<tr><th>Version</th><td>" +
            entry.version +
            "</td></tr>" +
            "<tr><th>Notes</th><td>" +
            entry.notes +
            "</td></tr>" +
            "</tbody></table>";

        var title = entry.title;
        if (title.length > 45) {
            title = title.substring(0, 43);
            title = title + "...";
            //console.log(title);
        }
        document.getElementById("dataTable").innerHTML = entityDescription;
        document.getElementById("MetadataTitle").innerHTML = title;
        document.getElementById("MetadataTable").style.display = "block";
    }
    CKANRequest.prototype.closeMetadataWindow = function () {
        document.getElementById("MetadataTable").style.display = "none";
    }
    CKANRequest.prototype.zoomOnEntry = function (id) {//zoom on a specific entry
        var entry = CKANRequest.prototype.getDataset(id);
        if (cesiumViewer.entities.getById(entry.title) != undefined && cesiumViewer.entities.getById(entry.title).show == true) {
            cesiumViewer.flyTo(cesiumViewer.entities.getById(entry.title));
        }
        if (cesiumViewer.entities.getById(entry.title)._children.length >= 2) {
            cesiumViewer.flyTo(cesiumViewer.entities.getById(entry.title)._children[0]);
        }
        console.log(cesiumViewer.entities.getById(entry.title));

    }
    return CKANRequest;
}());
