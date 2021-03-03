(function () {
  fwin = {};

  var _float_id = "";
  var _mouse_x = 0;
  var _mouse_y = 0;
  var _title_region = [];
  var _z_value = 1;

  fwin.mouse_down = function (event, float_id, title_id) {
    _float_id = float_id;
    _mouse_x = event.pageX;
    _mouse_y = event.pageY;
    d3.select(float_id).style("opacity", 0.4);
    if (title_id !== undefined) expand_title_region(title_id);
    bring_window_to_front(float_id);
  };

  fwin.mouse_move = function (event, id) {
    if (_float_id != id) return;
    var dist_x = _mouse_x - event.pageX;
    var dist_y = _mouse_y - event.pageY;
    if (Math.abs(dist_x) < 1 && Math.abs(dist_y) < 1) return;
    d3.select(id).style("left", String(pos_tonum(d3.select(id).style("left")) - dist_x) + "px");
    d3.select(id).style("top", String(pos_tonum(d3.select(id).style("top")) - dist_y) + "px");
    _mouse_x = event.pageX;
    _mouse_y = event.pageY;
  };

  fwin.mouse_up = function (event, id) {
    fwin.mouse_out(id);
  };

  fwin.mouse_out = function (id) {
    if (_float_id != id) return;
    _float_id = "";
    _mouse_x = 0;
    _mouse_y = 0;
    d3.select(id).style("opacity", 1.0);
    restore_title_region();
  };

  fwin.bring_window_to_front = function (id) {
    bring_window_to_front(id);
  };

  function pos_tonum(pos_txt) {
    return Number(pos_txt.replace(/px/g, ""));
  }

  function expand_title_region(title_id) {
    if (_title_region.length > 0) return;
    var ft = d3.select(title_id);
    _title_region = [title_id, ft.style("position"), ft.style("top"), ft.style("height"), ft.style("left"), ft.style("width")];
    d3.select(title_id)
      .style("position", "fixed")
      .style("top", "0px")
      .style("height", document.body.clientHeight)
      .style("left", "0px")
      .style("width", document.body.clientWidth);
  }

  function restore_title_region() {
    if (_title_region.length == 0) return;
    d3.select(_title_region[0])
      .style("position", _title_region[1])
      .style("top", _title_region[2])
      .style("height", _title_region[3])
      .style("left", _title_region[4])
      .style("width", _title_region[5]);
    _title_region.length = 0;
  }

  function bring_window_to_front(id) {
    d3.select(id).style("z-index", _z_value);
    _z_value += 1;
  }
})();
