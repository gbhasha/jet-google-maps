(function(window) {

  window.JetGoogleMaps = function(options) {
    var _defaults = {
      wrapperId: 'jet-map',
      routeStrokeWidth: 1,
      routeStrokeColor: '#FA9D1C',
      routeStrokeOpacity: 1,
      routeStrokeGap: 0,
      routeStrokeMultiplier: 1,
      routeStrokeResolution: 0.1,
      routeStrokeHorizontal: true,
      markerLabelClass: 'marker-label',
      centerLatitude: 22.59372606392931,
      centerLongitude: 5.625,
      mapWaterColor: '#A2D9F9',
      mapLandColor: '#FFFFFF',
      mapId: 'jet_google_maps',
      mapDefaultZoom: 2,
      mapMinZoom: 2,
      mapMaxZoom: 10,
      mapFeatureName: 'Jet Airways Flight Routes',
      mapMarkerImage: 'img/point.png',
      airportsUrl: 'data/airports.csv',
      routesUrl: 'data/routes.json'
    };

    var _options, _mapOptions = {};

    var self = this;
    self.settings = {};
    self.evenOdd = 0;
    self.currentAirportRoutes = [];
    self.currentAirportRoutesPaths = [];
    self.allAirports = [];
    self.allRoutes = [];
    self.plottedAirports = [];

    self.getMapOptions = function() {
      return _mapOptions;
    };

    self.setMapOtions = function() {

      _options = options || {};

      $.extend(self.settings, _defaults, _options);

      _mapOptions = {
        backgroundColor: self.settings.mapWaterColor,
        center: new google.maps.LatLng(self.settings.centerLatitude, self.settings.centerLongitude),
        disableDoubleClickZoom: true,
        zoom: self.settings.mapDefaultZoom,
        minZoom: self.settings.mapMinZoom,
        maxZoom: self.settings.mapMaxZoom,
        mapTypeControl: false,
        keyboardShortcuts: false,
        scaleControl: false,
        panControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL,
          position: google.maps.ControlPosition.LEFT_BOTTOM
        },
        mapTypeId: self.settings.mapId
      };

      self.settings.mapFeatures = [{
        featureType: 'all',
        elementType: 'labels',
        stylers: [{
          visibility: 'off'
        }]
      }, {
        featureType: 'landscapes',
        elementType: 'all',
        stylers: [{
          color: self.settings.mapLandColor
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
          color: self.settings.mapWaterColor
        }]
      }];
    };

    var _init = function() {

      if (!window.jQuery || !window.google || !window.MarkerWithLabel || !window.MarkerClusterer) {
        console.error('Please load all the necessary files', ['jquery.js', 'maps/api', 'markerwithlabel_packed.js', 'markerclusterer_packed.js'])
        return;
      }

      self.setMapOtions();
      self.createMap();
      self.fetchAirportData();
    };

    return _init();
  }

  /**
   * Thanks to Daniel Nanovski
   * and Coen de Jong
   * from the curved.line.js Plugin
   */

  JetGoogleMaps.prototype.generateCurvedLineSegment = function(latStart, lngStart, latEnd, lngEnd) {
    var self = this;
    self.evenOdd++;

    if (self.evenOdd % (self.settings.routeStrokeGap + 1)) {
      return;
    }

    var lineCordinates = [];
    lineCordinates.push(new google.maps.LatLng(latStart, lngStart));
    lineCordinates.push(new google.maps.LatLng(latEnd, lngEnd));

    var line = new google.maps.Polyline({
      path: lineCordinates,
      geodesic: false,
      strokeColor: self.settings.routeStrokeColor,
      strokeOpacity: self.settings.routeStrokeOpacity,
      strokeWeight: self.settings.routeStrokeWidth
    });

    line.setMap(self.map);
    self.currentAirportRoutesPaths.push(line);
  };

  JetGoogleMaps.prototype.generateCurvedLine = function(options) {
    var self = this;

    var cordinates = {
        latStart: null,
        lngStart: null,
        latEnd: null,
        lngEnd: null
      },
      multiplier = self.settings.routeStrokeMultiplier,
      resolution = self.settings.routeStrokeResolution,
      horizontal = self.settings.routeStrokeHorizontal;

    $.extend(cordinates, options);

    var lastLat = cordinates.latStart;
    var lastLng = cordinates.lngStart;

    var partLat, partLng, offsetLength;

    var points = [];
    var pointsOffset = [];

    var offsetmultiplier = 0;

    for (point = 0; point <= 1; point += resolution) {
      points.push(point);
      offset = (0.6 * Math.sin((Math.PI * point / 1)));
      pointsOffset.push(offset);
    }

    if (horizontal === true) {
      offsetLength = (options.lngEnd - cordinates.lngStart) * 0.1;
    } else {
      offsetLength = (options.latEnd - cordinates.latStart) * 0.1;
    }

    for (var i = 0; i < points.length; i++) {
      if (i == 4) {
        offsetmultiplier = 1.5 * multiplier;
      }

      if (i >= 5) {
        offsetmultiplier = (offsetLength * pointsOffset[i]) * multiplier;
      } else {
        offsetmultiplier = (offsetLength * pointsOffset[i]) * multiplier;
      }

      if (horizontal === true) {
        partLat = (cordinates.latStart + ((options.latEnd - cordinates.latStart) * points[i])) + offsetmultiplier;
        partLng = (cordinates.lngStart + ((options.lngEnd - cordinates.lngStart) * points[i]));
      } else {
        partLat = (cordinates.latStart + ((options.latEnd - cordinates.latStart) * points[i]));
        partLng = (cordinates.lngStart + ((options.lngEnd - cordinates.lngStart) * points[i])) + offsetmultiplier;
      }

      self.generateCurvedLineSegment(lastLat, lastLng, partLat, partLng);

      lastLat = partLat;
      lastLng = partLng;
    }

    self.generateCurvedLineSegment(lastLat, lastLng, options.latEnd, options.lngEnd);
  };

  JetGoogleMaps.prototype.plotAirport = function(airportObject) {
    var self = this;

    var airport = new window.MarkerWithLabel({
      position: new google.maps.LatLng(airportObject.latitude, airportObject.longitude),
      map: self.map,
      icon: self.settings.mapMarkerImage,
      labelContent: airportObject.airport,
      labelAnchor: new google.maps.Point(-10, 10),
      labelClass: self.settings.markerLabelClass,
      airportData: airportObject
    });

    google.maps.event.addListener(airport, 'click', function() {
      self.getCurrentAirportRoutes(this.airportData);
      self.plotCurrentAirportRoutes();
    });

    self.plottedAirports.push(airport);
  };

  JetGoogleMaps.prototype.getAirportByIata = function(iataName) {
    var self = this;

    for (var i = 0, l = self.allAirports.length; i < l; i++) {
      if (self.allAirports[i].iata === iataName) {
        return self.allAirports[i];
      }
    };
    return false;
  };

  JetGoogleMaps.prototype.getCurrentAirportRoutes = function(airportObject) {
    var self = this;
    self.currentAirportRoutes = [];

    $.each(self.allRoutes, function(i, route) {
      if (route.origin === airportObject.iata) {
        self.currentAirportRoutes.push(route);
      }
    });

    $.each(self.currentAirportRoutes, function(i, route) {
      route.hopData = [];
      route.hopData.push(self.getAirportByIata(route.origin));

      if (route.hasOwnProperty('hops') && route.hops.length) {
        $.each(route.hops, function(j, hop) {
          route.hopData.push(self.getAirportByIata(hop));
        });
      }

      route.hopData.push(self.getAirportByIata(route.destination));
    });
  };

  JetGoogleMaps.prototype.plotCurrentAirportRoutes = function() {
    var self = this;
    var prevIndex, nextIndex, origin, destination;

    var plotBounds = new google.maps.LatLngBounds();

    $.each(self.currentAirportRoutesPaths, function(i, path) {
      path.setMap(null);
    });

    self.currentAirportRoutesPaths = [];
    self.evenOdd = 0;

    $.each(self.currentAirportRoutes, function(i, route) {

      plotBounds.extend(new google.maps.LatLng(route.hopData[0].latitude, route.hopData[0].longitude));

      $.each(route.hopData, function(j, airportObject) {
        prevIndex = j;
        nextIndex = j + 1;

        origin = route.hopData[prevIndex];
        destination = route.hopData[nextIndex];

        //Plot if destination exists
        if (origin && destination) {
          self.generateCurvedLine({
            latStart: parseFloat(origin.latitude),
            lngStart: parseFloat(origin.longitude),
            latEnd: parseFloat(destination.latitude),
            lngEnd: parseFloat(destination.longitude),
          });

          plotBounds.extend(new google.maps.LatLng(destination.latitude, destination.longitude));
        }
      });
    });

    if (!plotBounds.isEmpty()) {
      self.map.fitBounds(plotBounds);
    }

  };


  JetGoogleMaps.prototype.checkMapBounds = function() {
    var self = this;
    var latNorth = self.map.getBounds().getNorthEast().lat();
    var latSouth = self.map.getBounds().getSouthWest().lat();
    var newLat = null;
    var newCenter = null;

    if ((latNorth < 85 && latSouth > -85) || (latNorth > 85 && latSouth < -85)) {
      return;
    } else {
      if (latNorth > 85) {
        /* too north, centering */
        newLat = self.map.getCenter().lat() - (latNorth - 85);
      }
      if (latSouth < -85) {
        /* too south, centering */
        newLat = self.map.getCenter().lat() - (latSouth + 85);
      }
    }
    if (newLat) {
      newCenter = new google.maps.LatLng(newLat, self.map.getCenter().lng());
      self.map.setCenter(newCenter);
    }
  };

  JetGoogleMaps.prototype.createMap = function() {
    var self = this;
    self.map = new google.maps.Map(document.getElementById(self.settings.wrapperId), self.getMapOptions());
    //Create custom feature map
    var customMapType = new google.maps.StyledMapType(self.settings.mapFeatures, {
      name: self.settings.mapFeatureName
    });
    //Set custom feature map
    self.map.mapTypes.set(self.settings.mapId, customMapType);
    //Check bounds of the maps if panning over the poles
    google.maps.event.addListener(self.map, 'center_changed', function() {
      self.checkMapBounds();
    });
  };

  JetGoogleMaps.prototype.fetchAirportData = function() {
    var self = this;
    //Get the data from the CSV
    d3.csv(self.settings.airportsUrl).get(function(error, airports) {
      if (error) {
        console.error(error);
        return;
      }
      self.allAirports = airports;
      self.fetchRoutesData();
    });
  };

  JetGoogleMaps.prototype.fetchRoutesData = function() {
    var self = this;

    d3.json(self.settings.routesUrl, function(error, routes) {
      if (error) {
        console.error('error');
        return;
      }
      self.allRoutes = routes;

      $.each(self.allAirports, function(i, airport) {
        self.plotAirport(airport);
      });

      self.airportCluster = new MarkerClusterer(self.map, self.plottedAirports, {
        maxZoom: 10,
        gridSize: 45
      });

    });
  };

})(window)