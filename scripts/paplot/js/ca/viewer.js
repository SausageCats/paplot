(function () {
  viewer = {};

  var _bp_nodes_cps;
  var _bp_startend = [];
  var _bp_start = [];
  var _bp_end = [];

  // -----------------------------------------------------------------------------
  // Resizer
  // -----------------------------------------------------------------------------

  // Resize viewer window when selecting vertical line
  viewer.resize_vline = function (e, id) {
    var win_id = `#float${id}`;
    var view_id = `#view${id}`;
    var vline_id = `#view_vline${id}`;
    fwin.resize_vline(e, win_id, view_id, vline_id);
  };

  // -----------------------------------------------------------------------------
  // Buttons
  // -----------------------------------------------------------------------------

  // Clear data in viewer
  viewer.clear = function (circosnr) {
    ca_draw.get_bundle(ca_data.index_ID[circosnr]).clear_source_strokes(circosnr);
  };

  // Save data in viewer
  viewer.extract = function (circosnr) {
    var cbs = get_checked_boxes(circosnr);
    if (cbs.length === 0) {
      extr.open(circosnr);
      return;
    }
    cbs.forEach((v) => {
      function get_label(chr) {
        var label;
        for (var i = 0; i < ca_data.genome_size.length; i++) {
          if (ca_data.genome_size[i].chr === chr) {
            label = ca_data.genome_size[i].label;
            break;
          }
        }
        return label;
      }
      var id = `#${v.id}`;
      var ilink = d3.select(id)[0][0].dataset.ilink;
      var ca = ca_data.links[ilink];
      var label1 = get_label(ca[1]);
      var label2 = get_label(ca[3]);
      extr.extract(circosnr, [label1, ca[2], ca[2], label2, ca[4], ca[4]]);
    });
  };

  viewer.uncheck = function (circosnr) {
    get_checked_boxes(circosnr).forEach((v) => {
      if (v.checked) v.checked = false;
    });
  };

  function get_checked_boxes(circosnr) {
    var ids = [
      `#view${circosnr}_data_source ul li label input`, //
      `#view${circosnr}_data_target ul li label input`, //
    ];
    var cbs = [];
    ids.forEach((id) => {
      d3.selectAll(id)[0].forEach((v) => {
        if (v.checked) cbs.push(v);
      });
    });
    return cbs;
  }

  // Save data in viewer
  viewer.save = function (circosnr, source_or_target) {
    var data_id = `#view${circosnr}_data_${source_or_target === "source" ? "source" : "target"}`;
    ca_utils.btn_save(data_id, "data.txt");
  };

  // -----------------------------------------------------------------------------
  // Extractions
  // -----------------------------------------------------------------------------

  viewer.change_extract = function (circosnr) {
    update(circosnr);
  };

  // Extract and display the data corresponding to a selected stroke
  viewer.update = function (circosnr, do_update = false) {
    var view_id = `#view${circosnr}`;
    var vline_id = `#view_vline${circosnr}`;

    // Close view window if it is already open
    if (!do_update && d3.select(view_id).style("visibility") !== "hidden") {
      d3.select(view_id).style("visibility", "hidden");
      d3.select(vline_id).style("visibility", "hidden");
      return;
    }

    // Main
    update(circosnr);

    // Show view window
    d3.select(view_id).style("visibility", "visible");
    d3.select(vline_id).style("visibility", "visible");
  };

  function update(circosnr) {
    // strokes     : [sequence number][selected ilinks]
    // base_ilinks : [sequence number][source ilinks based on selected ilinks]
    // ilink2ilinks: [circosnr]{"source ilink": [target ilinks]}
    var view_mode = d3.select(`#view_mode${circosnr}`)[0][0].value;
    var strokes = get_source_strokes(circosnr, true);
    var ilink2ilinks, base_ilinks;
    if (view_mode === "startend") {
      ilink2ilinks = create_bp_startend(circosnr);
      base_ilinks = get_source_ilinks(circosnr, strokes, true);
    } else if (view_mode === "start") {
      ilink2ilinks = create_bp_start(circosnr);
      base_ilinks = get_source_ilinks(circosnr, strokes);
    } else if (view_mode === "end") {
      ilink2ilinks = create_bp_end(circosnr);
      base_ilinks = get_source_ilinks(circosnr, strokes);
    }

    // Create source and target ilinks
    ilink2ilinks = ilink2ilinks[circosnr];
    var src_title = ca_data.index_ID[circosnr];
    var src_saved = []; // to eliminate duplicate ilinks
    var tgt_saved = []; // to eliminate duplicate ilinks
    var src_ilinks = []; // [sequence number][source ilinks]
    var tgt_ilinks = []; // [sequence number][target ilinks]
    base_ilinks.reverse().forEach((v, i) => {
      src_ilinks.push([]);
      tgt_ilinks.push([]);
      v.forEach((vv) => {
        ilink2ilinks[vv].forEach((vvv) => {
          // source area ----------------------------
          if (ca_data.links[vvv][0] === src_title) {
            if (!src_saved.includes(vvv)) {
              src_ilinks[i].push(vvv); // push ilink
              src_saved.push(vvv);
            }
          }
          // target area ----------------------------
          if (!tgt_saved.includes(vvv)) {
            tgt_ilinks[i].push(vvv); // push ilink
            tgt_saved.push(vvv);
          }
          // ----------------------------------------
        });
      });
    });
    src_ilinks.reverse();
    tgt_ilinks.reverse();

    //console.log("============================================");
    //console.log("strokes          : ", JSON.stringify(strokes));
    //console.log("base_ilinks      : ", JSON.stringify(base_ilinks));
    //console.log("src_ilinks       : ", JSON.stringify(src_ilinks));
    //console.log("tgt_ilinks       : ", JSON.stringify(tgt_ilinks));
    //console.log("src_ilinks.reduce: ", src_ilinks.reduce((s, v) => { return s + v.length; }, 0));
    //console.log("tgt_ilinks.reduce: ", tgt_ilinks.reduce((s, v) => { return s + v.length; }, 0));
    //console.log("============================================");

    // View source data
    var data_id = `#view${circosnr}_data_source`;
    var [data, items] = get_view_contents(circosnr, src_ilinks, tgt_ilinks, "source");
    view_extracted_data(data_id, data, items);

    // View target data
    data_id = `#view${circosnr}_data_target`;
    [data, items] = get_view_contents(circosnr, src_ilinks, tgt_ilinks, "target");
    view_extracted_data(data_id, data, items);
  }

  function get_source_strokes(circosnr, reverse = false) {
    var title = ca_data.index_ID[circosnr];
    var strokes = ca_draw.get_bundle(title).get_source_strokes(circosnr); // strokes: [[ilink], ...]
    if (reverse) strokes.reverse();
    return strokes;
  }

  // Find the same start and end nodes in the current circosplot
  function get_source_ilinks(circosnr, strokes, is_one_ilink = false) {
    // Get first ilink for each stroke
    if (is_one_ilink) {
      return strokes.map((v) => {
        return [v[0]];
      });
    }

    // For each stroke, get all ilinks from the current circosplot
    var ilink2ilinks = create_bp_startend(circosnr)[circosnr];
    var src_title = ca_data.index_ID[circosnr];
    var src_ilinks = [];
    strokes.forEach((v, i) => {
      src_ilinks.push([]);
      ilink2ilinks[v[0]].forEach((vv) => {
        // Only accept current circosplot
        if (ca_data.links[vv][0] === src_title) {
          src_ilinks[i].push(vv); // push ilink
        }
      });
    });
    return src_ilinks;
  }

  // Create data to display in view
  function get_view_contents(circosnr, src_ilinks, tgt_ilinks, source_or_target) {
    var is_src_area = source_or_target === "source" ? true : false;

    // FIXME: strokes, base_ilinks_***, tmp_idxes, tgt_hrows, and com_nodes
    //      : return the same result regardless of source_or_target

    // Base ilinks
    var strokes = get_source_strokes(circosnr, true);
    var base_ilinks_one = get_source_ilinks(circosnr, strokes, true);
    var base_ilinks_all = get_source_ilinks(circosnr, strokes);

    // Focused ilinks
    var focus_ilinks = is_src_area ? src_ilinks : tgt_ilinks;
    var focus_len = focus_ilinks.reduce((sum, v) => {
      return sum + v.length;
    }, 0);

    // Find same data between source and target areas
    function cal_idxes(src, tgt) {
      var idx;
      var com_idx = 0; // Index of comment line
      var res = [com_idx]; // Push the first index of comment line
      src.forEach((v, i) => {
        v.forEach((vv) => {
          idx = tgt[i].indexOf(vv);
          res.push(com_idx + idx + 1); // Push the index of data line
        });
        com_idx += tgt[i].length + 1; // +1 corresponds to comment line
        res.push(com_idx); // Push the index of next comment line
      });
      res.pop(); // Remove the extra index of comment line
      return res;
    }
    var tmp_idxes = cal_idxes(src_ilinks, tgt_ilinks);
    var unfoc_idxes; // indexes of unfocused area
    if (is_src_area) unfoc_idxes = tmp_idxes;
    else {
      unfoc_idxes = new Array(focus_len + tgt_ilinks.length).fill(-1); // tgt_ilinks.length is the number of comment lines
      tmp_idxes.forEach((v, i) => {
        unfoc_idxes[v] = i;
      });
    }

    // For auto scroll
    // tgt_hrows: maps row in source area to height of row in target area
    // src_hrows: maps row in target area to height of row in source area
    var tgt_hrows = [];
    var it = 0; // Index of target
    for (var i = 0; i < src_ilinks.length; i++) {
      // Comment line
      tgt_hrows.push(it);
      // Data line
      var ns = src_ilinks[i].length;
      var nt = tgt_ilinks[i].length;
      for (var j = 0; j < ns; j++) {
        tgt_hrows.push(it + ((j + 1) * nt) / ns);
        //tgt_hrows.push(it + Math.floor(((j + 1) * nt) / ns));
      }
      it += nt + 1;
    }
    var src_hrows = [];
    if (!is_src_area && tgt_hrows.length > 0) {
      // First comment line
      src_hrows.push(0);
      // After second line
      for (var i = 0; i < tgt_hrows.length - 1; i++) {
        for (var j = 0; j < tgt_hrows[i + 1] - tgt_hrows[i]; j++) {
          src_hrows.push(i + 1);
        }
      }
      // Remaining lines
      for (var i = 0; i < focus_len - src_hrows.length; i++) {
        src_hrows.push(tgt_hrows.length - 1);
      }
    }
    var hrows = is_src_area ? tgt_hrows : src_hrows;

    // Create comment lines
    var com_lines = [];
    //var com_nodes = [];
    for (var i = 0; i < focus_ilinks.length; i++) {
      var ilink = base_ilinks_one[i][0];
      var ca = ca_data.links[ilink];
      var ch1 = parseInt(ca[1]);
      var ch2 = parseInt(ca[3]);
      var bp1 = ca[2];
      var bp2 = ca[4];
      if (ch1 > ch2 || (ch1 == ch2 && bp1 > bp2)) [ch1, ch2, bp1, bp2] = [ch2, ch1, bp2, bp1];
      var la1 = ca_data.genome_size[ch1].label;
      var la2 = ca_data.genome_size[ch2].label;
      com_lines.push(`${la1}(${bp1}) -> ${la2}(${bp2}) [${focus_ilinks[i].length}/${focus_len}]`);
      //com_nodes.push({ title: ca[0], chr1: ca[1], bp1: ca[2], chr2: ca[3], bp2: ca[4] });
    }

    // Create data
    var idx_data = 0;
    var data = [];
    var items = [];
    var s_or_t = is_src_area ? "s" : "t";
    focus_ilinks.forEach((v, i) => {
      var ilink_org = strokes[i][0];
      var id_group = `${circosnr}_${i}`;
      // comment -----------------------
      data.push(com_lines[i]);
      items.push({
        is_comment: true,
        is_src_area: is_src_area,
        circosnr: circosnr,
        id_group: id_group,
        id_one: `${circosnr}${s_or_t}${idx_data}`,
        ilink_cur: -1,
        ilink_src: -1,
        ilink_org: ilink_org,
        unfoc_idx: unfoc_idxes[idx_data],
        hrow: hrows[idx_data],
        //node: com_nodes[i],
      });
      idx_data += 1;
      // data --------------------------
      v.forEach((w) => {
        var ca = ca_data.links[w];
        data.push(`${ca[0]}__${String(parseInt(ca[1]) + 1)}__${String(ca[2])}__${String(parseInt(ca[3]) + 1)}__${String(ca[4])}`);
        //var node = { title: ca[0], chr1: ca[1], bp1: ca[2], chr2: ca[3], bp2: ca[4] };
        var idx = src_ilinks[i].indexOf(w);
        var found = base_ilinks_all[i].includes(w);
        items.push({
          is_comment: false,
          is_src_area: is_src_area,
          circosnr: circosnr,
          id_group: id_group,
          id_one: `${circosnr}${s_or_t}${idx_data}`,
          ilink_cur: w,
          ilink_src: idx !== -1 && !found ? src_ilinks[i][idx] : -1,
          ilink_org: ilink_org,
          unfoc_idx: unfoc_idxes[idx_data],
          hrow: hrows[idx_data],
          //node: node,
        });
        idx_data += 1;
      });
      // -------------------------------
    });

    return [data, items];
  }

  function view_extracted_data(data_id, data, items) {
    d3.select(data_id + " ul").remove();
    d3.select(data_id)
      .append("ul")
      .selectAll(data_id + " ul li")
      .data(data)
      .enter()
      .append("li")
      .attr("id", function (d, foc_idx) {
        return `view_data${items[foc_idx].id_one}`;
      })
      .attr("class", function (d, foc_idx) {
        var item = items[foc_idx];
        if (item.is_comment) {
          return `view_data${item.id_group} view_comment`; // view_comment is defined in ../layout/ca.css
        } else {
          return `view_data${item.id_group}`;
        }
      })

      .on("mouseover", function (d, foc_idx) {
        var item = items[foc_idx];
        var circosnr = item.circosnr;
        var src_has_d = item.unfoc_idx !== -1 ? true : false; // Source area has data(d)
        var id;

        // Clone stroke
        function change_stroke_color(ilink, color, width) {
          var node = d3.select(`#path${ilink}`).node();
          var clone = d3.select(node.parentNode.parentNode.insertBefore(node.cloneNode(true), null));
          d3.select(clone)[0][0].attr("class", `clone_path${circosnr}`).style("stroke", color).style("stroke-width", width);
        }
        if (item.ilink_src !== -1) {
          change_stroke_color(item.ilink_org, "#00f", "4px"); // Blue
          change_stroke_color(item.ilink_src, "#f00", "4px"); // Red
        } else if (src_has_d) {
          change_stroke_color(item.ilink_org, "#f00", "4px"); // Red
        } else {
          change_stroke_color(item.ilink_org, "#00f", "4px"); // Blue
        }

        // Auto scroll
        if (d3.select(`#view_autoscroll${circosnr}`)[0][0].checked) {
          id = item.is_src_area ? `view${circosnr}_data_target` : `view${circosnr}_data_source`;
          var scroll = Math.max(0, (item.hrow + 1) * 20 - 100); // 100 is height of area. see ../layout/ca.css
          document.getElementById(id).scrollTop = scroll;
        }

        // Change background color of view data
        id = item.is_src_area ? `#view${circosnr}_data_source` : `#view${circosnr}_data_target`;
        var width = d3.select(id)[0][0].scrollWidth;
        d3.selectAll(`.view_data${item.id_group}`).style("background-color", "#e1d5d5").style("width", width); // gray and red
        if (!src_has_d) {
          //d3.select(`#view_data${item.id_one}`).style("background-color", "#bac8ff").style("width", width); // Light blue
          d3.select(`#view_data${item.id_one}`).style("background-color", "#ffcc7e").style("width", width); // Light orange
        } else {
          //var color = "#7fd3a4" // Light green
          var color = "#f0a6a6"; // Light Red
          d3.select(`#view_data${item.id_one}`).style("background-color", color);
          var s_or_t = item.is_src_area ? "t" : "s";
          id = `${circosnr}${s_or_t}${item.unfoc_idx}`;
          d3.select(`#view_data${id}`).style("background-color", color);
        }
      })

      .on("mouseout", function (d, foc_idx) {
        var item = items[foc_idx];
        // Remove cloned strokes
        d3.selectAll(`.clone_path${item.circosnr}`).remove();
        // Remove background color
        d3.selectAll(`.view_data${item.id_group}`).style("background-color", null);
      })

      .append("label")
      .append("input")
      .attr("type", "checkbox")
      .attr("id", function (d, foc_idx) {
        var item = items[foc_idx];
        if (item.is_comment) {
          d3.select(this).remove(); // remove input tag
          return;
        }
        return `view_cb${item.id_one}`;
      })
      .attr("data-ilink", function (d, foc_idx) {
        var item = items[foc_idx];
        if (item.is_comment) return;
        return item.ilink_cur;
      });

    d3.selectAll(data_id + " ul li label")
      .data(data)
      .append("text")
      .text(function (d) {
        return d;
      });
  }

  // -----------------------------------------------------------------------------
  // Mappings
  // -----------------------------------------------------------------------------

  function create_bp_nodes_cps() {
    if (_bp_nodes_cps !== undefined) return _bp_nodes_cps;
    // Create a list of nodes with breakpoints in each circosplot
    _bp_nodes_cps = [];
    for (var i = 0; i < ca_data.index_ID.length; i++) {
      var id = ca_data.index_ID[i];
      var d = ca_data.get_data_detail(id);
      _bp_nodes_cps[i] = [];
      for (var j = 0; j < d.length; j++) /* Loop by group */ {
        for (var k = 0; k < d[j].length; k++) /* Loop by node */ {
          if (d[j][k].ends.length !== 0) {
            _bp_nodes_cps[i].push({ start: d[j][k].start, ends: d[j][k].ends, ilinks: d[j][k].ilinks });
          }
        }
      }
    }
    return _bp_nodes_cps;
  }

  // Find breakpoints with the same start and end points in all circosplots
  function create_bp_startend(circosnr) {
    if (_bp_startend[circosnr] !== undefined) return _bp_startend;
    var bp_nodes_cps = create_bp_nodes_cps();
    var i = circosnr;
    var j, k, l, m, n;
    var ilink, t_bp_nodes;
    var bp_nodes = bp_nodes_cps[i];
    _bp_startend[i] = {};
    for (j = 0; j < bp_nodes.length; j++) /* Loop by node */ {
      for (k = 0; k < bp_nodes[j].ends.length; k++) /* Loop by bp */ {
        ilink = bp_nodes[j].ilinks[k];
        _bp_startend[i][ilink] = [];
        for (l = 0; l < bp_nodes_cps.length; l++) /* Loop by circosplot */ {
          t_bp_nodes = bp_nodes_cps[l];
          for (m = 0; m < t_bp_nodes.length; m++) /* Loop by node */ {
            for (n = 0; n < t_bp_nodes[m].ends.length; n++) /* Loop by bp */ {
              if (
                (bp_nodes[j].start === t_bp_nodes[m].start && bp_nodes[j].ends[k] === t_bp_nodes[m].ends[n]) ||
                (bp_nodes[j].start === t_bp_nodes[m].ends[n] && bp_nodes[j].ends[k] === t_bp_nodes[m].start)
              ) {
                _bp_startend[i][ilink].push(t_bp_nodes[m].ilinks[n]); // Found
              }
            }
          }
        }
        _bp_startend[i][ilink].sort((a, b) => {
          return a - b;
        });
      }
    }
    return _bp_startend;
  }

  // Find breakpoints with the same start point in all circosplots
  function create_bp_start(circosnr) {
    if (_bp_start[circosnr] !== undefined) return _bp_start;
    var bp_nodes_cps = create_bp_nodes_cps();
    var i = circosnr;
    var j, k, l, m, n;
    var ilink, target;
    var start, chr_s, node_s, end, chr_e, node_e, t_bp_nodes;
    var bp_nodes = bp_nodes_cps[i];
    _bp_start[i] = {};
    for (j = 0; j < bp_nodes.length; j++) /* Loop by node */ {
      start = bp_nodes[j].start;
      [chr_s, node_s] = start.split("_");
      for (k = 0; k < bp_nodes[j].ends.length; k++) /* Loop by bp */ {
        // --- Determine target
        end = bp_nodes[j].ends[k];
        [chr_e, node_e] = end.split("_");
        if (chr_e < chr_s || (chr_e == chr_s && node_e < node_s)) target = end;
        else target = start;
        // ---
        ilink = bp_nodes[j].ilinks[k];
        _bp_start[i][ilink] = [];
        for (l = 0; l < bp_nodes_cps.length; l++) /* Loop by circosplot */ {
          t_bp_nodes = bp_nodes_cps[l];
          for (m = 0; m < t_bp_nodes.length; m++) /* Loop by node */ {
            for (n = 0; n < t_bp_nodes[m].ends.length; n++) /* Loop by bp */ {
              if (t_bp_nodes[m].start === target || t_bp_nodes[m].ends[n] === target) {
                _bp_start[i][ilink].push(t_bp_nodes[m].ilinks[n]); // Found
              }
            }
          }
        }
        _bp_start[i][ilink].sort((a, b) => {
          return a - b;
        });
      }
    }
    return _bp_start;
  }

  // Find breakpoints with the same end point in all circosplots
  function create_bp_end(circosnr) {
    if (_bp_end[circosnr] !== undefined) return _bp_end;
    var bp_nodes_cps = create_bp_nodes_cps();
    var i = circosnr;
    var j, k, l, m, n;
    var ilink, target;
    var start, chr_s, node_s, end, chr_e, node_e, t_bp_nodes;
    var bp_nodes = bp_nodes_cps[i];
    _bp_end[i] = {};
    for (j = 0; j < bp_nodes.length; j++) /* Loop by node */ {
      start = bp_nodes[j].start;
      [chr_s, node_s] = start.split("_");
      for (k = 0; k < bp_nodes[j].ends.length; k++) /* Loop by bp */ {
        // --- Determine target
        end = bp_nodes[j].ends[k];
        [chr_e, node_e] = end.split("_");
        if (chr_e < chr_s || (chr_e == chr_s && node_e < node_s)) target = start;
        else target = end;
        // ---
        ilink = bp_nodes[j].ilinks[k];
        _bp_end[i][ilink] = [];
        for (l = 0; l < bp_nodes_cps.length; l++) /* Loop by circosplot */ {
          t_bp_nodes = bp_nodes_cps[l];
          for (m = 0; m < t_bp_nodes.length; m++) /* Loop by node */ {
            for (n = 0; n < t_bp_nodes[m].ends.length; n++) /* Loop by bp */ {
              if (t_bp_nodes[m].start === target || t_bp_nodes[m].ends[n] === target) {
                _bp_end[i][ilink].push(t_bp_nodes[m].ilinks[n]); // Found
              }
            }
          }
        }
        _bp_end[i][ilink].sort((a, b) => {
          return a - b;
        });
      }
    }
    return _bp_end;
  }

  //console.log("============================================");
  //let time0 = Date.now();
  //create_bp_nodes_cps();
  //let time1 = Date.now(); for (var i = 0; i < _bp_nodes_cps.length; i++) create_bp_startend(i);
  //let time2 = Date.now(); for (var i = 0; i < _bp_nodes_cps.length; i++) create_bp_start(i);
  //let time3 = Date.now(); for (var i = 0; i < _bp_nodes_cps.length; i++) create_bp_end(i);
  //let time4 = Date.now();
  //console.log("[time] _bp_nodes_cps", time1 - time0);
  //console.log("[time] _bp_startend", time2 - time1);
  //console.log("[time] _bp_start", time3 - time2);
  //console.log("[time] _bp_end", time4 - time3);
  //console.log("[data] _bp_nodes_cps", _bp_nodes_cps);
  //console.log("[data] _bp_startend", _bp_startend);
  //console.log("[data] _bp_start", _bp_start);
  //console.log("[data] _bp_end", _bp_end);
  //console.log("============================================");
})();
