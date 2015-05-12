var map;

var MAPTYPE_ID = 'custom_style';

function initialize() {

  //Create a basic map with least features.
  var featureOpts = [{
    featureType: "all",
    elementType: "labels",
    stylers: [{
      visibility: "off"
    }]
  }, {
    featureType: 'landscapes',
    elementType: 'all',
    stylers: [{
      color: '#ffffff'
    }]
  }, {
    featureType: 'road',
    elementType: 'all',
    stylers: [{
      visibility: 'off'
    }]
  }, {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{
      visibility: 'off'
    }]
  }, {
    featureType: 'water',
    stylers: [{
      color: '#A2D9F9'
    }]
  }];


  //Map options
  var mapOptions = {
    backgroundColor: '#A2D9F9',
    center: new google.maps.LatLng(22.59372606392931, 5.625),
    disableDoubleClickZoom: true,
    zoom: 2,
    minZoom: 2,
    maxZoom: 10,
    mapTypeControl: false,
    keyboardShortcuts: false,
    scaleControl: true,
    panControl: false,
    streetViewControl: false,
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.SMALL,
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    mapTypeId: MAPTYPE_ID
  };



  map = new google.maps.Map(document.getElementById('jet-map'), mapOptions);

  var styledMapOptions = {
    name: 'Jet Airways Flight Routes'
  };

  var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

  map.mapTypes.set(MAPTYPE_ID, customMapType);

  google.maps.event.addListener(map, 'center_changed', function() {
    checkBounds(map);
  });

  var markers = [];

  var data = "Hello World!";
  var infowindow = new google.maps.InfoWindow({
    content: data
  });

  function createMapMarkers(airportObj) {
    var image = 'img/jetairways-etihad-logo.png';
    var airportLatLng = new google.maps.LatLng(airportObj.latitude, airportObj.longitude);
    var marker = new MarkerWithLabel({
      position: airportLatLng,
      map: map,
      icon: image,
      labelContent: airportObj.airport,
      labelAnchor: new google.maps.Point(-15, 20),
      labelClass: "airport-label"
    });

    google.maps.event.addListener(marker, 'mouseover', function() {
      infowindow.open(map, marker);
    });

    markers.push(marker);
  }

  //Prevent the map from going over the poles
  // If the map position is out of range, move it back
  function checkBounds(map) {

    var latNorth = map.getBounds().getNorthEast().lat();
    var latSouth = map.getBounds().getSouthWest().lat();
    var newLat = null;

    if ((latNorth < 85 && latSouth > -85) || (latNorth > 85 && latSouth < -85)) {
      return;
    } else {
      if (latNorth > 85) {
        newLat = map.getCenter().lat() - (latNorth - 85); /* too north, centering */
      }
      if (latSouth < -85) {
        newLat = map.getCenter().lat() - (latSouth + 85); /* too south, centering */
      }
    }

    if (newLat) {
      var newCenter = new google.maps.LatLng(newLat, map.getCenter().lng());
      map.setCenter(newCenter);
    }
  }

  d3.csv("data/airports.csv")
    .get(function(error, rows) {

      if (error) {
        console.log('error');
        return;
      }
      for (var i = 0; i < rows.length; i++) {
        createMapMarkers(rows[i]);
      };

      markerClusterer = new MarkerClusterer(map, markers, {
        maxZoom: 10,
        gridSize: 45
      });

    });
}

google.maps.event.addDomListener(window, 'load', initialize);