$(document).ready( function() {
  var currentRoute;
  var w = $("div#map").width(),
      h = 600;

  var projection = d3.geo.albers()
        .rotate([84.4,0])
        .center([0,33.1])
        .scale([25000])
        .translate([w/2,h]);

  var path = d3.geo.path().projection(projection);

  var svg = d3.select("#map")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

  d3.json( 'data/expressways.geojson', function(json) {
    var expway = json;
    window.expway = expway;

    d3.json( 'data/GA400.geojson', function(json) {
      var ga400 = json;
      window.ga400 = json;
      drawMap();
    });
  });

  var drawMap = function() {
    svg.selectAll("expway")
       .data(expway.features)
       .enter()
       .append("path")
         .attr("d", path)
         .style('stroke', 'grey');

    svg.selectAll("ga400")
      .data(ga400.features)
      .enter()
      .append("path")
        .attr("d", path)
        .attr('class', 'ga400')
        .style("stroke", "red")
        .style("stroke-width", "0px")
      .on('click', function(){ console.log('click'); });
  };

  d3.select('.route')
    .on('click', function() {
      console.log(this.id);
      showRoute(this.id);
      d3.event.preventDefault();
    });

    var showRoute = function(route) {
      d3.selectAll('.' + currentRoute)
        .style('stroke-width', '0');
      d3.selectAll('.' + route)
        .style('stroke-width', '4px');
      currentRoute = route;
    };
});
