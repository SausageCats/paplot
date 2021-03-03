(function () {
  extr = {};

  extr.extract = function (circosnr, input) {
    var lab1, t_bpl1, t_bpr1, lab2, t_bpl2, t_bpr2;
    if (input === undefined) {
      lab1 = d3.select("#extr_label1")[0][0].value.replace(/\s+/g, "");
      t_bpl1 = d3.select("#extr_bpl1")[0][0].value.replace(/\s+/g, "");
      t_bpr1 = d3.select("#extr_bpr1")[0][0].value.replace(/\s+/g, "");
      lab2 = d3.select("#extr_label2")[0][0].value.replace(/\s+/g, "");
      t_bpl2 = d3.select("#extr_bpl2")[0][0].value.replace(/\s+/g, "");
      t_bpr2 = d3.select("#extr_bpr2")[0][0].value.replace(/\s+/g, "");
    } else {
      lab1 = input[0];
      t_bpl1 = input[1];
      t_bpr1 = input[2];
      lab2 = input[3];
      t_bpl2 = input[4];
      t_bpr2 = input[5];
    }

    function msg_on_chr_err(chr) {
      var labels = ca_data.genome_size.map((v) => {
        return v.label;
      });
      var last = labels.pop();
      var str = `${labels.join(", ")}, or ${last}`;
      return `${chr} must be any of ${str}`;
    }

    // Exit if the minimum conditions are not met
    if (lab1 === "") {
      alert(msg_on_chr_err("Chr1"));
      return;
    }

    // Exit if chr_obj cannot be found
    function find_chrobj(lab, name) {
      if (lab === "") return [{ chr: "" }, false];
      var chr_obj = ca_data.genome_size.find((d) => {
        return d.label === lab;
      });
      if (chr_obj === undefined) {
        alert(msg_on_chr_err(name));
        return [{}, true]; // Error
      }
      return [chr_obj, false];
    }
    var [chr1_obj, err_chr1] = find_chrobj(lab1, "Chr1");
    var [chr2_obj, err_chr2] = find_chrobj(lab2, "Chr2");
    if (err_chr1 || err_chr2) return;
    var chr1 = chr1_obj.chr;
    var chr2 = chr2_obj.chr;

    // Exit if bp[lr][12] is not empty, 0, or positive integer
    function check_bp(bp, name) {
      if (bp === "") return [-1, false];
      bp = Number(bp);
      if (isNaN(bp) || bp < 0) {
        alert(`${name} must be zero or positive integer`);
        return [-1, true]; // Error
      }
      return [bp, false];
    }
    var [bpl1, err_bpl1] = check_bp(t_bpl1, "Left1");
    var [bpr1, err_bpr1] = check_bp(t_bpr1, "Right1");
    var [bpl2, err_bpl2] = check_bp(t_bpl2, "Left2");
    var [bpr2, err_bpr2] = check_bp(t_bpr2, "Right2");
    if (err_bpl1 || err_bpr1 || err_bpl2 || err_bpr2) return;

    // Fill in value if bp[lr][12] is empty
    var max_bp = 999999999;
    if (bpl1 === -1) bpl1 = 0;
    if (bpr1 === -1) bpr1 = max_bp;
    if (bpl2 === -1) bpl2 = 0;
    if (bpr2 === -1) bpr2 = max_bp;

    var data = [`(${lab1})[${bpl1},${bpr1}] -- (${lab2})[${bpl2},${bpr2}]`];
    if (chr2 === "") {
      // ca_data.links: 1:chr1, 2:break1, 3:chr2, 4:break2
      ca_data.links.forEach((v) => {
        if (
          (v[1] === chr1 && v[2] >= bpl1 && v[2] <= bpr1 && v[4] >= bpl2 && v[4] <= bpr2) ||
          (v[2] >= bpl2 && v[2] <= bpr2 && v[3] === chr1 && v[4] >= bpl1 && v[4] <= bpr1)
        ) {
          data.push(v);
        }
      });
    } else {
      ca_data.links.forEach((v) => {
        if (
          (v[1] === chr1 && v[2] >= bpl1 && v[2] <= bpr1 && v[3] === chr2 && v[4] >= bpl2 && v[4] <= bpr2) ||
          (v[1] === chr2 && v[2] >= bpl2 && v[2] <= bpr2 && v[3] === chr1 && v[4] >= bpl1 && v[4] <= bpr1)
        ) {
          data.push(v);
        }
      });
    }

    var id = "#extr_output";
    d3.select(id)
      .append("ul")
      .selectAll(id + " ul li")
      .data(data)
      .enter()
      .append("li")
      .text(function (d) {
        return d;
      });

    if (circosnr !== undefined) open(circosnr);
  };

  extr.clear = function () {
    d3.selectAll(`#extr_output ul`).remove();
  };

  extr.open = function (circosnr) {
    open(circosnr);
  };

  extr.save = function () {
    ca_utils.btn_save("#extr_output", "data.txt");
  };

  // -----------------------------------------------------------------------------
  // Utility
  // -----------------------------------------------------------------------------

  function open(circosnr) {
    var extr_id = `#view_extract${circosnr}`;
    var rect = d3.select(extr_id).node().getBoundingClientRect();
    var width = d3.select(extr_id)[0][0].offsetWidth;
    var left = rect.left + window.pageXOffset + width;
    var right = rect.top + window.pageYOffset;

    var frame_id = "#extr_frame";
    d3.select(frame_id)
      .style("left", left + "px")
      .style("top", right + "px")
      .style("visibility", "visible");

    // Need setTimeout to move the Extraction window to the forefront when clicking the Extract button on the viewer
    setTimeout(function () {
      fwin.bring_window_to_front(frame_id);
    }, 0);
  }
})();
