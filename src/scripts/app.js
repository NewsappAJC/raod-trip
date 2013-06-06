$(document).ready( function() {
  var routeColors = {
        ga400:   ['#BD1515','#E25151','#F5C5C5','#FBE7E7'],
        south75: ['#F2A71B','#F5BD54','#FBE9C6','#FDF6E8'],
        east20:  ['#6C8C26','#90A85C','#DAE2C8','#F0F3E9'],
        west20:  ['#0F808C','#4B9FA8','#C3DFE2','#E7F2F3'],
        blank:   ['#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF']
      },
      routeMaps = [],
      currentRoute = '',
      route = "",
      formatPercent = d3.format(".0%"),
      selectedPoints,
      redrawChart;

  // Initial map configuration
  var mapConfig = {
    width: $("div#map").width(),
    height: 280
  };

  var projection = d3.geo.albers()
        .rotate([84.29,0])
        .center([0,33.16])
        .scale([12000])
        .translate([mapConfig.width/2, mapConfig.height]);

  var mapPath = d3.geo.path().projection(projection);

  var map = d3.select("#map")
        .append("svg")
        .attr("width", mapConfig.width)
        .attr("height", mapConfig.height);

  // Initial chart configuration
  var chartConfig = {};
  chartConfig.margins = {top: 5, right: 10, bottom: 175, left: 50};
  chartConfig.width   = $("#chart").width() - chartConfig.margins.left - chartConfig.margins.right;
  chartConfig.height  = 450 - chartConfig.margins.top - chartConfig.margins.bottom;

  chartConfig.scales = {
    x: d3.scale.ordinal().rangePoints([0, chartConfig.width]),
    y: d3.scale.linear().range([chartConfig.height, 0]).domain([0,1])
  };

  chartConfig.axis = {
    x: d3.svg.axis().scale(chartConfig.scales.x).orient("bottom"),
    y: d3.svg.axis().scale(chartConfig.scales.y).orient("left").tickFormat(formatPercent)
  };

  chartConfig.colors = d3.scale.ordinal().range(routeColors.blank);
  chartConfig.colors.domain(["below_poverty_pct","100_to_200_pct","200_to_500_pct","gt_500_pct"]);
  titleText = ["Income below poverty","Income 100% to 200% of poverty","Income 200% to 500% of poverty","Income more than 500% of poverty"];

  var chartArea = d3.svg.area()
      .x(function(d,i) { return chartConfig.scales.x(i); })
      .y0(function(d)  { return chartConfig.scales.y(d.y0); })
      .y1(function(d)  { return chartConfig.scales.y(d.y0 + d.y); })
      .interpolate("cardinal");

  var stackChartData = d3.layout.stack()
      .values(function(d) { return d.values; });

  var chart = d3.select("#chart").append("svg")
      .attr("width", chartConfig.width + chartConfig.margins.left + chartConfig.margins.right)
      .attr("height", chartConfig.height + chartConfig.margins.top + chartConfig.margins.bottom)
    .append("g")
      .attr("transform", "translate(" + chartConfig.margins.left + "," + chartConfig.margins.top + ")");

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
                drawMap();
                drawChart("blank");
              });
            });
          });
        });
      });
    });
  });

  //////////////////////////////////////////////////////////////////////////////////
  var drawMap = function() {
    // Map layer constructor
    var addMapLayer = function(container, options) {
      l = container.selectAll(options.name)
         .data(options.data)
         .enter()
         .append("path")
          .attr("d", mapPath);

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
        {name: "stroke", value: routeColors[route][0]},
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

  /////////////////////////////////////////////////////////////////////////////////
  var drawChart = function(route) {
    selectedPoints = _.sortBy(_.where(points, { route: route }), function(d) {
      return d.id;
    });

    var stackedData = stackChartData(chartConfig.colors.domain().map(function(name, i) {
      return {
        name: name,
        titleText: titleText[i],    // Get tooltip text from titleText array
        values: selectedPoints.map(function(d, j) {
          return {x: j, y: d[name] / 100, label: d.to_loc, id: d.id};
        })
      };
    }));
    chartConfig.colors.range(routeColors[route]);
    chartConfig.scales.x.domain(d3.range(selectedPoints.length));
    chartConfig.axis.x.tickValues(selectedPoints.map(function(d, i) { return ' ' + d.to_loc; }));

    d3.selectAll(".area").remove();
    d3.selectAll(".xLabels").remove();
    d3.selectAll(".x").remove();
    d3.selectAll(".chart-line").remove();
    d3.selectAll(".chart-point").remove();

    var tour = chart.selectAll(".browser")
      .data(stackedData);

    tour.enter().append("g")
        .attr("class", "browser");

    tour.append("path")
      .attr("class", "area")
      .attr("d", function(d) { return chartArea(d.values); })
      .style("fill", function(d) { return chartConfig.colors(d.name); })
        .append("title")
          .text(function(d) { return d.titleText; });

    tourUpdate = d3.transition(tour);

    tourUpdate.transition().select("path").duration(600)
      .attr("d", function(d) { return chartArea(d.values); });

    var showChartPoint = function(d,i) {
      var routeData = selectedPoints[i];

      $("#from").text(routeData.from_loc);
      $("#to").text(routeData.to_loc);
      $("#gt500").text( routeData.gt_500_pct );
      $("#gt200").text( routeData["200_to_500_pct"] );
      $("#gt100").text( routeData["100_to_200_pct"] );
      $("#lt100").text( routeData.below_poverty_pct );
      $("#info").removeClass("hidden");

      d3.select(".selected-chart-line").attr("class", "chart-line");
      d3.select('#route-' + i).attr("class", "selected-chart-line");

      d3.selectAll(".chart-point").attr("r", "0px");
      d3.selectAll(".point-" + i).attr("r", "4px");

      d3.selectAll(".mapPoint").attr("opacity", 0);
      d3.select("#mapPoint" + routeData.id ).attr("opacity", 1);

      d3.selectAll(".xLabels").style("fill", "lightgrey");
      d3.select("#xLabel-" + i).style("fill", "black");
    };

    chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chartConfig.height + ")")
      .call(chartConfig.axis.x)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("class", "xLabels")
        .attr("id", function(d,i) {return "xLabel-" + i;})
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function(d){ return "rotate(-65)"; })
        .on("mouseover", showChartPoint);

    chart.append("g")
      .attr("class", "y axis")
      .call(chartConfig.axis.y);

    var lines = chart.selectAll("chart-line")
      .data(selectedPoints);

    if ( route !== "blank" ) {
      lines.enter().append("svg:line")
          .attr("id", function(d,i) { return 'route-' + i; })
          .attr("class", "chart-line")
          .attr("x1", function(d,i) { return chartConfig.scales.x(i); })
          .attr("x2", function(d,i) { return chartConfig.scales.x(i); })
          .attr("y1", 0)
          .attr("y2", chartConfig.height);

      d3.values(stackedData).forEach(function(point) {
        chart.selectAll("chart-point")
          .data(point.values)
          .enter().append("svg:circle")
            .attr("cx", function(d) { return chartConfig.scales.x(d.x); })
            .attr("cy", function(d) { return chartConfig.scales.y(d.y0 + d.y); })
            .attr("r", "0px")
            .attr("id", function(d) { return point.name + "-" + d.x; })
            .attr("class", function(d) { return "chart-point point-" + d.x; })
          .append("text")
            .text(function(d) { return selectedPoints[d.x][point.name] + "%"; })
            .attr("x", function(d) { return chartConfig.scales.x(d.x); })
            .attr("y", function(d) { return chartConfig.scales.y(d.y0 + d.y); });
      });
      showChartPoint([],0);
    }
  };  // drawChart

  ////////////////////////////////////////////////////////////////////////////////
  // Show routes on the map in response to mouse events
  var showRoute = function(route) {
    if (currentRoute !== '') {
      d3.selectAll('.' + currentRoute)
        .transition().duration(500)
        .style('stroke-width', '0');
    }

    d3.selectAll('.' + route)
      .transition().delay(500).duration(500)
      .style('stroke-width', '3px')
      .style('opacity', 1);
    currentRoute = route;
  };

  // Mouse events on route buttons
  d3.selectAll('.route')
    .on('click', function() {
      d3.event.preventDefault();
      showRoute(this.id);
      if ( typeof selectedPoints === "undefined" ) {
        drawChart(this.id);
      } else {
        drawChart(this.id);
      }
    })
    .on('mouseover', function() {
      if ( this.id === currentRoute ) {
        d3.selectAll('.' + this.id)
          .style('stroke-width', '6px');
        return false;
      }
      d3.selectAll('.' + this.id)
        .style('stroke-width', '6px')
        .style('opacity', 0.25);
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
