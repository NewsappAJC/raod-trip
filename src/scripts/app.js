$(document).ready( function() {
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
        .style("stroke", "red")
        .style("stroke-width", "3px")
      .on('click', function(){ console.log('click'); });
  };
});
