$(document).ready( function() {
  var currentRoute;
  var w = $("div#map").width(),
      h = 700;

  var projection = d3.geo.albers()
        .rotate([84.4,0])
        .center([0,33.1])
        .scale([30000])
        .translate([w/2,h]);

  var path = d3.geo.path().projection(projection);

  var svg = d3.select("#map")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

  var county, expway, ga400, south75, east20, west20;
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
              drawMap();
            });
          });
        });
      });
    });
  });

  var drawMap = function() {
    svg.selectAll("county")
       .data(county.features)
       .enter()
       .append("path")
         .attr("d", path)
         .style('stroke', 'white')
         .style('stroke-width', '3px')
         .style('fill', '#F2EFE4');

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
        .style("stroke", "#D91818")
        .style("stroke-width", "0px");

    svg.selectAll("south75")
      .data(south75.features)
      .enter()
      .append("path")
        .attr("d", path)
        .attr('class', 'south75')
        .style("stroke", "#F2A71B")
        .style("stroke-width", "0px");

    svg.selectAll("east20")
      .data(east20.features)
      .enter()
      .append("path")
        .attr("d", path)
        .attr('class', 'east20')
        .style("stroke", "#6C8C26")
        .style("stroke-width", "0px");

    svg.selectAll("west20")
      .data(west20.features)
      .enter()
      .append("path")
        .attr("d", path)
        .attr('class', 'west20')
        .style("stroke", "#0F808C")
        .style("stroke-width", "0px");
  };

  d3.selectAll('.route')
    .on('click', function() {
      console.log(this.id);
      showRoute(this.id);
      d3.event.preventDefault();
    })
    .on('mouseover', function() {
      if ( this.id === currentRoute ) {
        return false;
      }
      d3.selectAll('.' + this.id)
        .style('stroke-width', '8px')
        .style('opacity', 0.15);
    })
    .on('mouseout', function() {
      if ( this.id === currentRoute ) {
        return false;
      }
      d3.selectAll('.' + this.id)
        .style('stroke-width', '0')
        .style('opacity', 1);
    });

    var showRoute = function(route) {
      d3.selectAll('.' + currentRoute)
        .style('stroke-width', '0');
      d3.selectAll('.' + route)
        .style('stroke-width', '4px')
        .style('opacity', 1);
      currentRoute = route;
    };
});
