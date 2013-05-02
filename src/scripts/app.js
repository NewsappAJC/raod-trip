$(function() {
  var w = 960,
      h = 1200;

  var projection = d3.geo.albers()
        .rotate([84.4,0])
        .center([0,33.1])
        .scale([25000])
        .translate([w/2,h/2]);

  var path = d3.geo.path().projection(projection);

  var svg = d3.select("#map")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

  d3.json( 'data/expressways.geojson', function(json) {
    window.json = json;
    svg.selectAll("path")
       .data(json.features)
       .enter()
       .append("path")
       .attr("d", path)
       .style('stroke', 'grey');
  });
});
