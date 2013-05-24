
var redrawChart;

$(function(){
  var route = "ga400";

  var margin = {top: 5, right: 20, bottom: 175, left: 50},
      width = $("#chart").width() - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var formatPercent = d3.format(".0%");

  var xScale = d3.scale.ordinal()
        .rangePoints([0, width]),
      yScale = d3.scale.linear()
        .range([height, 0]);

  var color = d3.scale.category20c();

  var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left")
      .tickFormat(formatPercent);

  var area = d3.svg.area()
      .x(function(d, i) { return xScale(i); })
      .y0(function(d) { return yScale(d.y0); })
      .y1(function(d) { return yScale(d.y0 + d.y); })
      .interpolate("cardinal");

  var stack = d3.layout.stack()
      .values(function(d) { return d.values; });

  var chart = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var points;
  ////////////////////////////////////////////////////////////////////////////////////
  d3.csv("data/points.csv", function(error, data) {
    points = _.sortBy(_.where(data, { route: route }),
                      function(d){ return d.id; });
    window.p = points;
    color.domain(["below_poverty_pct","100_to_200_pct","200_to_500_pct","gt_500_pct"]);

    var browsers = stack(color.domain().map(function(name) {
      return {
        name: name,
        values: points.map(function(d, i) {
          return {x: i, y: d[name] / 100};
        })
      };
    }));
    window.b = browsers;

    xScale.domain(d3.range(points.length));
    xAxis.tickValues(points.map(function(d) { return d.to_loc; }));

    var browser = chart.selectAll(".browser")
      .data(browsers)
      .enter().append("g")
        .attr("class", "browser");

    browser.append("path")
      .attr("class", "area")
      .attr("d", function(d) { return area(d.values); })
      .style("fill", function(d) { return color(d.name); })
      .append("title")
        .text(function(d) { return d.name; });

    chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("class", "xLabels")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d){ return "rotate(-65)"; })
        .on("mouseover", function(d,i) {
          routeData = points[i];

          $("#from").text(routeData.from_loc);
          $("#to").text(routeData.to_loc);
          $("#gt500").text( routeData.gt_500_pct );
          $("#gt200").text( routeData["200_to_500_pct"] );
          $("#gt100").text( routeData["100_to_200_pct"] );
          $("#lt100").text( routeData.below_poverty_pct );
          $("#info").removeClass("hidden");

          d3.select(".selected-route-line").attr("class", "route-line");
          d3.select('#route-' + i).attr("class", "selected-route-line");

          d3.selectAll(".chartPoint").attr("r", "0px");
          d3.selectAll(".point-" + i).attr("r", "4px");

          d3.selectAll(".mapPoint").attr("opacity", 0);
          d3.select("#mapPoint" + routeData.id ).attr("opacity", 1);

          d3.selectAll(".xLabels").style("fill", "lightgrey");
          d3.select(this).style("fill", "black");
        });

    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    chart.selectAll("route-line")
      .data(points)
      .enter().append("svg:line")
        .attr("id", function(d,i) { return 'route-' + i; })
        .attr("class", "route-line")
        .attr("x1", function(d,i) { return xScale(i); })
        .attr("x2", function(d,i) { return xScale(i); })
        .attr("y1", 0)
        .attr("y2", height);

    d3.values(browsers).forEach(function(brows) {
      chart.selectAll("seg-point")
        .data(brows.values)
        .enter().append("svg:circle")
          .attr("cx", function(d) { return xScale(d.x); })
          .attr("cy", function(d) { return yScale(d.y0 + d.y); })
          .attr("r", "0px")
          .attr("id", function(d) { return brows.name + "-" + d.x; })
          .attr("class", function(d) { return "chartPoint point-" + d.x; })
          .style("fill", "black")
          .style("stroke", "white")
        .append("text")
          .text(function(d) { return points[d.x][brows.name] + "%"; })
          .attr("x", function(d) { return xScale(d.x); })
          .attr("y", function(d) { return yScale(d.y0 + d.y); });
    });
  });
});