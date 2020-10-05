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

  function draw_bandle(obj, ID) {
    if (bundles[ID] != undefined) return;

    var wide = 400;
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

      ir: wide / 2 - 14,
      or: wide / 2 - 10,
      label_t: 8,
      cluster_size: 14,
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
    var pos = get_pos(idx, "thumb" + idx);

    draw_bandle(map_id, ID);

    d3.select(title_id).style("color", style_sv_detail.win_header_text_color);
    highlight_window_title(title_id);
    set_header_region(idx);

    d3.select(float_id)
      .style("border-color", style_sv_detail.win_border_color)
      .style("border-width", style_sv_detail.win_border_width)
      .style("background-color", style_sv_detail.win_background_color)
      .style("left", String(pos[0]) + "px")
      .style("top", String(pos[1]) + "px")
      .style("visibility", "visible");
    bring_window_to_front(float_id);
  };

  ca_draw.hide_float = function (id) {
    d3.select(id).style("visibility", "hidden");
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
    d3.select(handle_id).style("position", "fixed");
    d3.select(handle_id).style("top", "0px");
    d3.select(handle_id).style("height", document.body.clientHeight);
    d3.select(handle_id).style("left", "0px");
    d3.select(handle_id).style("width", document.body.clientWidth);
  }

  function restore_header_region() {
    if (header_region.length == 0) return;
    d3.select(header_region[0]).style("position", header_region[1]);
    d3.select(header_region[0]).style("top", header_region[2]);
    d3.select(header_region[0]).style("height", header_region[3]);
    d3.select(header_region[0]).style("left", header_region[4]);
    d3.select(header_region[0]).style("width", header_region[5]);
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

    // NOTE: Get position before drawing
    var pos = get_pos(overlay_idx, "overlay_pos");
    var start_time = Date.now();

    // Draw
    draw_overlay(target_thumbs);

    // Set window title
    d3.select(title_id).style("color", style_sv_detail.win_header_text_color);
    var delay = is_highlighted && Date.now() - start_time > hi_time ? 0 : hi_time;
    highlight_window_title(title_id, delay);
    set_header_region(overlay_idx);

    // Set other options for window
    d3.select(float_id)
      .style("border-color", style_sv_detail.win_border_color)
      .style("border-width", style_sv_detail.win_border_width)
      .style("background-color", style_sv_detail.win_background_color)
      .style("left", String(pos[0]) + "px")
      .style("top", String(pos[1]) + "px")
      .style("visibility", "visible");
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
  function draw_overlay(target_thumbs) {
    var obj = "map" + overlay_idx;
    var ID = overlay_id;

    // Delete
    if (bundles[ID] !== undefined) delete_overlay();

    // Gather target data
    var data;
    if (target_thumbs.length != 0) {
      data = ca_data.get_data_detail(target_thumbs[0].id);
      for (var i = 1; i < target_thumbs.length; i++) /* Loop by target thumbnails */ {
        var d = ca_data.get_data_detail(target_thumbs[i].id);
        for (var j = 0; j < d.length; j++) /* Loop by group */ {
          for (var k = 0; k < d[j].length; k++) /* Loop by node */ {
            if (d[j][k].ends.length != 0) {
              data[j][k].ends = data[j][k].ends.concat(d[j][k].ends);
              data[j][k].tooltip = data[j][k].tooltip.concat(d[j][k].tooltip);
            }
          }
        }
      }
    }

    // Options
    var wide = 400;
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

  function set_header_region(idx) {
    var height = document.getElementById("float" + idx + "_t").clientHeight;
    d3.select("#float" + idx + "_h").style("top", -height);
    d3.select("#float" + idx + "_h").style("height", height);
  }
})();

bundle_update = function () {
  ca_draw.bundle_update();
};
