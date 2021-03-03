(function () {
  ca_utils = {};

  // -----------------------------------------------------------------------------
  // Buttons
  // -----------------------------------------------------------------------------

  ca_utils.btn_save = function (id, filename) {
    var text = d3.select(id)[0][0].innerText;
    var blob = new Blob([text], { type: "text/plain", endings: "native" });
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(a.href);
  };
})();
