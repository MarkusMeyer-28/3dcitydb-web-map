3DCityDB-Web-Map-Client extension: CKAN Integration
==================================

Description
-------
This is an extension of the 3DCityDB Web Map Client which enables data retrieval from CKAN Catalogs. The Catalog has to have a certain structure. The extension was tested using the two catalogs available under: [catalog.gis.lrg.tum.de](https://catalog.gis.lrg.tum.de/) and [agrihub.hef.tum.de](https://agrihub.hef.tum.de/). 
The extension is started using the button in the upper right next to the search button. Then the filter window opens where the URL of the CKAN catalog can be entered aswell as additional filter parameter. The spatial filter is mandatory and is set using the visible area in the camera. Using the set filters matching catalog entries are retrieved from the catalog and displayed in a grouped list. From this list it is possible to visualize entries in the map, zoom on entries and inspect metadata. Relations between catalog entries are realized using buttons in the metadata tables. Connected resources have format dependent implementations.

Features
-------
Filtering
 * Spatial Filter using visible region in camera.
 * Optional Temporal Filter
 * Optional Search Term Filter
 * Changeable Catalog URL

Result Presentation in Result Window
 * Grouping using Main Groups or Organizations possible
 * Collapsing and Expanding of Groups
 * Button to visualiize Catalog Entry in Map
 * Button to show Metadata
 * Zoom on Visualization by Clicking on Entry Title in Result Window

Visualization
 * Spatial Attribute parsed to GeoJSON Object -> entity in map
 * Description of Entity filled with Entry's Metadata
 * Buttons for Related Entries
 * Buttons for WMS, GeoJSON, KML Formats
 * URLs as clickable Links for other Formats

Resources
 * Special solutions for WMS, KML and GeoJSON Format
 * Different functionalities fitting the respective format's capabilities

Open Unimplemented Features / Unsolved Problems
-------

* Single Managing Window for added WMS, KML and GeoJSON layer
* Legend display of WMS layer
* More thematic Filtering Options
* Solve overlay problem of Result Window and 3DCityDB Toolbox
