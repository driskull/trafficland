require([
  "esri/config",
  "esri/Graphic",
  "esri/Map",
  "esri/request",
  "esri/views/MapView",
  "esri/geometry/support/webMercatorUtils",
  "esri/core/urlUtils"
], function(esriConfig, Graphic, Map, esriRequest, MapView, webMercatorUtils, urlUtils) {
  esriConfig.request.proxyUrl = "/proxy/proxy.php";

  urlUtils.addProxyRule({
    urlPrefix: "api.trafficland.com",
    proxyUrl: esriConfig.request.proxyUrl
  });

  var map = new Map({
    basemap: "topo"
  });

  var view = new MapView({
    map: map,
    zoom: 14,
    center: [-77.0369, 38.9072],
    container: "viewDiv"
  });

  view.when(function() {

    function fetchData(){

        var geographic = webMercatorUtils.webMercatorToGeographic(view.extent);

        var options = {
          query: {
            system: "bentear",
            key: "a1441baa6d570d1f68c064211bce5492",
            nelat: geographic.ymax,
            nelon: geographic.xmax,
            swlat: geographic.ymin,
            swlon: geographic.xmin
          }
        };

        var request = esriRequest(
          "https://api.trafficland.com/v2.1/json/video_feeds/bbox",
          options
        );

        var addedMap = {};

        request.then(function(response) {
          var data = response.data;

          data.forEach(result => {

            if (addedMap[result.publicId]){
              return;
            }

            var point = {
              type: "point",
              latitude: result.location.latitude,
              longitude: result.location.longitude
            };

            var popupTemplate = {
              title: result.name,
              content:
                "<h2>" +
                result.providerFullName +
                '</h2><p><a href="' +
                result.content.hugeJpeg +
                '" target="_blank"><img src="' +
                result.content.halfJpeg +
                '" /></a></p>'
            };

            var symbol = {
              type: "simple-marker",
              outline: {
                  style: "none"
              },
              size: 10,
              color: [26, 26, 26, 1]
            };

            var graphic = new Graphic({
              geometry: point,
              attributes: result.location,
              popupTemplate: popupTemplate,
              symbol: symbol
            });
            view.graphics.add(graphic);
            addedMap[result.publicId] = true;
          });
        });
    }

    fetchData();

    var timer;
    view.watch("extent", function() {
      timer && clearTimeout(timer);
      timer = setTimeout(function() {
        fetchData();
      }, 1000);
    });
  });
});
