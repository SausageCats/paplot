(function () {
  packages = {
    // Lazily construct the package hierarchy from class starts.
    root: function (classes) {
      var map = {};

      function find(start, data) {
        var node = map[start];
        var i;
        if (!node) {
          node = map[start] = data || {
            start: start,
            children: [],
          };
          if (start.length) {
            node.parent = find(start.substring(0, (i = start.lastIndexOf("."))));
            node.parent.children.push(node);
            node.key = start.substring(i + 1);
          }
        }
        return node;
      }

      classes.forEach(function (d) {
        find(d.start, d);
      });

      return map[""];
    },

    // Return a list of ends for the given array of nodes.
    ends: function (nodes, include_idx) {
      var map = {};
      var ends = [];

      // Compute a map from start to node.
      nodes.forEach(function (d) {
        map[d.start] = d;
      });

      // For each import, construct a link from the source to target node.
      if (include_idx) {
        nodes.forEach(function (d) {
          if (d.ends) {
            d.ends.forEach(function (i, idx) {
              ends.push({
                source: map[d.start], // node of Break1
                target: map[i], // node of Break2
                idx: idx, // index of source.ends
              });
            });
          }
        });
      } else {
        nodes.forEach(function (d) {
          if (d.ends) {
            d.ends.forEach(function (i) {
              ends.push({
                source: map[d.start], // node of Break1
                target: map[i], // node of Break2
              });
            });
          }
        });
      }

      return ends;
    },
  };
})();

bundle = (function () {
  var bundle = function (id) {
    this.id = id;

    this.mode = ""; // "thumb" or "detai"
    this.enable_tooltip = false; // tooltip

    this.arc_style = {
      // for arc
      fill: [],
      fill_opacity: 1,
      stroke: [],
      stroke_opacity: 1,

      // for label
      font_family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      font_size: "10px",
      text_color: "#000",
      label: [],
    };
    this.link_style = [];

    // don't touch
    this.svg_obj = 0;
  };

  var p = bundle.prototype;

  // -----------------------------------
  // link style templates
  // -----------------------------------
  p.link_style_template = (function () {
    var link_style_template = function (name) {
      this.stroke = [];
      this.stroke_width = "1px";
      this.stroke_opacity = 1;

      this.active_stroke = "#00F";
      this.active_stroke_width = "3px";
      this.active_stroke_opacity = 1;

      this.name = name;
      this.enable = true;
    };
    return link_style_template;
  })();

  var selected_stroke_color = "rgb(218, 227, 43)";
  var strokes = {};

  p.clear_source_strokes = function (circosnr) {
    if (circosnr in strokes) {
      strokes[circosnr].forEach((v) => {
        restore_stroke(`#path${v[0]}`, this.link_style); // v[0]=ilink
      });
      strokes[circosnr] = [];
      ca_draw.update_viewer(circosnr, true);
    }
  };

  p.get_source_strokes = function (circosnr) {
    if (!(circosnr in strokes)) return [];
    return strokes[circosnr].map((v) => {
      return v.slice();
    });
  };

  p.draw_bundle = function (obj, arc_data, data, options) {
    var bundle = d3.layout.bundle(); // Create a new default bundle layout

    var div = d3
      .select("#" + obj)
      .style("width", options.w + "px")
      .style("height", options.h + "px")
      .style("position", "absolute");

    var svg = div
      .append("svg:svg")
      .attr("width", options.w)
      .attr("height", options.h)
      .append("svg:g")
      .attr("transform", "translate(" + options.rx + "," + options.ry + ")");
    this.svg_obj = svg;

    var cluster = d3.layout
      .cluster() // Create a new default cluster layout
      .size([360, options.ry - options.cluster_size])
      .sort(function (a, b) {
        return d3.ascending(a.key, b.key);
      });

    var nodes = cluster.nodes(packages.root(arc_data));

    var groupData = svg
      .selectAll("g.group")
      .data(
        nodes.filter(function (d) {
          var ret = d.depth == 2 && d.children;
          return ret;
        })
      )
      .enter();

    var groupArc = d3.svg
      .arc()
      .innerRadius(options.ir)
      .outerRadius(options.or)
      .startAngle(function (d) {
        return ((findStartAngle(d.__data__.children) - 0.5) * Math.PI) / 180;
      })
      .endAngle(function (d) {
        return ((findEndAngle(d.__data__.children) + 0) * Math.PI) / 180;
      });

    var arc_style = this.arc_style;
    var link_style = this.link_style;

    // arc
    svg
      .selectAll("g.arc")
      .data(groupData[0])
      .enter()
      .append("svg:path")
      .attr("d", groupArc)
      .attr("class", "groupArc")
      .style("fill", function (d) {
        return key_to_values(arc_style.fill, d.__data__.key);
      })
      .style("fill-opacity", arc_style.fill_opacity)
      .style("stroke", function (d) {
        return key_to_values(arc_style.stroke, d.__data__.key);
      })
      .style("stroke-width", "1px")
      .style("stroke-opacity", arc_style.stroke_opacity);

    // arc-label
    if (arc_style.label.length > 0) {
      svg
        .selectAll("g.arc")
        .data(groupData[0])
        .enter()
        .append("svg:g")
        .attr("class", "groupArcLabel")
        .attr("id", function (d) {
          return "arc-label-" + d.__data__.key;
        })
        .attr("transform", function (d) {
          var ret = "rotate(" + (d.__data__.x - 90) + ")translate(" + (d.__data__.y + options.label_t) + ")";
          return ret;
        })

        .append("svg:text")
        .attr("dx", function (d) {
          //return d.__data__.x < 180 ? 25 : -25;
          if (d.__data__.x < 180) {
            return 25;
          }
          var text = key_to_values(arc_style.label, d.__data__.key);
          return -25 - text.length * 5;
        })
        .attr("dy", function (d) {
          return ".31em";
        })
        .attr("text-anchor", function (d) {
          //return d.__data__.x < 180 ? "start" : "end";
          return "start";
        })
        .attr("transform", function (d) {
          return d.__data__.x < 180 ? null : "rotate(180)";
        })
        .attr("font-family", arc_style.font_family)
        .attr("text-color", arc_style.font_color)
        .style("font-size", arc_style.font_size)
        .text(function (d) {
          return key_to_values(arc_style.label, d.__data__.key);
        });
    }

    // links
    var line_outer = d3.svg.line
      .radial()
      .interpolate("bundle")
      .tension(0.85)
      .radius(function (d) {
        return d.y;
      })
      .angle(function (d) {
        return (d.x / 180) * Math.PI;
      });

    // If there is nothing to overlay, data is undefined
    if (data === undefined) return;

    var line_inner = d3.svg.line
      .radial()
      .interpolate("bundle")
      .tension(0.2)
      .radius(function (d) {
        return d.y;
      })
      .angle(function (d) {
        return (d.x / 180) * Math.PI;
      });

    var link_data = [];
    var classes = data;

    var enable_tooltip = this.enable_tooltip;

    for (var idx1 = 0; idx1 < link_style.length; idx1++) {
      link_data[idx1] = setLinkData(classes[idx1]);
      //  cluster.nodes: compute the cluster layout and return the array of nodes
      // links contains node information for breakpoints
      var links = packages.ends(cluster.nodes(packages.root(classes[idx1])), options.enable_viewer);
      var splines = bundle(links);

      svg
        .append("g")
        .attr("class", link_style[idx1].name)
        .selectAll("path")
        .data(links)
        .enter()
        .append("path")
        .attr("id", function (d) {
          if (!options.enable_viewer) return null;
          var ilink = d.source.ilinks[d.idx];
          return "path" + ilink;
        })
        .attr("class", link_style[idx1].name)
        .attr("d", function (d, i) {
          var start = d.source.key.split("_")[0];
          var end = d.target.key.split("_")[0];
          if (start == end) return line_inner(splines[i]);
          return line_outer(splines[i]);
        })
        .style("stroke", link_style[idx1].stroke)
        .style("stroke-width", link_style[idx1].stroke_width)
        .style("stroke-opacity", link_style[idx1].stroke_opacity)
        .style("fill", "none")

        .on("click", function (d) {
          if (!options.enable_viewer) return;

          var circosnr = parseInt(obj.replace("map", "")); // circosnr: int
          var ilink = d.source.ilinks[d.idx];

          if (d3.select(this).style("stroke") === selected_stroke_color) {
            // Here, stroke is already selected
            restore_stroke(this, link_style);
            // Remove selected stroke
            for (var i = 0; i < strokes[circosnr].length; i++) {
              if (strokes[circosnr][i][0] === ilink) {
                strokes[circosnr].splice(i, 1);
                break;
              }
            }
          } else {
            // Here, stroke is not selected yet
            d3.select(this).style("stroke", selected_stroke_color);
            if (!strokes[circosnr]) strokes[circosnr] = [];
            strokes[circosnr].push([ilink]); // Push list as it may add some elements in the future
          }

          // Update viewer
          var view_id = `#view${circosnr}`;
          if (d3.select(view_id).style("visibility") === "visible") {
            ca_draw.update_viewer(circosnr, true);
          }
        })

        .on("mouseover", function (d) {
          if (enable_tooltip == false) return;

          var group_id = get_groupid(this, link_style);

          // link style
          if (d3.select(this).style("stroke") !== selected_stroke_color) {
            d3.select(this)
              .style("stroke", link_style[group_id].active_stroke)
              .style("stroke-width", link_style[group_id].active_stroke_width)
              .style("stroke-opacity", link_style[group_id].active_stroke_opacity);
          }

          // remove last tooltip data
          d3.select("#tooltip").selectAll("p").remove();

          // add text to tooltip
          var texts = link_data[group_id];
          var result = getLinkData_values(texts, d.source.start, d.target.start);
          d3.select("#tooltip").append("p").attr("id", "text").append("pre").text("Link detail");
          for (var idx2 = 0; idx2 < result.length; idx2++) {
            d3.select("#tooltip").append("p").attr("id", "text").append("pre").text(result[idx2]);
          }
          // Display tooltip at the frontmost of the screen
          d3.select("#tooltip").style("z-index", 2147483647);
          //Show the tooltip
          d3.select("#tooltip").classed("hidden", false);

          //Get this bar's x/y values, then argument for the tooltip
          var rect = document.getElementById(obj).getBoundingClientRect();
          var xPosition = parseFloat(rect.left) + window.pageXOffset + 10;
          var yPosition = parseFloat(rect.top) + window.pageYOffset + 10;

          //Update the tooltip position and value
          d3.select("#tooltip")
            .style("left", xPosition + "px")
            .style("top", yPosition + "px");
        })
        .on("mouseout", function () {
          if (enable_tooltip == false) return;
          // link style
          if (d3.select(this).style("stroke") !== selected_stroke_color) {
            restore_stroke(this, link_style);
          }
          //Hide the tooltip
          d3.select("#tooltip").classed("hidden", true);
        });
    }

    bundle_update();
  };

  p.bundle_update = function () {
    var link_style = this.link_style;
    for (var idx = 0; idx < link_style.length; idx++) {
      this.svg_obj
        .select("g." + link_style[idx].name)
        .selectAll("path")
        .style("stroke-width", function () {
          if (link_style[idx].enable == true) return link_style[idx].stroke_width;
          return 0;
        });
    }
  };

  function findStartAngle(children) {
    var min = children[0].x;
    children.forEach(function (d) {
      if (d.x < min) min = d.x;
    });
    return min;
  }

  function findEndAngle(children) {
    var max = children[0].x;
    children.forEach(function (d) {
      if (d.x > max) max = d.x;
    });
    return max;
  }
  function key_to_values(list, key) {
    return list[Number(key)];
  }

  // Returns the tooltip information as an array
  function getLinkData_values(data, source_start, target_start) {
    // data        : object
    // source_start: string: Start position of breakpoint node
    // target_start: string: End position of breakpoint node
    var ret = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i].start == source_start) {
        for (var j = 0; j < data[i].ends.length; j++) {
          if (data[i].ends[j] == target_start) {
            ret.push(data[i].tooltip[j]);
          }
        }
        break;
      }
    }
    // Swap the start and end positions
    for (var i = 0; i < data.length; i++) {
      if (data[i].start == target_start) {
        for (var j = 0; j < data[i].ends.length; j++) {
          if (data[i].ends[j] == source_start) {
            ret.push(data[i].tooltip[j]);
          }
        }
        break;
      }
    }

    return ret;
  }

  function setLinkData(classes) {
    var data = [];

    for (var i = 0; i < classes.length; i++) {
      if (classes[i].tooltip.length == 0) {
        continue;
      }
      data.push(classes[i]);
    }

    return data;
  }

  // -----------------------------------
  // over-ride
  // -----------------------------------
  p.bar_selected = function (key, on) {
    console.log("base function, please over-ride.");
  };

  // -----------------------------------
  // utility
  // -----------------------------------
  function get_groupid(elm, link_style) {
    var group_id = -1;
    for (var k = 0; k < link_style.length; k++) {
      if (d3.select(elm).classed(link_style[k].name) == true) {
        group_id = k;
        break;
      }
    }
    return group_id;
  }

  function restore_stroke(id, link_style) {
    var group_id = get_groupid(id, link_style);
    d3.select(id)
      .style("stroke", link_style[group_id].stroke)
      .style("stroke-width", link_style[group_id].stroke_width)
      .style("stroke-opacity", link_style[group_id].stroke_opacity);
  }

  return bundle;
})();
