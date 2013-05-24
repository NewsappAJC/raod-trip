$(document).ready( function() {
  var routeColors = {
        ga400:   '#D91818',
        south75: '#F2A71B',
        east20:  '#6C8C26',
        west20:  '#0F808C'
      },
      routeMaps = [],
      currentRoute = 'ga400';

  var mapConfig = {
    width: $("div#map").width(),
    height: 280
  };

  var projection = d3.geo.albers()
        .rotate([84.29,0])
        .center([0,33.16])
        .scale([12000])
        .translate([mapConfig.width/2, mapConfig.height]);

  var path = d3.geo.path().projection(projection);

  var map = d3.select("#map")
        .append("svg")
        .attr("width", mapConfig.width)
        .attr("height", mapConfig.height);

  // Read data files
  var county, expway, ga400, south75, east20, west20, points;
  d3.json( 'data/county.geojson', function(json) {
    county = json;

    d3.json( 'data/expressways.geojson', function(json) {
      expway = json;

      d3.json( 'data/GA400.geojson', function(json) {
        ga400 = json;

        d3.json( 'data/75_south.geojson', function(json) {
          south75 = json;

          d3.json( 'data/east20.geojson', function(json) {
            east20 = json;

            d3.json( 'data/west20.geojson', function(json) {
              west20 = json;

              d3.csv( 'data/points.csv', function(data) {
                points = data;
                window.p = points;
                drawMap();
              });
            });
          });
        });
      });
    });
  });

  var drawMap = function() {
    // Map layer constructor
    var addMapLayer = function(container, options) {
      l = container.selectAll(options.name)
         .data(options.data)
         .enter()
         .append("path")
          .attr("d", path);

      if ( typeof options.attr !== "undefined" ) {
        _.each(options.attr, function(attr) {
          l.attr(attr.name, attr.value);
        });
      }
      if ( typeof options.attr !== "undefined" ) {
        _.each(options.style, function(style) {
          l.style(style.name, style.value);
        });
      }
      return l;
    };

    // Add county layer to map
    var countyLayer = addMapLayer(map, {
      name: "county",
      data: county.features,
      attr: [{ name: "class", value: "county"}],
      style: [
        { name: "stroke", value: "white" },
        { name: "stroke-width", value: "3px" },
        { name: "fill", value: "#F2EFF4" }
      ]
    });

    // Add expressway layer to map
   var expwayLayer = addMapLayer(map, {
     name: "expway",
     data: expway.features,
     attr: [{name:"class", value: "expway"}],
     style: [
       { name: "stroke", value: "lightgrey" },
       { name: "stroke-width", value: "2px" }
     ]
   });

   // Add route layers to map
   _.each(["ga400","south75","east20","west20"], function(route) {
    var data = eval(route);
    routeMaps[route] = addMapLayer(map, {
      name: route,
      data: data.features,
      attr: [{name: "class", value: route}],
      style: [
        {name: "stroke", value: routeColors[route]},
        {name: "stroke-width", value: "0px"}
      ]
    });
   });

   // Ad point layer to map
    map.selectAll("points")
      .data(points)
      .enter()
      .append("circle")
        .attr("cx", function(d) { return projection([d.lon, d.lat])[0]; })
        .attr("cy", function(d) { return projection([d.lon, d.lat])[1]; })
        .attr("r", "5px")
        .attr("opacity", 0)
        .attr("id", function(d) { return "mapPoint" + d.id; })
        .attr("class", function(d) { return "mapPoint mapPoint-" + d.route; })
        .style("fill", "black")
        .style("stroke", "white");
  };

  // Show routes in response to mopuse events
  var showRoute = function(route) {
    d3.selectAll('.' + currentRoute)
      .transition().duration(750)
      .style('stroke-width', '0');

    d3.selectAll('.' + route)
      .transition().duration(1500)
      .style('stroke-width', '3px')
      .style('opacity', 1);
    currentRoute = route;
  };

  // Mouse events on route buttons
  d3.selectAll('.route')
    .on('click', function() {
      d3.event.preventDefault();
      showRoute(this.id);
    })
    .on('mouseover', function() {
      if ( this.id === currentRoute ) {
        d3.selectAll('.' + this.id)
          .style('stroke-width', '6px');
        return false;
      }
      d3.selectAll('.' + this.id)
        .style('stroke-width', '6px')
        .style('opacity', 0.35);
    })
    .on('mouseout', function() {
      if ( this.id === currentRoute ) {
        d3.selectAll('.' + this.id)
          .style('stroke-width', '3px');
        return false;
      }
      d3.selectAll('.' + this.id)
        .style('stroke-width', '0')
        .style('opacity', 1);
    });
});
