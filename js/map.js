
queue()
  .defer(d3.json, "data/us.json")
  .defer(d3.csv,"data/generation.csv")
  .defer(d3.csv, "data/plant2014.csv")
  .await(ready);


function ready(error, us, generation, plant2014) {

  if (error) throw error;

  var WIDTH = 1200, HEIGHT = 840;

  var radius = d3.scale.sqrt()
    .domain([0, 32321000])
    .range([0, 30]);

  var width = WIDTH,
      height = HEIGHT;
  
  var projection = d3.geo.albersUsa()
    .scale(1400)
    .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);
  
  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);
  
  name_id_map = {};
  id_name_map = {};
  id_usshare_map = {};
  id_avgprice_map = {};
  var revenuebyid = d3.map();
  
  for (var i = 0; i < generation.length; i++) {
    name_id_map[generation[i].statefullname] = generation[i].id;
    id_name_map[generation[i].id] = generation[i].statefullname;
    id_usshare_map[generation[i].id] = generation[i].usshare;
    id_avgprice_map[generation[i].id] = generation[i].avgprice;
  }
  
  generation.forEach(function(d) {
    var id = name_id_map[d["statefullname"]];
    revenuebyid.set(id, +d["revenue"]); 
  });
  
  function mouseoverstate(d) {
            var html = "";
  
            html += "<div class=\"row\">";
            html += "<span class=\"tooltip_key\">";
            html += id_name_map[d.id] + "</span><br>";
            html += "<span class=\"tooltip_value\">";
            html += "Revenue from Retail Sales <br>of Electricity: " + revenuebyid.get(d.id) + " Million$<br>";
            html += "Percent Share of U.S. <br>Total Generation: " + id_usshare_map[d.id] +"%<br>";
            html += "Annual Average Price: " + id_avgprice_map[d.id] +"$";
            html += "</span>";
            html += "</div>";
            
            $("#tooltip-container").html(html);
            $("#tooltip-container").show();
            
            var coordinates = d3.mouse(this);
            
            var map_width = $('.states-choropleth')[0].getBoundingClientRect().width;
            
            if (d3.event.layerX < map_width / 2) {
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX + 15) + "px");
            } else {
              var tooltip_width = $("#tooltip-container").width();
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
        }

  function mouseoutstate(d) {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").hide();
            }

  // var g = svg.append("g");

  svg.append("g")
        .attr("class", "states-choropleth")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .enter().append("path")
        .attr("d", path)
        .on("mousemove", mouseoverstate)
        .on("mouseout", mouseoutstate);
    
  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);
  
 var categories ={
    "biomass" : "#08519c",
    "naturalgas" : "#fe9929",
    "geothermal" : "#d95f0e",
    "water" : "#2b8cbe",
    "nuclear" : "#756bb1",
    "petroleum" : "#f768a1",
    "other" : "#fde0dd",
    "solar" : "#800026",
    "wind" : "#31a354",
    "otherrenewable" : "#e31a1c",
    "coal" : "#636363"};

  var formatNumber = d3.format(",.0f");

  svg.append("g")
      .attr("class","bubble")
      .selectAll("circle")
      .data(plant2014)
      .enter().append("circle")
      .attr("cx",function(d){
        if (projection([d.lon, d.lat]) !== null){
          return projection([d.lon, d.lat])[0];
        } 
      })
      .attr("cy",function(d){
        if (projection([d.lon, d.lat]) !== null){
          return projection([d.lon, d.lat])[1];
        }
      })
      .attr("r", function(d){
        return radius(d.generation);
      })
      .style("fill", function(d){
        return categories[d.fuel];
      })
      .style("opacity", 0.75);


  var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 120) + "," + (height - 200) + ")")
  .selectAll("g")
    .data([1e7, 3e7, 5e7])
  .enter().append("g");

  legend.append("circle")
    .attr("cy", function(d) { return -radius(d) - 20; })
    .attr("r", radius);

  legend.append("text")
    .attr("y", function(d) { return -2 * radius(d) - 20; })
    .attr("dy", "1.3em")
    .text(d3.format(".1s"));

  legend.append("text")
    .attr("y", -radius(1e7)+ 5)
    .attr("dy", "1.3em")
    .text("Power Generation");

  legend.append("text")
    .attr("y", -radius(1e7)+ 20)
    .attr("dy", "1.3em")
    .text("in Megawatthours(MWh)");

  colorlist = ["#08519c","#636363","#fe9929","#d95f0e","#2b8cbe","#756bb1","#f768a1","#fde0dd","#800026","#31a354","#e31a1c"];
  namelist = ["Biomass","Coal","Natural Gas","Geothermal","Water","Nuclear","Petroleum","Other","Solar","Wind","Otherrenewable"];

  var fuellegend = svg.append("g")
    .attr("class", "fuellegend")
    .attr("transform", "translate(" + (width - 1300) + "," + (height - 200) + ")")
    .selectAll("g")
    .data(colorlist)
    .enter().append("g");

  fuellegend.append("circle")
    .attr("r", 15)
    .attr("cy", -600)
    .attr("cx", function(d,i) {return width/5 + i*80; })
    .style("fill", function(d,i){
          return colorlist[i];
        })
    .style("opacity", 0.75);

  fuellegend.append("text")
    .attr("r", 15)
    .attr("y", -570)
    .attr("x", function(d,i) {return width/5 + i*80; })
    .text(function(d,i){
      return namelist[i];});
  }