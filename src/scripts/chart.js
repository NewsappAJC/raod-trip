
$(function(){
  var route = "ga400",
      formatPercent = d3.format(".0%"),
      chartConfig = {};

  chartConfig.margins = {top: 5, right: 20, bottom: 175, left: 50};
  chartConfig.width   = $("#chart").width() - chartConfig.margins.left - chartConfig.margins.right;
  chartConfig.height  = 500 - chartConfig.margins.top - chartConfig.margins.bottom;

  chartConfig.scales = {
    x: d3.scale.ordinal().rangePoints([0, chartConfig.width]),
    y: d3.scale.linear().range([chartConfig.height, 0])
  };

  chartConfig.axis = {
    x: d3.svg.axis().scale(chartConfig.scales.x).orient("bottom"),
    y: d3.svg.axis().scale(chartConfig.scales.y).orient("left").tickFormat(formatPercent)
  };

  chartConfig.colors = d3.scale.category20c();


  var chartArea = d3.svg.area()
      .x(function(d, i) { return chartConfig.scales.x(i); })
      .y0(function(d)   { return chartConfig.scales.y(d.y0); })
      .y1(function(d)   { return chartConfig.scales.y(d.y0 + d.y); })
      .interpolate("cardinal");

  var chartStack = d3.layout.stack()
      .values(function(d) { return d.values; });

  var chart = d3.select("#chart").append("svg")
      .attr("width", chartConfig.width + chartConfig.margins.left + chartConfig.margins.right)
      .attr("height", chartConfig.height + chartConfig.margins.top + chartConfig.margins.bottom)
    .append("g")
      .attr("transform", "translate(" + chartConfig.margins.left + "," + chartConfig.margins.top + ")");

  var selectedPoints;
  ////////////////////////////////////////////////////////////////////////////////////
  d3.csv("data/points.csv", function(error, data) {
    selectedPoints = _.sortBy(_.where(data, { route: route }),
                      function(d){ return d.id; });

    chartConfig.colors.domain(["below_poverty_pct","100_to_200_pct","200_to_500_pct","gt_500_pct"]);

    var browsers = chartStack(chartConfig.colors.domain().map(function(name) {
      return {
        name: name,
        values: selectedPoints.map(function(d, i) {
          return {x: i, y: d[name] / 100};
        })
      };
    }));

    chartConfig.scales.x.domain(d3.range(selectedPoints.length));
    chartConfig.axis.x.tickValues(selectedPoints.map(function(d) { return d.to_loc; }));

    var browser = chart.selectAll(".browser")
      .data(browsers)
      .enter().append("g")
        .attr("class", "browser");

    browser.append("path")
      .attr("class", "area")
      .attr("d", function(d) { return chartArea(d.values); })
      .style("fill", function(d) { return chartConfig.colors(d.name); })
      .append("title")
        .text(function(d) { return d.name; });

    chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chartConfig.height + ")")
      .call(chartConfig.axis.x)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("class", "xLabels")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d){ return "rotate(-65)"; })
        .on("mouseover", function(d,i) {
          routeData = selectedPoints[i];

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
      .call(chartConfig.axis.y);

    chart.selectAll("route-line")
      .data(selectedPoints)
      .enter().append("svg:line")
        .attr("id", function(d,i) { return 'route-' + i; })
        .attr("class", "route-line")
        .attr("x1", function(d,i) { return chartConfig.scales.x(i); })
        .attr("x2", function(d,i) { return chartConfig.scales.x(i); })
        .attr("y1", 0)
        .attr("y2", chartConfig.height);

    d3.values(browsers).forEach(function(brows) {
      chart.selectAll("seg-point")
        .data(brows.values)
        .enter().append("svg:circle")
          .attr("cx", function(d) { return chartConfig.scales.x(d.x); })
          .attr("cy", function(d) { return chartConfig.scales.y(d.y0 + d.y); })
          .attr("r", "0px")
          .attr("id", function(d) { return brows.name + "-" + d.x; })
          .attr("class", function(d) { return "chartPoint point-" + d.x; })
          .style("fill", "black")
          .style("stroke", "white")
        .append("text")
          .text(function(d) { return selectedPoints[d.x][brows.name] + "%"; })
          .attr("x", function(d) { return chartConfig.scales.x(d.x); })
          .attr("y", function(d) { return chartConfig.scales.y(d.y0 + d.y); });
    });
  });
});