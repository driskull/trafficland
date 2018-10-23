require([
  "esri/config",
  "esri/Graphic",
  "esri/Map",
  "esri/request",
  "esri/views/MapView",
  "esri/geometry/support/webMercatorUtils"
], function(esriConfig, Graphic, Map, esriRequest, MapView, webMercatorUtils) {
  esriConfig.request.proxyUrl = "/proxy/proxy.php";


  var map = new Map({
    basemap: "topo"
  });

  var view = new MapView({
    map: map,
    zoom: 12,
    center: [-117, 34],
    container: "viewDiv"
  });

  view.when(function() {
    var timer;
    view.watch("extent", function() {
      timer && clearTimeout(timer);
      timer = setTimeout(function() {
        view.graphics.removeAll();

        var geographic = webMercatorUtils.webMercatorToGeographic(view.extent);

        var options = {
          query: {
            system: "bentear",
            key: "a1441baa6d570d1f68c064211bce5492",
            nelat: geographic.ymax,
            nelon: geographic.xmax,
            swlat: geographic.ymin,
            swlon: geographic.xmin
          },
          useProxy: true
        };

        var request = esriRequest(
          "https://api.trafficland.com/v2.1/json/video_feeds/bbox",
          options
        );

        request.then(function(response) {
          var data = response.data;

          data.forEach(result => {
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
              type: "picture-marker",
              url: "pin.png",
              width: "32px",
              height: "32px"
            };

            var graphic = new Graphic({
              geometry: point,
              attributes: result.location,
              popupTemplate: popupTemplate,
              symbol: symbol
            });
            view.graphics.add(graphic);
          });
        });
      }, 2000);
    });
  });
});
