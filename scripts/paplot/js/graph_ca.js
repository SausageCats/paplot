(function () {
  ca_draw = {};

  // -----------------------------------------------------------------------------
  // selection bar plot
  // -----------------------------------------------------------------------------

  // select items
  var bar_dataset = [];
  var group_enable = [];
  var div_select_bar = new mut_bar("selector");
  var div_legend = new legend();

  ca_draw.update_div = function () {
    d3.select("#selector").style("width", window.innerWidth - 200 + "px");
    d3.select("#selector").style("height", "180px");
  };

  // *********************************************
  // save image
  // *********************************************
  ca_draw.push_export = function () {
    var svgText = "";

    // thumb's size
    var thumb_margin_top,
      thumb_margin_bottom,
      thumb_margin_left,
      thumb_margin_right,
      thumb_width,
      thumb_height,
      thumb_title_height,
      thumb_title_fontsize;

    for (var i1 in ca_data.index_ID) {
      if (d3.select("#thumb" + i1 + "_li").classed("hidden") == true) {
        continue;
      }
      thumb_margin_top = Number(
        d3
          .select("#thumb" + i1 + "_li")
          .style("margin-top")
          .replace("px", "")
      );
      thumb_margin_bottom = Number(
        d3
          .select("#thumb" + i1 + "_li")
          .style("margin-bottom")
          .replace("px", "")
      );
      thumb_margin_left = Number(
        d3
          .select("#thumb" + i1 + "_li")
          .style("margin-left")
          .replace("px", "")
      );
      thumb_margin_right = Number(
        d3
          .select("#thumb" + i1 + "_li")
          .style("margin-right")
          .replace("px", "")
      );
      thumb_width = Number(
        d3
          .select("#thumb" + i1 + "_li")
          .style("width")
          .replace("px", "")
      );
      thumb_height = Number(
        d3
          .select("#thumb" + i1 + "_li")
          .style("height")
          .replace("px", "")
      );
      thumb_title_height = thumb_height - thumb_width;
      thumb_title_fontsize = Number(
        d3
          .select("#thumb" + i1 + "_li")
          .style("font-size")
          .replace("px", "")
      );
      if (thumb_title_height < thumb_title_fontsize) {
        thumb_title_height = thumb_title_fontsize;
      }
      break;
    }

    // legend
    div_legend.draw_svg(false);
    svgText += downloader.svg_text("legend_svg", 0, 0);

    var legend_width = Number(d3.select("#legend_svg").select("svg").style("width").replace("px", ""));
    var legend_height = Number(d3.select("#legend_svg").select("svg").style("height").replace("px", ""));

    // selector
    svgText += downloader.svg_text("selector", 0, legend_height);

    var selector_width = Number(d3.select("#selector").select("svg").style("width").replace("px", ""));
    selector_width += 50;

    var selector_height = Number(d3.select("#selector").select("svg").style("height").replace("px", ""));
    selector_height += 10;

    // width
    var width = selector_width;
    if (width < legend_width) {
      width = legend_width;
    }

    // thumbs
    var sift_x = 40 + thumb_margin_left;
    var sift_y = legend_height + selector_height + thumb_margin_top;

    var thumbs_counter = 0;

    for (var i2 in ca_data.index_ID) {
      if (d3.select("#thumb" + i2 + "_li").classed("hidden") == true) {
        continue;
      }
      thumbs_counter += 1;

      // bg-color
      var bg = d3.select("#thumb" + i2).style("background-color");
      if (bg != "rgb(255, 255, 255)") {
        svgText += downloader.virtual_svg_rect(bg, "1.0", thumb_height, thumb_width, sift_x, sift_y);
      }

      //title
      svgText += downloader.virtual_svg_text(
        ca_data.index_ID[i2],
        thumb_title_height,
        thumb_width,
        sift_x,
        sift_y,
        thumb_title_fontsize,
        true
      );

      // bundle
      svgText += downloader.svg_text("thumb" + i2, sift_x, sift_y + thumb_title_height);

      sift_x += thumb_width + thumb_margin_right;

      if (sift_x + thumb_margin_left + thumb_width + thumb_margin_right > width) {
        sift_x = 40 + thumb_margin_left;
        sift_y += thumb_height + thumb_margin_bottom + thumb_margin_top;
      } else {
        sift_x += thumb_margin_left;
      }
    }

    // height
    var thumb_cols_num = Math.floor(width / (thumb_width + thumb_margin_left + thumb_margin_right));
    var thumb_rows_num = Math.ceil(thumbs_counter / thumb_cols_num);
    var height = legend_height + selector_height + (thumb_margin_top + thumb_height + thumb_margin_bottom) * thumb_rows_num;

    svgText = downloader.add_svgtag(svgText, height, width);

    var rect = utils.absolute_position("dw_btn");
    downloader.createMenu([rect.x + rect.width, rect.y], "btn", "paplot_sv", width, height, svgText);
  };

  div_legend.stack_change = function (d, i, on) {
    group_enable[i] = on;
    for (var idx = 0; idx < group_enable.length; idx++) {
      div_select_bar.dataset[idx].enable = group_enable[idx];
    }
    div_select_bar.change_stack();

    ca_draw.thumb_reset();
    bundle_update();
  };

  ca_draw.draw_select = function () {
    ca_draw.update_div();
    bar_dataset = ca_data.get_select();

    var chromos = [];
    var chromos_grid = [];
    for (var i1 = 0; i1 < bar_dataset.all_key.length; i1++) {
      var split = bar_dataset.all_key[i1].split("_");
      var pos = Number(split[1]);

      if (pos == 0) {
        chromos[i1] = ca_data.genome_size[Number(split[0].split(".")[1])].label;
      } else {
        chromos[i1] = "";
      }

      if (pos != 0 && pos % Math.floor(bar_dataset.all_key.length / 60) == 0) {
        chromos_grid[i1] = ca_data.genome_size[Number(split[0].split(".")[1])].label;
      } else {
        chromos_grid[i1] = "";
      }
    }

    for (var i2 = 0; i2 < bar_dataset.value.length; i2++) {
      div_select_bar.dataset[i2] = new div_select_bar.dataset_template(ca_data.group[i2].name);
      div_select_bar.dataset[i2].data = bar_dataset.value[i2];
      div_select_bar.dataset[i2].keys = bar_dataset.key[i2];
      div_select_bar.dataset[i2].color_fill = ca_data.group[i2].color;
      div_select_bar.dataset[i2].enable = true;
      group_enable[i2] = true;
    }

    div_select_bar.keys = bar_dataset.all_key;
    div_select_bar.tags[0] = new div_select_bar.tag_template("pos");
    div_select_bar.tags[0].values = bar_dataset.all_key;
    div_select_bar.tags[0].note = "fix";

    div_select_bar.options.resizeable_w = true;
    div_select_bar.options.resizeable_h = false;
    div_select_bar.options.tooltip.enable = false;
    div_select_bar.options.multi_select = false;
    div_select_bar.options.padding_left = 1;
    div_select_bar.options.padding_right = 1;
    div_select_bar.options.padding_top = 10;
    div_select_bar.options.padding_bottom = 1;
    div_select_bar.options.direction_x = "left-right";
    div_select_bar.options.direction_y = "bottom-up";
    div_select_bar.options.brush.enable = true;
    div_select_bar.options.brushend.enable = true; // Event for mouseup on bar graph

    div_select_bar.options.grid_y = new div_select_bar.grid_template();
    div_select_bar.options.grid_y.ticks = 2;
    div_select_bar.options.grid_y.wide = 0;
    div_select_bar.options.grid_y.border_color = style_sv_bar.border_y_color;
    div_select_bar.options.grid_y.border_opacity = style_sv_bar.border_y_opacity;
    div_select_bar.options.grid_y.orient = "left";

    div_select_bar.options.grid_xs[0] = new div_select_bar.grid_template();
    div_select_bar.options.grid_xs[0].keys = bar_dataset.all_key;
    div_select_bar.options.grid_xs[0].labels = chromos_grid;
    div_select_bar.options.grid_xs[0].wide = 0;
    div_select_bar.options.grid_xs[0].border_color = style_sv_bar.border_x_main_color;
    div_select_bar.options.grid_xs[0].border_width = style_sv_bar.border_x_main_width;

    div_select_bar.options.grid_xs[1] = new div_select_bar.grid_template();
    div_select_bar.options.grid_xs[1].keys = bar_dataset.all_key;
    div_select_bar.options.grid_xs[1].labels = chromos;
    div_select_bar.options.grid_xs[1].wide = 40;
    div_select_bar.options.grid_xs[1].font_size = style_sv_bar.axis_x_font_size;
    div_select_bar.options.grid_xs[1].sift_y = 10;
    div_select_bar.options.grid_xs[1].border_color = style_sv_bar.border_x_sub_color;
    div_select_bar.options.grid_xs[1].border_width = style_sv_bar.border_x_sub_width;
    div_select_bar.options.grid_xs[1].orient = "bottom";
    div_select_bar.options.grid_xs[1].text_anchor_ext = true;
    div_select_bar.options.grid_xs[1].text_anchor = "middle";
    div_select_bar.options.grid_xs[1].text_rotate = "0";

    div_select_bar.options.titles[0] = new div_select_bar.title_template(style_sv_bar.title_y);
    div_select_bar.options.titles[0].orient = "left";
    div_select_bar.options.titles[0].wide = 40;
    div_select_bar.options.titles[0].text_anchor = "middle";
    div_select_bar.options.titles[0].text_rotate = -90;
    div_select_bar.options.titles[0].font_size = style_sv_bar.title_y_font_size; //"12px";

    div_select_bar.options.titles[1] = new div_select_bar.title_template(
      style_sv_bar.title_x + " (" + ca_data.node_size_select.toLocaleString() + " [bps])"
    );
    div_select_bar.options.titles[1].orient = "bottom";
    div_select_bar.options.titles[1].wide = 10;
    div_select_bar.options.titles[1].text_anchor = "left";
    div_select_bar.options.titles[1].text_rotate = 0;
    div_select_bar.options.titles[1].font_size = style_sv_bar.title_x_font_size; //"14px";

    div_select_bar.draw();
    div_select_bar.sort(["pos"], [true]);

    downloader.set_event_listner("selector");

    // legend
    var scale_domain = [];
    var scale_color = [];
    var max_length = 0;
    for (var i3 = 0; i3 < ca_data.group.length; i3++) {
      scale_domain.push(ca_data.group[i3].label);
      scale_color.push(ca_data.group[i3].color);
      if (ca_data.group[i3].label.length > max_length) max_length = ca_data.group[i3].label.length;
    }

    // legend
    div_legend.items = scale_domain;
    div_legend.colors = scale_color;

    div_legend.options.title = style_sv_bar.legend_title;
    div_legend.layout.shape_sift_left = 30;
    div_legend.layout.title_font_size = Number(style_sv_bar.legend_title_font_size.replace("px", ""));
    div_legend.layout.text_font_size = Number(style_sv_bar.legend_text_font_size.replace("px", ""));

    div_legend.html_id = "legend_html";
    div_legend.svg_id = "legend_svg";
    div_legend.draw_html();
    div_legend.draw_svg(false);
    downloader.set_event_listner(div_legend.svg_id);
  };

  div_select_bar.brushed = function (data) {
    var target = [];
    for (var i1 = 0; i1 < bar_dataset.key.length; i1++) {
      if (group_enable[i1] == false) continue;

      for (var j = 0; j < data.length; j++) {
        var index = bar_dataset.key[i1].indexOf(data[j]);
        if (index < 0) continue;
        for (var k = 0; k < bar_dataset.item[i1][index].length; k++) {
          if (target.indexOf(bar_dataset.item[i1][index][k]) < 0) {
            target.push(bar_dataset.item[i1][index][k]);
          }
        }
      }
    }
    // hilight
    for (var i2 in ca_data.index_ID) {
      var find = target.indexOf(ca_data.index_ID[i2]);

      if (find < 0) {
        if (selection_mode() == "hilight") {
          d3.select("#thumb" + i2).style("background-color", "#FFFFFF");
        } else {
          d3.select("#thumb" + i2 + "_li").classed("hidden", true);
        }
      } else {
        if (selection_mode() == "hilight") {
          d3.select("#thumb" + i2).style("background-color", "#FFFFCC");
        } else {
          d3.select("#thumb" + i2 + "_li").classed("hidden", false);
        }
      }
    }
  };

  ca_draw.thumb_reset = function () {
    var saved_func = div_select_bar.brushend;
    div_select_bar.brushend = function () {};
    div_select_bar.brush_reset();
    div_select_bar.brushend = saved_func;
    for (var i = 0; i < ca_data.index_ID.length; i++) {
      d3.select("#thumb" + i + "_li").classed("hidden", false);
      d3.select("#thumb" + i).style("background-color", "#FFFFFF");
    }
    checkbox_reset();
  };

  function selection_mode() {
    if (d3.select('input[name="q2"]:checked')[0][0].value == "hide") {
      return "hide";
    }
    return "hilight";
  }

  // -----------------------------------------------------------------------------
  // bundle
  // -----------------------------------------------------------------------------

  // style
  {
    var color_list = [];
    var label_list = [];
    for (var i1 = 0; i1 < ca_data.genome_size.length; i1++) {
      color_list.push(ca_data.genome_size[i1].color);
      label_list.push(ca_data.genome_size[i1].label);
    }

    var arc_style_detail = {
      fill: color_list,
      fill_opacity: style_sv_detail.arc_fill_opacity,
      stroke: color_list,
      stroke_opacity: style_sv_detail.arc_stroke_opacity,
      font_family: style_general.font_family,
      text_color: style_sv_detail.arc_label_color,
      font_size: style_sv_detail.arc_label_fontsize,
      label: label_list,
    };

    var link_style_detail = [];
    for (var i2 = 0; i2 < ca_data.group.length; i2++) {
      link_style_detail.push({
        stroke: ca_data.group[i2].color,
        stroke_width: style_sv_detail.link_width,
        stroke_opacity: style_sv_detail.link_opacity,

        active_stroke: style_sv_detail.link_select_color,
        active_stroke_width: style_sv_detail.link_select_width,
        active_stroke_opacity: style_sv_detail.link_select_opacity,

        name: ca_data.group[i2].name,
        enable: group_enable[i2],
      });
    }

    var arc_style_thumb = {
      fill: color_list,
      fill_opacity: style_sv_thumb.arc_fill_opacity,
      stroke: color_list,
      stroke_opacity: style_sv_thumb.arc_stroke_opacity,
      //font_family: style_general.font_family,
      //text_color: style_sv_thumb.arc_label_color,
      //font_size: style_sv_thumb.arc_label_fontsize,
      //label: [],
    };

    var link_style_thumb = [];
    for (var i3 = 0; i3 < ca_data.group.length; i3++) {
      link_style_thumb.push({
        stroke: ca_data.group[i3].color,
        stroke_width: style_sv_thumb.link_width,
        stroke_opacity: style_sv_thumb.link_opacity,

        //active_stroke : style_sv_thumb.link_select_color,
        //active_stroke_width : style_sv_thumb.link_select_width,
        //active_stroke_opacity : style_sv_thumb.link_select_opacity,

        name: ca_data.group[i3].name,
        enable: group_enable[i3],
      });
    }
  }

  function copy_obj(src, dst) {
    for (var key in src) {
      dst[key] = src[key];
    }
  }

  var bundles = {};

  function draw_bandle(obj, ID, wide) {
    if (bundles[ID] != undefined) return;

    var options = {
      w: wide,
      h: wide,
      rx: wide / 2,
      ry: wide / 2,
      rotate: 0,
      ir: wide / 2 - 50,
      or: wide / 2 - 30,
      label_t: 50,
      cluster_size: 50,
      enable_viewer: true,
    };

    bundles[ID] = new bundle(ID);
    copy_obj(arc_style_detail, bundles[ID].arc_style);
    for (var i = 0; i < link_style_detail.length; i++) {
      bundles[ID].link_style.push(new bundles[ID].link_style_template());
      copy_obj(link_style_detail[i], bundles[ID].link_style[i]);
    }
    bundles[ID].enable_tooltip = true;

    bundles[ID].draw_bundle(obj, ca_data.get_arc_data_detail(), ca_data.get_data_detail(ID), options);

    downloader.set_event_listener_for_ca_floats(obj);
  }

  var thumbs = {};

  ca_draw.draw_bandle_thumb = function (iid, ID) {
    var wide = 140;
    var options = {
      w: wide,
      h: wide,
      rx: wide / 2,
      ry: wide / 2,
      // rotate
      ir: wide / 2 - 14,
      or: wide / 2 - 10,
      label_t: 8,
      cluster_size: 14,
      enable_viewer: false,
    };

    thumbs[ID] = new bundle(ID);
    copy_obj(arc_style_thumb, thumbs[ID].arc_style);
    for (var i = 0; i < link_style_thumb.length; i++) {
      thumbs[ID].link_style.push(new thumbs[ID].link_style_template());
      copy_obj(link_style_thumb[i], thumbs[ID].link_style[i]);
    }
    thumbs[ID].draw_bundle("thumb" + iid, ca_data.get_arc_data_thumb(), ca_data.get_data_thumb(ID), options);
    downloader.set_event_listner("thumb" + iid, true);
  };

  ca_draw.bundle_update = function () {
    for (var id1 in thumbs) {
      for (var i = 0; i < link_style_thumb.length; i++) {
        thumbs[id1].link_style[i].enable = group_enable[i];
        thumbs[id1].bundle_update();
      }
    }
    for (var id2 in bundles) {
      for (var j = 0; j < link_style_detail.length; j++) {
        bundles[id2].link_style[j].enable = group_enable[j];
        bundles[id2].bundle_update();
      }
    }
  };

  ca_draw.show_float = function (e, idx, ID) {
    var map_id = "map" + idx;
    var float_id = "#float" + idx;
    var title_id = float_id + "_t";
    var circos_size = 400;
    var pos = get_pos(idx, "thumb" + idx); // NOTE: Get position before drawing

    draw_bandle(map_id, ID, circos_size);

    set_style(idx, circos_size, pos);
    highlight_window_title(title_id);
    bring_window_to_front(float_id);
  };

  function set_style(idx, circos_size, pos) {
    var float_id = "#float" + idx;
    var title_id = float_id + "_t";
    var header_id = float_id + "_h";
    var header_height = document.getElementById("float" + idx + "_t").clientHeight;
    var circos_height = header_height + circos_size;

    // header region
    d3.select(title_id).style("color", style_sv_detail.win_header_text_color);
    d3.select(header_id).style("top", -header_height).style("height", header_height);

    // circosplot region
    d3.select(float_id)
      .style("border-color", style_sv_detail.win_border_color)
      .style("border-width", style_sv_detail.win_border_width)
      .style("background-color", style_sv_detail.win_background_color)
      .style("left", String(pos[0]) + "px")
      .style("top", String(pos[1]) + "px")
      .style("height", circos_height)
      .style("visibility", "visible");
  }

  ca_draw.hide_float = function (circosnr) {
    // Close circosplot window
    d3.select(`#float${circosnr}`).style("visibility", "hidden");
    // Close view window
    bundles[ca_data.index_ID[circosnr]].clear_source_strokes(circosnr);
    d3.select(`#view${circosnr}`)
      .style("width", d3.select(`#view${circosnr}`).style("min-width"))
      .style("visibility", "hidden");
    d3.select(`#view_vline${circosnr}`).style("margin-left", "0px").style("visibility", "hidden");
  };

  ca_draw.resize_if = function () {
    div_select_bar.resize();
  };

  // -----------------------------------------------------------------------------
  // Mouse
  // -----------------------------------------------------------------------------

  var item = "";
  var mouse_x = 0;
  var mouse_y = 0;
  var header_region = [];

  ca_draw.mouse_down = function (event, id) {
    item = id;
    mouse_x = event.pageX;
    mouse_y = event.pageY;
    d3.select(id).style("opacity", 0.4);
    expand_header_region(id.replace("#float", ""));
    bring_window_to_front(id);
  };

  ca_draw.mouse_move = function (event, id) {
    if (item != id) {
      return;
    }
    var dist_x = mouse_x - event.pageX;
    var dist_y = mouse_y - event.pageY;
    if (Math.abs(dist_x) < 1 && Math.abs(dist_y) < 1) {
      return;
    }
    d3.select(id).style("left", String(pos_tonum(d3.select(id).style("left")) - dist_x) + "px");
    d3.select(id).style("top", String(pos_tonum(d3.select(id).style("top")) - dist_y) + "px");
    mouse_x = event.pageX;
    mouse_y = event.pageY;
  };

  ca_draw.mouse_up = function (event, id) {
    ca_draw.mouse_out(id);
  };

  ca_draw.mouse_out = function (id) {
    if (item != id) {
      return;
    }
    item = "";
    mouse_x = 0;
    mouse_y = 0;
    d3.select(id).style("opacity", 1.0);
    restore_header_region();
  };

  function pos_tonum(pos_txt) {
    return Number(pos_txt.replace(/px/g, ""));
  }

  function expand_header_region(idx) {
    if (header_region.length > 0) return;
    var handle_id = "#float" + idx + "_h.float_handle";
    var fh = d3.select(handle_id);
    header_region = [handle_id, fh.style("position"), fh.style("top"), fh.style("height"), fh.style("left"), fh.style("width")];
    d3.select(handle_id)
      .style("position", "fixed")
      .style("top", "0px")
      .style("height", document.body.clientHeight)
      .style("left", "0px")
      .style("width", document.body.clientWidth);
  }

  function restore_header_region() {
    if (header_region.length == 0) return;
    d3.select(header_region[0])
      .style("position", header_region[1])
      .style("top", header_region[2])
      .style("height", header_region[3])
      .style("left", header_region[4])
      .style("width", header_region[5]);
    header_region.length = 0;
  }

  // -----------------------------------------------------------------------------
  // Overlay
  // -----------------------------------------------------------------------------

  var overlay_idx = ca_data.index_ID.length;
  var overlay_id = "OVERLAY";
  while (ca_data.index_ID.indexOf(overlay_id) != -1) overlay_id += "_";
  var old_target_thumbs;
  var z_value = 1;
  var hi_time = 200;
  var saved_bp_nodes;
  var title_timeout_id;

  //
  // Bar graph
  //

  // On mouseup
  div_select_bar.brushend = function () {
    check_checkboxes();
    ca_draw.auto_overlaying("bargraph");
  };

  //
  // Thumbnail overlay
  //

  ca_draw.auto_overlaying = function (event_loc) {
    // event_loc is the following triggered location
    //   cb_thumb  : checkboxes for thumbnails
    //   cb_opt_***: checkboxes for overlay settings
    //   btn_***   : ON, OFF, and Reverse buttons
    //   bargraph  : bar graph

    if (!is_alive_overlay_window()) return;

    if (event_loc.match(/^cb_opt_/)) {
      if (event_loc === "cb_opt_highlight" && !document.getElementById("cb_opt_highlight").checked) return;
      else if (event_loc === "cb_opt_hide" && !document.getElementById("cb_opt_hide").checked) return;
      else if (event_loc === "cb_opt_checkbox" && !document.getElementById("cb_opt_checkbox").checked) return;
    } else if (event_loc.match(/^btn_/)) {
      if (!document.getElementById("cb_opt_checkbox").checked) return;
    } else if (event_loc === "bargraph") {
      if (selection_mode() === "hilight" && !document.getElementById("cb_opt_highlight").checked) return;
      else if (selection_mode() === "hide" && !document.getElementById("cb_opt_hide").checked) return;
    } else if (event_loc === "cb_thumb") {
      if (!document.getElementById("cb_opt_checkbox").checked) return;
    } else {
      console.log("[Error] event_loc is an improper value");
      return;
    }

    if (event_loc === "cb_opt_highlight") check_checkboxes();

    var is_graph_event = event_loc === "bargraph" ? true : false;
    ca_draw.start_overlay(is_graph_event);
  };

  ca_draw.start_overlay = function (is_graph_event) {
    if (is_graph_event === undefined) is_graph_event = false;

    if (!is_alive_overlay_window()) {
      start_overlay(is_graph_event, false);
      return;
    }

    var float_id = "#float" + overlay_idx;
    var title_id = float_id + "_t";
    bring_window_to_front(float_id);
    highlight_window_title(title_id, -1);
    setTimeout(function () {
      start_overlay(is_graph_event, true);
    }, 0);
  };

  function start_overlay(is_graph_event, is_highlighted) {
    var float_id = "#float" + overlay_idx;
    var title_id = float_id + "_t";
    var circos_size = 400;

    // Stop if drawing the same as the previous one
    var target_thumbs = get_target_thumbs(is_graph_event);
    if (
      is_alive_overlay_window() && //
      JSON.stringify(target_thumbs) === JSON.stringify(old_target_thumbs)
    ) {
      highlight_window_title(title_id);
      return;
    }
    old_target_thumbs = target_thumbs;

    var pos = get_pos(overlay_idx, "overlay_pos"); // NOTE: Get position before drawing

    // Draw
    var start_time = Date.now();
    draw_overlay(target_thumbs, circos_size);
    var delay = is_highlighted && Date.now() - start_time > hi_time ? 0 : hi_time;

    // Window
    set_style(overlay_idx, circos_size, pos);
    highlight_window_title(title_id, delay);
    bring_window_to_front(float_id);
  }

  function get_target_thumbs(is_graph_event) {
    var thumb_cbs = document.getElementsByName("thumb_cb");
    var n_thumbs = thumb_cbs.length;
    var mode = selection_mode();

    var selected = [];
    // Select thumbnails from the highlight/hidden mode
    if (mode === "hilight") {
      if (document.getElementById("cb_opt_highlight").checked && is_graph_event) {
        for (var i = 0; i < n_thumbs; i++) selected.push(is_thumb_highlighted(i));
      } else {
        for (var i = 0; i < n_thumbs; i++) selected.push(true);
      }
    } else if (mode === "hide") {
      for (var i = 0; i < n_thumbs; i++) selected.push(is_thumb_visible(i));
    }
    // Select thumbnails from their checkboxes
    var targets = [];
    for (var i = 0; i < n_thumbs; i++) {
      if (thumb_cbs[i].checked && selected[i]) {
        targets.push({ idx: thumb_cbs[i].value, id: ca_data.index_ID[i] });
      }
    }

    return targets;
  }

  // Gather and draw data for overlay
  function draw_overlay(target_thumbs, wide) {
    var obj = "map" + overlay_idx;
    var ID = overlay_id;

    // Delete
    if (bundles[ID] !== undefined) delete_overlay();

    // Save breakpoint information
    if (saved_bp_nodes === undefined) {
      saved_bp_nodes = {};
      for (var i = 0; i < ca_data.index_ID.length; i++) {
        var id = ca_data.index_ID[i];
        var d = ca_data.get_data_detail(id);
        saved_bp_nodes[id] = [];
        for (var j = 0; j < d.length; j++) /* Loop by group */ {
          for (var k = 0; k < d[j].length; k++) /* Loop by node */ {
            if (d[j][k].ends.length != 0) {
              saved_bp_nodes[id].push([j, k, d[j][k].ends, d[j][k].tooltip]);
            }
          }
        }
      }
    }

    // Gather target data
    var data;
    if (target_thumbs.length != 0) {
      data = ca_data.get_data_detail("");
      for (var i = 0; i < target_thumbs.length; i++) {
        var id = target_thumbs[i].id;
        for (var j = 0; j < saved_bp_nodes[id].length; j++) {
          var group = saved_bp_nodes[id][j][0];
          var index = saved_bp_nodes[id][j][1];
          Array.prototype.push.apply(data[group][index].ends, saved_bp_nodes[id][j][2]);
          Array.prototype.push.apply(data[group][index].tooltip, saved_bp_nodes[id][j][3]);
        }
      }
    }

    // Options
    var options = {
      w: wide,
      h: wide,
      rx: wide / 2,
      ry: wide / 2,
      rotate: 0,
      ir: wide / 2 - 50,
      or: wide / 2 - 30,
      label_t: 50,
      cluster_size: 50,
      enable_viewer: false,
    };

    // Create a new bundle
    bundles[ID] = new bundle(ID);
    copy_obj(arc_style_detail, bundles[ID].arc_style);
    for (var i = 0; i < link_style_detail.length; i++) {
      bundles[ID].link_style.push(new bundles[ID].link_style_template());
      copy_obj(link_style_detail[i], bundles[ID].link_style[i]);
    }
    bundles[ID].enable_tooltip = true;

    // Draw
    bundles[ID].draw_bundle(obj, ca_data.get_arc_data_detail(), data, options);

    // Set an event listener
    downloader.set_event_listener_for_ca_floats(obj);
  }

  function delete_overlay() {
    delete bundles[overlay_id];
    d3.select("#map" + overlay_idx)
      .attr("style", null)
      .select("svg")
      .remove();
    d3.select("#float" + overlay_idx + "_t").attr("style", null);
    d3.select("#float" + overlay_idx).attr("style", null);
  }

  // -----------------------------------------------------------------------------
  // View extracted data
  // -----------------------------------------------------------------------------

  var _bp_nodes_cps;
  var _bp_startend = [];
  var _bp_start = [];
  var _bp_end = [];

  ca_draw.view_vline_mousedown = function (e, id) {
    var view_id = `#view${id}`;
    var vline_id = `#view_vline${id}`;
    var min_width = parseInt(d3.select(view_id).style("min-width").replace("px", ""));
    var modal = document.getElementById("view_modal_window");

    if (d3.select(vline_id).style("cursor") === "default" && window.onmousemove !== null) return;

    bring_window_to_front(`#float${id}`);
    modal.style.display = "block";

    window.onmouseup = function (e) {
      if (e.target === modal) {
        modal.style.display = "none";
        window.onmouseup = null;
        window.onmouseout = null;
        // Change cursor shape
        var cursor = d3.select(vline_id).style("cursor");
        d3.select(vline_id).style("cursor", "default");
        // After returning the cursor to the default shape,
        // the vertical line cannot be moved until the cursor leaves it
        var vline = document.getElementById(vline_id.slice(1));
        window.onmousemove = function (e) {
          if (e.target !== vline) {
            d3.select(vline_id).style("cursor", cursor);
            window.onmousemove = null;
          }
        };
      }
    };

    window.onmouseout = function (e) {
      window.onmouseup(e);
    };

    window.onmousemove = function (e) {
      // resize
      var width = parseInt(d3.select(view_id).style("width").replace("px", ""));
      var vleft = parseInt(document.getElementById(vline_id.slice(1)).getBoundingClientRect().left);
      var diff = e.pageX - vleft;
      var new_width = Math.max(min_width, width + diff);
      var new_vleft = Math.max(0, new_width - min_width);
      d3.select(view_id).style("width", new_width + "px");
      d3.select(vline_id).style("margin-left", new_vleft + "px");
    };
  };

  // Extract and display the data corresponding to a selected stroke
  ca_draw.update_viewer = function (circosnr, do_update = false) {
    var view_id = `#view${circosnr}`;
    var vline_id = `#view_vline${circosnr}`;

    // Close view window if it is already open
    if (!do_update && d3.select(view_id).style("visibility") !== "hidden") {
      d3.select(view_id).style("visibility", "hidden");
      d3.select(vline_id).style("visibility", "hidden");
      return;
    }

    // Main
    update_viewer(circosnr);

    // Show view window
    d3.select(view_id).style("visibility", "visible");
    d3.select(vline_id).style("visibility", "visible");
  };

  ca_draw.change_view = function (circosnr) {
    update_viewer(circosnr);
  };

  function get_source_strokes(circosnr, reverse = false) {
    var title = ca_data.index_ID[circosnr];
    var strokes = bundles[title].get_source_strokes(circosnr); // strokes: [[ilink], ...]
    if (reverse) strokes.reverse();
    return strokes;
  }

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

  function update_viewer(circosnr) {
    // strokes     : [sequence number][selected ilinks]
    // base_ilinks : [sequence number][source ilinks based on selected ilinks]
    // ilink2ilinks: [circosnr]{"source ilink": [target ilinks]}
    var view_mode = d3.select("#view_mode")[0][0].value;
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
    var com_nodes = [];
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
      com_nodes.push({ title: ca[0], chr1: ca[1], bp1: ca[2], chr2: ca[3], bp2: ca[4] });
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
        ilink_org: ilink_org,
        unfoc_idx: unfoc_idxes[idx_data],
        hrow: hrows[idx_data],
        ...com_nodes[i],
      });
      idx_data += 1;
      // data --------------------------
      v.forEach((w) => {
        var ca = ca_data.links[w];
        data.push(`${ca[0]}__${String(parseInt(ca[1]) + 1)}__${String(ca[2])}__${String(parseInt(ca[3]) + 1)}__${String(ca[4])}`);
        var node = { title: ca[0], chr1: ca[1], bp1: ca[2], chr2: ca[3], bp2: ca[4] };
        var idx = src_ilinks[i].indexOf(w);
        var found = base_ilinks_all[i].includes(w);
        items.push({
          is_comment: false,
          is_src_area: is_src_area,
          circosnr: circosnr,
          id_group: id_group,
          id_one: `${circosnr}${s_or_t}${idx_data}`,
          ilink_cur: idx !== -1 && !found ? src_ilinks[i][idx] : -1,
          ilink_org: ilink_org,
          unfoc_idx: unfoc_idxes[idx_data],
          hrow: hrows[idx_data],
          ...node,
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

      .text(function (d, foc_idx) {
        var item = items[foc_idx];
        d3.select(this).attr("id", `view_data${item.id_one}`);
        if (item.is_comment) {
          // view_comment is defined in ../layout/ca.css
          d3.select(this).attr("class", `view_data${item.id_group} view_comment`);
        } else {
          d3.select(this).attr("class", `view_data${item.id_group}`);
        }
        return d;
      })

      .on("mouseover", function (d, foc_idx) {
        var item = items[foc_idx];
        var circosnr = item.circosnr;
        var src_has_d = item.unfoc_idx !== -1 ? true : false; // Source area has data(d)

        // Clone stroke
        function change_stroke_color(ilink, color, width) {
          var node = d3.select(`#path${ilink}`).node();
          var clone = d3.select(node.parentNode.parentNode.insertBefore(node.cloneNode(true), null));
          d3.select(clone)[0][0].attr("class", `clone_path${circosnr}`).style("stroke", color).style("stroke-width", width);
        }
        if (item.ilink_cur !== -1) {
          change_stroke_color(item.ilink_org, "#00f", "4px"); // Blue
          change_stroke_color(item.ilink_cur, "#f00", "4px"); // Red
        } else if (src_has_d) {
          change_stroke_color(item.ilink_org, "#f00", "4px"); // Red
        } else {
          change_stroke_color(item.ilink_org, "#00f", "4px"); // Blue
        }

        // Auto scroll
        if (d3.select(`#view_auto_scroll${circosnr}`)[0][0].checked) {
          var id = item.is_src_area ? `view${circosnr}_data_target` : `view${circosnr}_data_source`;
          var scroll = Math.max(0, (item.hrow + 1) * 20 - 100); // 100 is height of area. see ../layout/ca.css
          document.getElementById(id).scrollTop = scroll;
        }

        // Change background color of view data
        d3.selectAll(`.view_data${item.id_group}`).style("background-color", "#e1d5d5"); // gray and red
        if (!src_has_d) {
          //d3.select(`#view_data${item.id_one}`).style("background-color", "#bac8ff"); // Light blue
          d3.select(`#view_data${item.id_one}`).style("background-color", "#ffcc7e"); // Light orange
        } else {
          //var color = "#7fd3a4" // Light green
          var color = "#f0a6a6"; // Light Red
          d3.select(`#view_data${item.id_one}`).style("background-color", color);
          var s_or_t = item.is_src_area ? "t" : "s";
          var id = `${circosnr}${s_or_t}${item.unfoc_idx}`;
          d3.select(`#view_data${id}`).style("background-color", color);
        }
      })

      .on("mouseout", function (d, foc_idx) {
        var item = items[foc_idx];
        // Remove cloned strokes
        d3.selectAll(`.clone_path${item.circosnr}`).remove();
        // Remove background color
        d3.selectAll(`.view_data${item.id_group}`).style("background-color", null);
      });
  }

  //
  // Checkbox
  //

  ca_draw.checkbox_on = function () {
    var thumb_cbs = document.getElementsByName("thumb_cb");
    for (var i = 0; i < thumb_cbs.length; i++) {
      if (is_thumb_visible(i)) {
        thumb_cbs[i].checked = true;
      }
    }
    ca_draw.auto_overlaying("btn_on");
  };

  ca_draw.checkbox_off = function () {
    var thumb_cbs = document.getElementsByName("thumb_cb");
    for (var i = 0; i < thumb_cbs.length; i++) {
      if (is_thumb_visible(i)) {
        thumb_cbs[i].checked = false;
      }
    }
    ca_draw.auto_overlaying("btn_off");
  };

  ca_draw.checkbox_reverse = function () {
    var thumb_cbs = document.getElementsByName("thumb_cb");
    for (var i = 0; i < thumb_cbs.length; i++) {
      if (is_thumb_visible(i)) {
        thumb_cbs[i].checked = thumb_cbs[i].checked ? false : true;
      }
    }
    ca_draw.auto_overlaying("btn_reverse");
  };

  function checkbox_reset() {
    ca_draw.checkbox_on();
  }

  //
  // Thumbnail titles
  //
  ca_draw.thumb_title_mouseover = function (thumbli_id) {
    if (document.getElementById("cb_opt_title").checked) {
      if (title_timeout_id === undefined) {
        var delay = parseInt(d3.select("#title_timeout_interval")[0][0].value * 1000);
        title_timeout_id = setTimeout(function () {
          d3.select(thumbli_id)
            .style("overflow", "visible")
            .style("text-overflow", "clip")
            .style("white-space", "normal")
            .style("word-break", "break-all")
            .style("background-color", "#f2eded")
            .style("margin", "-3px 0px 0px -3px")
            .style("padding", "3px 3px 3px 3px");
        }, delay);
      }
    }
  };

  ca_draw.thumb_title_mouseout = function (thumbli_id) {
    if (document.getElementById("cb_opt_title").checked)
      d3.select(thumbli_id)
        .style("overflow", "hidden")
        .style("text-overflow", "ellipsis")
        .style("white-space", "nowrap")
        .style("word-break", "normal")
        .style("background-color", "white")
        .style("margin", "0px")
        .style("padding", "0px");
    if (title_timeout_id !== undefined) {
      clearTimeout(title_timeout_id);
      title_timeout_id = undefined;
    }
  };

  //
  // Window action
  //

  ca_draw.bring_window_to_front = function (id) {
    bring_window_to_front(id);
  };

  ca_draw.close_overlay = function () {
    delete_overlay();
  };

  //
  // Utility
  //

  function bring_window_to_front(id) {
    d3.select(id).style("z-index", z_value);
    z_value += 1;
  }

  function check_checkboxes() {
    // Check only the checkboxes corresponding to the highlighted thumbnails
    if (selection_mode() === "hilight" && document.getElementById("cb_opt_highlight").checked) {
      var thumb_cbs = document.getElementsByName("thumb_cb");
      for (var i = 0; i < thumb_cbs.length; i++)
        if (is_thumb_highlighted(i)) thumb_cbs[i].checked = true;
        else thumb_cbs[i].checked = false;
    }
  }

  function get_pos(idx, id) {
    // Return the current position if the specified float window exists
    var style = d3.select("#float" + idx)[0][0].style;
    if (style.visibility === "visible") {
      return [style.left.replace("px", ""), style.top.replace("px", "")];
    }

    // Return a predetermined position
    var rect = document.getElementById(id).getBoundingClientRect();
    var dElm = document.documentElement;
    var dBody = document.body;
    var scrollX = dElm.scrollLeft || dBody.scrollLeft;
    var scrollY = dElm.scrollTop || dBody.scrollTop;
    return [rect.left + scrollX, rect.top + scrollY];
  }

  function highlight_window_title(id, millisec = hi_time) {
    // Highlight the background color of window title
    d3.select(id).style("background-color", "#0ff");
    if (millisec >= 0) {
      setTimeout(function () {
        // Restore the background color of window title to its original color
        d3.select(id).style("background-color", style_sv_detail.win_header_background_color);
      }, millisec);
    }
  }

  function is_alive_overlay_window() {
    return bundles[overlay_id] !== undefined;
  }

  function is_thumb_visible(i) {
    return document.getElementById("thumb" + i + "_li").getAttribute("class") !== "thumb hidden";
  }

  function is_thumb_highlighted(i) {
    return document.getElementById("thumb" + i).style["background-color"] !== "rgb(255, 255, 255)"; // #FFFFFF
  }
})();

bundle_update = function () {
  ca_draw.bundle_update();
};
