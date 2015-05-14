window.JETMAP = {};

var MAPTYPE_ID = 'custom_style';

function initialize() {

  //Defaults
  JETMAP = {
    mapId: 'jet_style',
    map: null,
    mapOptions: {},
    airports: [],
    routes: [],
    featureOpts: [],
    styledMapOptions: {
      name: 'Jet Airways Flight Routes'
    },
    markers: [],
    markerCluster: [],
    routeLines: []
  }

  //Create a basic map with least features.
  JETMAP.featureOpts = [{
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
  JETMAP.mapOptions = {
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
    mapTypeId: JETMAP.mapId
  };

  // Create the map
  JETMAP.map = new google.maps.Map(document.getElementById('jet-map'), JETMAP.mapOptions);

  // Styled layer map
  JETMAP.styledMapOptions = {
    name: 'Jet Airways Flight Routes'
  };

  JETMAP.customMapType = new google.maps.StyledMapType(JETMAP.featureOpts, JETMAP.styledMapOptions);

  JETMAP.map.mapTypes.set(JETMAP.mapId, JETMAP.customMapType);

  //Prevent the map from going over the poles
  // If the map position is out of range, move it back
  var checkBounds = function(map) {

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
  };

  google.maps.event.addListener(JETMAP.map, 'center_changed', function() {
    checkBounds(JETMAP.map);
  });

  //Create info window object
  /* var infowindow = new google.maps.InfoWindow({
    content: 'Hello World!'
  });*/

  //create airport points on the map
  function createMapMarkers(airportObj) {
    var image = 'img/point.png';
    var airportLatLng = new google.maps.LatLng(airportObj.latitude, airportObj.longitude);
    var marker = new MarkerWithLabel({
      position: airportLatLng,
      map: JETMAP.map,
      icon: image,
      labelContent: airportObj.airport,
      labelAnchor: new google.maps.Point(-10, 10),
      labelClass: "airport-label",
      airportData: airportObj
    });

    google.maps.event.addListener(marker, 'click', function() {
      sanitizeAirportsAndRoutes(this.airportData);
    });

    //Cluster markers array
    JETMAP.markers.push(marker);
  }

  var getAirportByName = function(iataName) {
    for (var i = 0, l = JETMAP.airports.length; i < l; i++) {
      if (JETMAP.airports[i].iata === iataName) {
        return JETMAP.airports[i];
      }
    };
    return false;
  };

  var plotRouteData = function(airportRoutes) {
    var cI, nI, origin, destination;

    for (var i = 0; i < Polylines.length; i++) {
      Polylines[i].setMap(null);
    };

    for (var i = 0, lr = airportRoutes.length; i < lr; i++) {
      for (var j = 0, ld = airportRoutes[i].plotData.length; j < ld; j++) {
        cI = j;
        nI = cI++;
        origin = airportRoutes[i].plotData[cI];
        destination = airportRoutes[i].plotData[nI];

        //Plot if destination exists
        if (origin && destination) {
          curved_line_generate({
            latStart: parseFloat(origin.latitude),
            lngStart: parseFloat(origin.longitude),
            latEnd: parseFloat(destination.latitude),
            lngEnd: parseFloat(destination.longitude),
            Map: JETMAP.map,
            strokeWeight: 1,
            strokeColor: '#fa9d1c'
          });
        }
      }
    }
  };

  //Sanitize airports and routes
  //Check if hops are there and create new route
  var sanitizeAirportsAndRoutes = function(airportObj) {
    var airportRoutes = [];
    //Cached for loop for faster trevarsal
    for (var i = 0, l = JETMAP.routes.length; i < l; i++) {
      if (airportObj.iata === JETMAP.routes[i].origin) {
        airportRoutes.push(JETMAP.routes[i]);
      }
    };

    //Now we have airportRoutes check for hops
    for (var j = 0, lr = airportRoutes.length; j < lr; j++) {
      airportRoutes[j].plotData = [];
      airportRoutes[j].plotData.push(getAirportByName(airportRoutes[j].origin));

      if (airportRoutes[j].hasOwnProperty('hops') && airportRoutes[j].hops.length) {
        for (var k = 0, lk = airportRoutes[j].hops.length; k < lk; k++) {
          airportRoutes[j].plotData.push(getAirportByName(airportRoutes[j].hops[k]));
        };
      }

      airportRoutes[j].plotData.push(getAirportByName(airportRoutes[j].destination));
    }

    plotRouteData(airportRoutes);
  };


  //Get the data from the CSV
  d3.csv("data/airports.csv")
    .get(function(error, airports) {

      if (error) {
        console.log('error');
        return;
      }

      JETMAP.airports = airports;

      //Get the all the routes
      d3.json('data/routes.json', function(error, routes) {
        if (error) {
          console.log('error');
          return;
        }
        JETMAP.routes = routes;

        for (var i = 0; i < JETMAP.airports.length; i++) {
          createMapMarkers(JETMAP.airports[i]);
        };

        //Google map util to cluster
        JETMAP.markerCluster = new MarkerClusterer(JETMAP.map, JETMAP.markers, {
          maxZoom: 10,
          gridSize: 45
        });

      });
    });


}

google.maps.event.addDomListener(window, 'load', initialize);