// global params
// main-area
var div_mut_bar_top = new mut_bar("div_bar_top");
var div_mut_bar_left = new mut_bar("div_bar_left");
var div_mut_checker = new mut_checker("div_checker");

var divs_main = [div_mut_bar_top, div_mut_bar_left, div_mut_checker];
var divs = [div_mut_bar_top, div_mut_bar_left, div_mut_checker];

// sub-plot
var divs_sub = [];

// resize timer
var timer = false;

// sort params
var SORT_STATE_DEFAULT_X = {name_list: ["sample_ID"], asc_list: [true]};
var SORT_STATE_DEFAULT_Y = {name_list: ["number_of_mutations"], asc_list: [false]};

var sort_state = {x: {init: true, waterfall:false}, y: {init: true}};
sort_state.x.name_list = [].concat(SORT_STATE_DEFAULT_X.name_list);
sort_state.x.asc_list = [].concat(SORT_STATE_DEFAULT_X.asc_list);
sort_state.y.name_list = [].concat(SORT_STATE_DEFAULT_Y.name_list);
sort_state.y.asc_list = [].concat(SORT_STATE_DEFAULT_Y.asc_list);

var func_flgs = {};
var genes_length = 0;

// figure options
var BAR_TOP_AXIS_Y = 50;
var BAR_LEFT_AXIS_Y = 40;
var MULTI_SELECT = false;
var SPIN_WAIT = 200;

// dataset
var dataset_id = null;
var dataset_gene = null;

function add_subdiv(id, name) {
    divs_sub.push({
        obj: new mut_bar(id + "_p"),
        id: id,
        name: name
    });
    divs.push(divs_sub[divs_sub.length-1].obj);
    return divs_sub[divs_sub.length-1].obj;
}

// resize timer
window.addEventListener('resize', function() {
    if (timer !== false) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
        update_div();
        for (var i = 0; i < divs.length; i++) {
            divs[i].resize();
        }

    }, 200);
});

function update_div() {

    var margin_left = 100, margin_right = 100;
    
    // width
    var w = (window.innerWidth - margin_left - margin_right)/(4+16+4);
    var w_center = w*16;
    var w_center_min = mut_data.Ids.length*6;
    if (w_center_min > w_center) w_center = w_center_min;
    
    // height
    var cell = 12;
    var h = cell * genes_length + BAR_LEFT_AXIS_Y;
    var w_side = w*4;
    var w_side_min = 200;
    if (w_side_min > w_side) w_side = w_side_min;
    
    d3.select("#div_mut1").style("width", Math.floor(w_side) + "px");
    d3.select("#div_mut1").style("height", Math.floor(w_side) + "px");
    d3.select("#div_bar_top").style("width", Math.floor(w_center) + "px");
    d3.select("#div_bar_top").style("height", Math.floor(w_side) + "px");
    d3.select("#div_mut2").style("width", Math.floor(w_side) + "px");
    d3.select("#div_mut2").style("height", Math.floor(w_side) + "px");
    
    d3.select("#div_bar_left").style("width", Math.floor(w_side) + "px");
    d3.select("#div_bar_left").style("height", Math.floor(h) + "px");
    d3.select("#div_checker").style("width", Math.floor(w_center) + "px");
    d3.select("#div_checker").style("height", Math.floor(h) + "px");
    d3.select("#div_mut3").style("width", Math.floor(w_side) + "px");
    d3.select("#div_mut3").style("height", Math.floor(h) + "px");

    var sub_h = 50;
    
    for (var i = 0; i < divs_sub.length; i++) {
        d3.select("#" + divs_sub[i].id + "_t").style("width", Math.floor(w_side) + "px");
        d3.select("#" + divs_sub[i].id + "_t").style("height", sub_h + "px");
        d3.select("#" + divs_sub[i].id + "_p").style("width", Math.floor(w_center) + "px");
        d3.select("#" + divs_sub[i].id + "_p").style("height", sub_h + "px");
        d3.select("#" + divs_sub[i].id + "_l").style("width", Math.floor(w_side) + "px");
        d3.select("#" + divs_sub[i].id + "_l").style("height", sub_h + "px");
    }
}

// *********************************************
// selection events
// *********************************************

// selection status
select_state_template = (function() {
        var select_state_template = function() {
            this.keys = [];
            this.flags = [];
            this.set = function(key, on, multi) {
                if (multi == false) {
                    this.keys = [key];
                    this.flags = [on];
                    return;
                }
                var index = this.keys.indexOf(key);
                if ((on == true) && (index < 0)) {
                    this.keys.push(key);
                    this.flags.push(on);
                }
                else if ((on == false) && (index >= 0)) {
                    this.keys.splice(index, 1);
                    this.flags.splice(index, 1);
                }
            };
        };
        return select_state_template;
    })();
var select_state = {x: new select_state_template, y: new select_state_template};
    
div_mut_bar_left.bar_selected = function(key, on) {
    select_state.y.set(key, on, MULTI_SELECT);
    div_mut_bar_left.bar_select(key, on);
    div_mut_checker.bar_select(null, key, on);
}

div_mut_bar_top.bar_selected = function(key, on) {
    select_state.x.set(key, on, MULTI_SELECT);
    div_mut_bar_top.bar_select(key, on);
    div_mut_checker.bar_select(key, null, on);
    for (var i = 0; i< divs_sub.length; i++) {
        divs_sub[i].obj.bar_select(key, on);
    }
}

div_mut_checker.bar_selected = function(key1, key2, on) {
    select_state.x.set(key1, on, MULTI_SELECT);
    select_state.y.set(key2, on, MULTI_SELECT);
    div_mut_checker.bar_select(key1, key2, on);
    div_mut_bar_left.bar_select(key2, on);
    div_mut_bar_top.bar_select(key1, on);
    for (var i = 0; i< divs_sub.length; i++) {
        divs_sub[i].obj.bar_select(key1, on);
    }
    console.log(JSON.stringify(select_state));
}

function sub_selected(key, on) {
    select_state.x.set(key, on, MULTI_SELECT);
    div_mut_bar_top.bar_select(key, on);
    div_mut_checker.bar_select(key, null, on);
    for (var i = 0; i< divs_sub.length; i++) {
        divs_sub[i].obj.bar_select(key, on);
    }
}

function selection_reset() {
    select_state.x.keys = [];
    select_state.x.flags = [];
    select_state.y.keys = [];
    select_state.y.flags = [];
        
    div_mut_bar_top.reset_select();
    div_mut_bar_left.reset_select();
    div_mut_checker.reset_select();
    for (var i = 0; i< divs_sub.length; i++) {
        divs_sub[i].obj.reset_select();
    }
}

function selection_retry() {

    for (var k in select_state.x.keys) {
        
        div_mut_checker.bar_select(select_state.x.keys[k], null, select_state.x.flags[k]);
        div_mut_bar_top.bar_select(select_state.x.keys[k], select_state.x.flags[k]);
        for (var i = 0; i< divs_sub.length; i++) {
            divs_sub[i].obj.bar_select(select_state.x.keys[k], select_state.x.flags[k]);
        }
    }
    for (var k in select_state.y.keys) {
        
        div_mut_checker.bar_select(null, select_state.y.keys[k], select_state.y.flags[k]);
        div_mut_bar_left.bar_select(select_state.y.keys[k], select_state.y.flags[k]);
    }
    //console.log(JSON.stringify(select_state));
}

// *********************************************
// change view gene function
// *********************************************

function filter_sample() {
    var text = d3.select("#viewsample_mutation_max").property("value");
    if (text == "") {
        div_mut_bar_top.set_bar_max(0);
    }
    else {
        div_mut_bar_top.set_bar_max(parseInt(text));
    }
}

function filter_gene() {

    d3.select("#spin").classed("hidden", false);
    
    timer = setTimeout(function() {
        filter_gene_exec();
        d3.select("#spin").classed("hidden", true);
    }, SPIN_WAIT);
    
}

function filter_gene_exec() {

    var gene_th = parseInt(d3.select("#viewgene_rate").property("value"));
    var gene_max = parseInt(d3.select("#viewgene_number").property("value"));
    
    if (sort_state.y.name_list.length == 0) {
        sort_state.y.name_list = ["number_of_mutations"];
        sort_state.y.asc_list = [false];
    }
    dataset_gene = mut_data.get_dataset_gene(func_flgs, gene_th, gene_max, sort_state.y.name_list, sort_state.y.asc_list);
    d3.select("#filter_text").text("{num:,}".format({num: dataset_gene.uncut_length}));
    var dataset_checker = mut_data.get_dataset_checker(func_flgs, dataset_gene.total_keys);
    
    genes_length = dataset_gene.total_keys.length;
    update_div();
    update_gene_listbox(dataset_gene.total_keys);
    
    // bar-left update
    {
        for (var i=0; i < dataset_gene.keys.length; i++) {
            var data_index = dataset_gene.keys.length - i - 1;
            div_mut_bar_left.dataset[i].data = dataset_gene.data[data_index];
            div_mut_bar_left.dataset[i].keys = dataset_gene.keys[data_index];
            div_mut_bar_left.dataset[i].tooltips = dataset_gene.tooltips[data_index];
            
        };

        div_mut_bar_left.keys = dataset_gene.total_keys;
        div_mut_bar_left.tags[0].values = dataset_gene.total_keys;
        div_mut_bar_left.tags[1].values = dataset_gene.total_nums;
        div_mut_bar_left.options.grid_xs[0].labels = dataset_gene.total_keys;
        div_mut_bar_left.options.grid_xs[0].keys = dataset_gene.total_keys;

        div_mut_bar_left.rect_draw();
    }
    
    // checker update
    {
        for (var i=0; i < dataset_checker.keys.length; i++) {
            var data_index = dataset_checker.keys.length - i - 1;
            div_mut_checker.dataset[i].data = dataset_checker.data[data_index];
            div_mut_checker.dataset[i].keys = dataset_checker.keys[data_index];
            div_mut_checker.dataset[i].keys2 = dataset_checker.keys2[data_index];
            div_mut_checker.dataset[i].tooltips = dataset_checker.tooltips[data_index];
            
        };

        div_mut_checker.keys2 = dataset_gene.total_keys;
        div_mut_checker.tags2[0].values = dataset_gene.total_keys;
        div_mut_checker.tags2[1].values = dataset_gene.total_nums;
        div_mut_checker.options.grids[1].labels = new Array(dataset_gene.total_keys.length);
        div_mut_checker.options.grids[1].keys = dataset_gene.total_keys;
        
        div_mut_checker.rect_draw();
    }
    
    // sort
    {
        div_mut_bar_left.sort(sort_state.y.name_list, sort_state.y.asc_list);
        div_mut_checker.sort(sort_state.y.name_list, sort_state.y.asc_list, "y");
        
        if (sort_state.x.waterfall == true) {
            sort_waterfall_exec();
        }
    }
    selection_retry();
}

// *********************************************
// change stack function
// *********************************************

function change_stack(id, name) {

    d3.select("#spin").classed("hidden", false);

    timer = setTimeout(function() {
        change_stack_exec(id, name);
        d3.select("#spin").classed("hidden", true);
    }, SPIN_WAIT);
}

function change_stack_exec(id, name) {

    d3.select("#spin").classed("hidden", false);
    
    func_flgs[name] = d3.select("#" + id).property("checked");
    var gene_th = parseInt(d3.select("#viewgene_rate").property("value"));
    var gene_max = parseInt(d3.select("#viewgene_number").property("value"));
    if (sort_state.y.name_list.length == 0) {
        sort_state.y.name_list = ["number_of_mutations"];
        sort_state.y.asc_list = [false];
    }
    dataset_gene = mut_data.get_dataset_gene(func_flgs, gene_th, gene_max, sort_state.y.name_list, sort_state.y.asc_list);
    d3.select("#filter_text").text("{num:,}".format({num: dataset_gene.uncut_length}));
    var dataset_checker = mut_data.get_dataset_checker(func_flgs, dataset_gene.total_keys);
    
    genes_length = dataset_gene.total_keys.length;
    
    update_div();
    update_gene_listbox(dataset_gene.total_keys);
    
    // bar-left update
    {
        for (var i=0; i < dataset_gene.keys.length; i++) {
            var data_index = dataset_gene.keys.length - i - 1;
            div_mut_bar_left.dataset[i].data = dataset_gene.data[data_index];
            div_mut_bar_left.dataset[i].keys = dataset_gene.keys[data_index];
            div_mut_bar_left.dataset[i].tooltips = dataset_gene.tooltips[data_index];
            
            div_mut_bar_left.dataset[i].enable = d3.select("#v" + data_index).property("checked");
        };

        div_mut_bar_left.keys = dataset_gene.total_keys;
        div_mut_bar_left.tags[0].values = dataset_gene.total_keys;
        div_mut_bar_left.tags[1].values = dataset_gene.total_nums;
        div_mut_bar_left.options.grid_xs[0].labels = dataset_gene.total_keys;
        div_mut_bar_left.options.grid_xs[0].keys = dataset_gene.total_keys;

        div_mut_bar_left.rect_draw();
        div_mut_bar_left.resize();
    }
    // bar-top update
    {
        for (var f = 0; f < div_mut_bar_top.dataset.length; f++) {
            div_mut_bar_top.dataset[f].enable = func_flgs[div_mut_bar_top.dataset[f].name];
        }
        div_mut_bar_top.change_stack();
    }
    // checker update
    {
        for (var i=0; i < dataset_checker.keys.length; i++) {
            var data_index = dataset_checker.keys.length - i - 1;
            div_mut_checker.dataset[i].data = dataset_checker.data[data_index];
            div_mut_checker.dataset[i].keys = dataset_checker.keys[data_index];
            div_mut_checker.dataset[i].keys2 = dataset_checker.keys2[data_index];
            div_mut_checker.dataset[i].tooltips = dataset_checker.tooltips[data_index];
            
            div_mut_checker.dataset[i].enable = d3.select("#v" + data_index).property("checked");
        };

        div_mut_checker.keys2 = dataset_gene.total_keys;
        div_mut_checker.tags2[0].values = dataset_gene.total_keys;
        div_mut_checker.tags2[1].values = dataset_gene.total_nums;
        div_mut_checker.options.grids[1].labels = new Array(dataset_gene.total_keys.length);
        div_mut_checker.options.grids[1].keys = dataset_gene.total_keys;
        
        div_mut_checker.rect_draw();
        div_mut_checker.resize();
    }
    // update sort-tag
    {
        var id_nums = mut_data.get_id_nums(func_flgs, dataset_id.data, dataset_id.keys);
        
        for (var o = 0; o < divs.length; o++) {
            for (var i = 0; i < divs[o].tags.length; i++) {
                if (divs[o].tags[i].note == "fix") continue;
                if (divs[o].tags[i].note == "sub") continue;
                
                if (divs[o].tags[i].note == "id_num") {
                    divs[o].tags[i].values = id_nums;
                }
                if (divs[o].tags[i].note == "water-fall") {
                    divs[o].tags[i].values = mut_data.get_id_flg_par_gene(divs[o].tags[i].name, func_flgs);
                }
            }
            
            // o == 2 (rect) �̂Ƃ��Atag2���ʂ�
            if (o != 2) continue;
            
            for (var i = 0; i < divs[o].tags2.length; i++) {
                if (divs[o].tags2[i].note == "fix") continue;
                if (divs[o].tags2[i].note == "sub") continue;
                
                if (divs[o].tags2[i].note == "id_num") {
                    divs[o].tags2[i].values = id_nums;
                }
                if (divs[o].tags2[i].note == "water-fall") {
                    divs[o].tags2[i].values = mut_data.get_id_flg_par_gene(divs[o].tags[i].name, func_flgs);
                }
            }
        }
    }
    // sort
    {
        // sort axis-x
        if (sort_state.x.waterfall == true) {
            sort_waterfall_exec();
        }
        else {
            div_mut_bar_top.sort(sort_state.x.name_list, sort_state.x.asc_list);
            div_mut_checker.sort(sort_state.x.name_list, sort_state.x.asc_list, "x");
            
            for (var i = 0; i< divs_sub.length; i++) {
                divs_sub[i].obj.sort(sort_state.x.name_list, sort_state.x.asc_list);
            }
        }

        // sort axis-y
        div_mut_bar_left.sort(sort_state.y.name_list, sort_state.y.asc_list);
        div_mut_checker.sort(sort_state.y.name_list, sort_state.y.asc_list, "y");
    }
    selection_retry();
}

// *********************************************
// sort functions
// *********************************************

function sort_reset(axis) {
    
    if (axis == "x") {
        sort_state.x.name_list = [].concat(SORT_STATE_DEFAULT_X.name_list);
        sort_state.x.asc_list = [].concat(SORT_STATE_DEFAULT_X.asc_list);
        sort_state.x.init = true;
        sort_state.x.waterfall = false;

        div_mut_bar_top.sort(sort_state.x.name_list, sort_state.x.asc_list);
        div_mut_checker.sort(sort_state.x.name_list, sort_state.x.asc_list, "x");
        
        d3.select("#sort_x_text").text("sample_ID(ASC)");
        
        d3.select("#xID_1").property("checked", true);
        d3.select("#xNum_0").property("checked", true);
        d3.select("#xGene_0").property("checked", true);
        d3.select("#gene_list").selectAll("option")[0][0].selected = true;
        
        for (var i = 0; i < divs_sub.length; i++) {
            divs_sub[i].obj.sort([divs_sub[i].obj.tags[0].name], [true]);
            d3.select("#xSub" + i + "_0").property("checked", true);
        }
        
        if (d3.select("#waterfall_number").property("value") == "") {
            d3.select("#waterfall_number").property("value", 30);
        }
    }
    else if (axis == "y") {
        sort_state.y.name_list = [].concat(SORT_STATE_DEFAULT_Y.name_list);
        sort_state.y.asc_list = [].concat(SORT_STATE_DEFAULT_Y.asc_list);
        sort_state.y.init = true;
        
        d3.select("#sort_y_text").text("number_of_mutations(DESC)");
        d3.select("#yNum_2").property("checked", true);
        d3.select("#yGene_0").property("checked", true);

        filter_gene();
    }
}

function sort(name, asc, axis) {
    var state;
    var state_default = {};
    var text_area;
    
    if (axis == "x") {
        state = sort_state.x;
        state_default.name_list = [].concat(SORT_STATE_DEFAULT_X.name_list);
        state_default.asc_list = [].concat(SORT_STATE_DEFAULT_X.asc_list);
        state_default.opt_btn = "#xID_";
        text_area = d3.select("#sort_x_text");
    }
    else if (axis == "y") {
        state = sort_state.y;
        state_default.name_list = [].concat(SORT_STATE_DEFAULT_Y.name_list);
        state_default.asc_list = [].concat(SORT_STATE_DEFAULT_Y.asc_list);
        state_default["opt_btn"] = "#yNum_";
        text_area = d3.select("#sort_y_text");

    }
    else {
        return;
    }
    
    var asc_flg;
    if (asc == 0) {
    }
    else if (asc == 1) {
        asc_flg = true;
    }
    else if (asc == 2) {
        asc_flg = false;
    }
    else {
        return;
    }
    
    // delete my name
    var index = state.name_list.indexOf(name)
    if (index >= 0) {
        state.name_list.splice(index, 1);
        state.asc_list.splice(index, 1);
    }
    
    if (asc == 0) {
        // if sort condisions are blank, set default
        if (state.name_list.length == 0) {
            d3.select(state_default["opt_btn"] + "1").property("checked", true);

            state.name_list = state_default.name_list;
            state.asc_list = state_default.asc_list;
            state.init = true;
        }
    }
    else{
        // if sort state == initial, delete default.
        if (state.init == true) {
            if (state_default.name_list.indexOf(name) < 0) {
                d3.select(state_default["opt_btn"] + "0").property("checked", true);
            }
            state.name_list = [name];
            state.asc_list = [asc_flg];
            state.init = false;
        }
        else {
            state.name_list.push(name);
            state.asc_list.push(asc_flg);
        }
    }
    
    //console.log(JSON.stringify(state));
    
    // call plot's sort function
    if (axis == "x") {
        
        div_mut_bar_top.sort(state.name_list, state.asc_list);
        div_mut_checker.sort(state.name_list, state.asc_list, "x");
        for (var i = 0; i< divs_sub.length; i++) {
            divs_sub[i].obj.tags[1].values = mut_data.get_id_nums(func_flgs, dataset_id.data, dataset_id.keys);
            divs_sub[i].obj.sort(state.name_list, state.asc_list);
        }
    }
    else if (axis == "y") {
        filter_gene();
    }
    
    // update page's text
    var text = "";
    for (var i = 0; i< state.name_list.length; i++) {
        if (i == 0) text = state.name_list[i];
        else text = text + " -> " + state.name_list[i];
        
        if (state.asc_list[i]) text = text + "(ASC)";
        else text = text + "(DESC)";
    }
    text_area.text(text);
}

function sort_gene() {
    var asc = 0;
    if (d3.select("#xGene_0").property("checked")) asc = 0;
    else if(d3.select("#xGene_1").property("checked")) asc = 1;
    else if(d3.select("#xGene_2").property("checked")) asc = 2;
    
    var obj = d3.select("#gene_list").selectAll("option");
    var name = "";
    for (var i = 0; i < obj[0].length; i++) {
        if (obj[0][i].selected == true) {
            name = obj[0][i].value;
            break;
        }
    }
    
    // add list to tag
    var list = mut_data.get_id_flg_par_gene(name, func_flgs);
    var tag_name = name;
    
    add_tag(div_mut_bar_top, div_mut_bar_top.tags, tag_name, list, "water-fall");
    add_tag(div_mut_checker, div_mut_checker.tags, tag_name, list, "water-fall");
    
    for (var i = 0; i< divs_sub.length; i++) {
        add_tag(divs_sub[i].obj, divs_sub[i].obj.tags, tag_name, list, "water-fall");
    }
    
    // sort
    sort(tag_name, asc, "x");
}

function sort_waterfall() {

    d3.select("#spin").classed("hidden", false);
    
    timer = setTimeout(function() {
        sort_waterfall_exec();
        d3.select("#spin").classed("hidden", true);
    }, SPIN_WAIT);
}

function sort_waterfall_exec() {
    sort_reset("x");
    sort_reset("y");
    
    var genes = [];
    for (var g = 0; g< dataset_gene.total_nums.length; g++) {
        genes.push([dataset_gene.total_keys[g], dataset_gene.total_nums[g]]);
    }
    
    genes.sort(function(a,b){
        if( a[1] < b[1] ) return 1;
        if( a[1] > b[1] ) return -1;
        return 0;
    });
    
    var waterfall_max = parseInt(d3.select("#waterfall_number").property("value"));
    for (var g = 0; g< genes.length; g++) {
        if (genes[g][1] < 1) break;
        if (g >= waterfall_max) break;
        // add list to tag
        var tag_name = genes[g][0];
        var list = mut_data.get_id_flg_par_gene(tag_name, func_flgs);
        
        
        add_tag(div_mut_bar_top, div_mut_bar_top.tags, tag_name, list, "water-fall");
        add_tag(div_mut_checker, div_mut_checker.tags, tag_name, list, "water-fall");
        
        for (var i = 0; i< divs_sub.length; i++) {
            add_tag(divs_sub[i].obj, divs_sub[i].obj.tags, tag_name, list, "water-fall");
        }
        
        sort_state.x.waterfall = true;
        
        // sort
        sort(tag_name, 2, "x");
    }
}

function sort_sub(index, asc) {
    var name = divs_sub[index].obj.tags[2].name;
    var list = divs_sub[index].obj.tags[2].values;
    
    add_tag(div_mut_bar_top, div_mut_bar_top.tags, name, list, "sub");
    add_tag(div_mut_checker, div_mut_checker.tags, name, list, "sub");
    
    for (var i = 0; i< divs_sub.length; i++) {
        if (i == index) continue;
        add_tag(divs_sub[i].obj, divs_sub[i].obj.tags, name, list, "sub");
    }
    sort(name, asc, "x");
    
}

function add_tag(obj, tags, name, list, note) {
    var find = false;
    for (var i = 2; i < tags.length; i++) {
        if (tags[i].name == name) {
            find = true;
            break;
        }
    }
    if (find == false) {
        var pos = tags.length;
        tags[pos] = new obj.tag_template(name);
        tags[pos].values = list;
        tags[pos].note = note;
    }
}

// ---------------------------------------------
// gene list-box
// ---------------------------------------------
function update_gene_listbox(genes) {

    listbox_items = [];
    for (var i = 0; i < genes.length; i++) {
        listbox_items.push(genes[i]);
    }
    listbox_items.sort(function(a,b){
        if( a < b ) return -1;
        if( a > b ) return 1;
        return 0;
    });
    
    d3.select("#gene_list")
      .selectAll("option")
      .remove();
    
    d3.select("#gene_list")
      .selectAll("option")
      .data(listbox_items)
      .enter()
      .append("option")
      .attr("value", function(d){ return d})
      .attr("selected", function(d, i){ if(i == 0) return "selected"})
      .text(function(d){ return d });
}

// *********************************************
// init
// *********************************************

function debg(start, before, now, prefix) {
    console.log(prefix + ":" + (now.getTime() - before)/1000 + ", total: " + (now.getTime() - start)/1000);
}
function init() {
    
    // radio button's status of func
    for (var i=0; i < mut_data.funcs.length; i++) {
        func_flgs[mut_data.funcs[i]] = d3.select("#v" + i).property("checked");
    }
    
    dataset_id = mut_data.get_dataset_id();
    
    var gene_th = parseInt(d3.select("#viewgene_rate").property("value"));
    var gene_max = parseInt(d3.select("#viewgene_number").property("value"));
    if (sort_state.y.name_list.length == 0) {
        sort_state.y.name_list = ["number_of_mutations"];
        sort_state.y.asc_list = [false];
    }
    
    dataset_gene = mut_data.get_dataset_gene(func_flgs, gene_th, gene_max, sort_state.y.name_list, sort_state.y.asc_list);
    d3.select("#filter_all_text").text("{num:,}".format({num: mut_data.genes.length}));
    d3.select("#filter_text").text("{num:,}".format({num: dataset_gene.uncut_length}));
    
    var dataset_checker = mut_data.get_dataset_checker(func_flgs, dataset_gene.total_keys);
    
    genes_length = dataset_gene.total_keys.length;
    
    update_div();
    update_gene_listbox(dataset_gene.total_keys);

    // ---------------------------------------------
    // bar-sample 
    // ---------------------------------------------

    for (var i=0; i < mut_data.funcs.length; i++) {
        var data_index = mut_data.funcs.length - i - 1;
        div_mut_bar_top.dataset[i] = new div_mut_bar_top.dataset_template(mut_data.funcs[data_index]);
        div_mut_bar_top.dataset[i].data = dataset_id.data[data_index];
        div_mut_bar_top.dataset[i].keys = dataset_id.keys[data_index];
        div_mut_bar_top.dataset[i].tooltips = dataset_id.tooltips[data_index];
        
        div_mut_bar_top.dataset[i].color_fill = mut_data.func_colors_n[data_index];
        div_mut_bar_top.dataset[i].color_fill_hilight = mut_data.func_colors_h[data_index];
        
        div_mut_bar_top.dataset[i].enable = d3.select("#v" + data_index).property("checked");
    };

    div_mut_bar_top.keys = mut_data.Ids;
    div_mut_bar_top.tags[0] = new div_mut_bar_top.tag_template("sample_ID");
    div_mut_bar_top.tags[0].values = mut_data.Ids;
    div_mut_bar_top.tags[0].note = "fix";
    div_mut_bar_top.tags[1] = new div_mut_bar_top.tag_template("number_of_mutations");
    div_mut_bar_top.tags[1].values = mut_data.get_id_nums(func_flgs, dataset_id.data, dataset_id.keys);
    div_mut_bar_top.tags[1].note = "id_num";
    
    div_mut_bar_top.options.resizeable_w = true;
    div_mut_bar_top.options.resizeable_h = true;
    div_mut_bar_top.options.tooltip.enable = true;
    div_mut_bar_top.options.tooltip.position = "bar";
    div_mut_bar_top.options.multi_select = MULTI_SELECT;
    div_mut_bar_top.options.padding_left = 1;
    div_mut_bar_top.options.padding_right = 1;
    div_mut_bar_top.options.padding_top = 1;
    div_mut_bar_top.options.padding_bottom = 1;
    div_mut_bar_top.options.direction_x = "left-right";
    div_mut_bar_top.options.direction_y = "bottom-up";
    
    div_mut_bar_top.options.grid_y = new div_mut_bar_top.grid_template();
    div_mut_bar_top.options.grid_y.ticks = 2;
    div_mut_bar_top.options.grid_y.wide = BAR_TOP_AXIS_Y;
    div_mut_bar_top.options.grid_y.border_color = "#DDC";
    div_mut_bar_top.options.grid_y.orient = "left";
    
    div_mut_bar_top.options.grid_xs[0] = new div_mut_bar_top.grid_template();
    div_mut_bar_top.options.grid_xs[0].keys = mut_data.Ids
//    div_mut_bar_top.options.grid_xs[0].labels = mut_data.Ids;
    div_mut_bar_top.options.grid_xs[0].labels = new Array(mut_data.Ids.length);
//    div_mut_bar_top.options.grid_xs[0].wide = 120;
    div_mut_bar_top.options.grid_xs[0].wide = 10;
    div_mut_bar_top.options.grid_xs[0].font_size = "9px";
    div_mut_bar_top.options.grid_xs[0].sift_x = 4;
    div_mut_bar_top.options.grid_xs[0].border_color = "#CCE";
    div_mut_bar_top.options.grid_xs[0].border_width = "2px";
    div_mut_bar_top.options.grid_xs[0].orient = "bottom";
    div_mut_bar_top.options.grid_xs[0].text_anchor = "end";
    div_mut_bar_top.options.grid_xs[0].text_rotate = "-90";

    div_mut_bar_top.options.titles[0] = new div_mut_bar_top.title_template("Sample");
    div_mut_bar_top.options.titles[0].orient = "top";
    div_mut_bar_top.options.titles[0].wide = 30;
    div_mut_bar_top.options.titles[0].text_anchor = "middle";
    div_mut_bar_top.options.titles[0].text_rotate = 0;
    div_mut_bar_top.options.titles[1] = new div_mut_bar_top.title_template("Number of mutation");
    div_mut_bar_top.options.titles[1].orient = "left";
    div_mut_bar_top.options.titles[1].wide = 0;
    div_mut_bar_top.options.titles[1].text_anchor = "middle";
    div_mut_bar_top.options.titles[1].text_rotate = -90;
    div_mut_bar_top.options.titles[1].font_size = "12px";
    div_mut_bar_top.options.titles[1].sift_x = 8;
    
    div_mut_bar_top.draw();

    // ---------------------------------------------
    // bar-gene 
    // ---------------------------------------------

    for (var i=0; i < mut_data.funcs.length; i++) {
        var data_index = mut_data.funcs.length - i - 1;
        div_mut_bar_left.dataset[i] = new div_mut_bar_left.dataset_template(mut_data.funcs[data_index]);
        div_mut_bar_left.dataset[i].data = dataset_gene.data[data_index];
        div_mut_bar_left.dataset[i].keys = dataset_gene.keys[data_index];
        div_mut_bar_left.dataset[i].tooltips = dataset_gene.tooltips[data_index];

        div_mut_bar_left.dataset[i].color_fill = mut_data.func_colors_n[data_index];
        div_mut_bar_left.dataset[i].color_fill_hilight = mut_data.func_colors_h[data_index];

        div_mut_bar_left.dataset[i].enable = d3.select("#v" + data_index).property("checked");
    };

    div_mut_bar_left.keys = dataset_gene.total_keys;
    div_mut_bar_left.tags[0] = new div_mut_bar_left.tag_template("name");
    div_mut_bar_left.tags[0].values = dataset_gene.total_keys;
    div_mut_bar_left.tags[0].note = "fix";
    div_mut_bar_left.tags[1] = new div_mut_bar_left.tag_template("number_of_mutations");
    div_mut_bar_left.tags[1].values = dataset_gene.total_nums;
    div_mut_bar_left.tags[1].note = "gene_num";
    
    div_mut_bar_left.options.resizeable_w = true;
    div_mut_bar_left.options.resizeable_h = true;
    div_mut_bar_left.options.tooltip.enable = true;
    div_mut_bar_left.options.tooltip.position = "bar";
    div_mut_bar_left.options.multi_select = MULTI_SELECT;
    div_mut_bar_left.options.padding_left = 1;
    div_mut_bar_left.options.padding_right = 1;
    div_mut_bar_left.options.padding_top = 1;
    div_mut_bar_left.options.padding_bottom = 1;
    div_mut_bar_left.options.direction_x = "top-down";;
    div_mut_bar_left.options.direction_y = "right-left";
    
    div_mut_bar_left.options.grid_y = new div_mut_bar_left.grid_template();
    div_mut_bar_left.options.grid_y.ticks = 2;
    div_mut_bar_left.options.grid_y.wide = BAR_LEFT_AXIS_Y;
    div_mut_bar_left.options.grid_y.border_color = "#DDC";
    div_mut_bar_left.options.grid_y.orient = "bottom";
    
    div_mut_bar_left.options.grid_xs[0] = new div_mut_bar_left.grid_template();
    div_mut_bar_left.options.grid_xs[0].labels = dataset_gene.total_keys;
    div_mut_bar_left.options.grid_xs[0].keys = dataset_gene.total_keys;
    div_mut_bar_left.options.grid_xs[0].wide = 80;
    div_mut_bar_left.options.grid_xs[0].font_size = "9px";
    div_mut_bar_left.options.grid_xs[0].sift_y = 4;
    div_mut_bar_left.options.grid_xs[0].border_color = "#CCE";
    div_mut_bar_left.options.grid_xs[0].border_width = "2px";
    div_mut_bar_left.options.grid_xs[0].orient = "right";
    div_mut_bar_left.options.grid_xs[0].text_anchor = "start";
    div_mut_bar_left.options.grid_xs[0].text_rotate = "0";

    div_mut_bar_left.options.titles[0] = new div_mut_bar_left.title_template("Genes");
    div_mut_bar_left.options.titles[0].orient = "left";
    div_mut_bar_left.options.titles[0].wide = 30;
    div_mut_bar_left.options.titles[0].text_anchor = "middle";
    div_mut_bar_left.options.titles[0].text_rotate = -90;
    div_mut_bar_left.options.titles[1] = new div_mut_bar_left.title_template("% Samples");
    div_mut_bar_left.options.titles[1].orient = "bottom";
    div_mut_bar_left.options.titles[1].wide = 0;
    div_mut_bar_left.options.titles[1].text_anchor = "middle";
    div_mut_bar_left.options.titles[1].text_rotate = 0;
    div_mut_bar_left.options.titles[1].font_size = "12px";
    div_mut_bar_left.options.titles[1].sift_y = -20;
    div_mut_bar_left.options.titles[2] = new div_mut_bar_left.title_template("with mutation");
    div_mut_bar_left.options.titles[2].orient = "bottom";
    div_mut_bar_left.options.titles[2].wide = 0;
    div_mut_bar_left.options.titles[2].text_anchor = "middle";
    div_mut_bar_left.options.titles[2].text_rotate = 0;
    div_mut_bar_left.options.titles[2].font_size = "12px";
    div_mut_bar_left.options.titles[2].sift_y = -8;
    
    div_mut_bar_left.draw();

    // ---------------------------------------------
    // checker 
    // ---------------------------------------------

    for (var i=0; i < mut_data.funcs.length; i++) {
        var data_index = mut_data.funcs.length - i - 1;
        div_mut_checker.dataset[i] = new div_mut_checker.dataset_template(mut_data.funcs[data_index]);
        div_mut_checker.dataset[i].data = dataset_checker.data[data_index];
        div_mut_checker.dataset[i].keys = dataset_checker.keys[data_index];
        div_mut_checker.dataset[i].keys2 = dataset_checker.keys2[data_index];
        div_mut_checker.dataset[i].tooltips = dataset_checker.tooltips[data_index];

        div_mut_checker.dataset[i].color_fill = mut_data.func_colors_n[data_index];
        div_mut_checker.dataset[i].color_fill_hilight = mut_data.func_colors_h[data_index];
        
        div_mut_checker.dataset[i].enable = d3.select("#v" + data_index).property("checked");
    };

    div_mut_checker.keys = mut_data.Ids;
    div_mut_checker.keys2 = dataset_gene.total_keys;

    div_mut_checker.tags[0] = new div_mut_checker.tag_template("sample_ID");
    div_mut_checker.tags[0].values = mut_data.Ids;
    div_mut_checker.tags[0].note = "fix";
    div_mut_checker.tags[1] = new div_mut_checker.tag_template("number_of_mutations");
    div_mut_checker.tags[1].values = div_mut_bar_top.tags[1].values;
    div_mut_checker.tags[1].note = "id_num";

    div_mut_checker.tags2[0] = new div_mut_checker.tag_template("name");
    div_mut_checker.tags2[0].values = dataset_gene.total_keys;
    div_mut_checker.tags2[0].note = "fix";
    div_mut_checker.tags2[1] = new div_mut_checker.tag_template("number_of_mutations");
    div_mut_checker.tags2[1].values = dataset_gene.total_nums;
    div_mut_checker.tags2[1].note = "gene_num";
    
    div_mut_checker.options.resizeable_w = true;
    div_mut_checker.options.resizeable_h = true;
    div_mut_checker.options.tooltip.enable = true;
    div_mut_checker.options.tooltip.position = "bar";
    div_mut_checker.options.multi_select = MULTI_SELECT;
    div_mut_checker.options.padding_left = 1 + BAR_TOP_AXIS_Y;
    div_mut_checker.options.padding_right = 1;
    div_mut_checker.options.padding_top = 1;
    div_mut_checker.options.padding_bottom = 1 + BAR_LEFT_AXIS_Y;
    div_mut_checker.options.direction_x = "left-right";
    div_mut_checker.options.direction_y = "top-down";
    
    // axis-x
    div_mut_checker.options.grids[0] = new div_mut_checker.grid_template();
    div_mut_checker.options.grids[0].axis = "x";
    div_mut_checker.options.grids[0].labels = new Array(mut_data.Ids.length);
    div_mut_checker.options.grids[0].keys = mut_data.Ids;
    div_mut_checker.options.grids[0].wide = 0;
    div_mut_checker.options.grids[0].font_size = "10px";
    div_mut_checker.options.grids[0].border_color = "#CCE";
    div_mut_checker.options.grids[0].border_width = "2px";
    div_mut_checker.options.grids[0].orient = "bottom";
    div_mut_checker.options.grids[0].text_anchor = "end";
    div_mut_checker.options.grids[0].text_rotate = "-90";
    
    // axis-y
    div_mut_checker.options.grids[1] = new div_mut_checker.grid_template();
    div_mut_checker.options.grids[1].axis = "y";
    div_mut_checker.options.grids[1].labels = new Array(dataset_gene.total_keys.length);
    div_mut_checker.options.grids[1].keys = dataset_gene.total_keys;
    div_mut_checker.options.grids[1].wide = 0;
    div_mut_checker.options.grids[1].font_size = "10px";
    div_mut_checker.options.grids[1].border_color = "#DDC";
    div_mut_checker.options.grids[1].border_width = "2px";
   
    div_mut_checker.draw();

    // ---------------------------------------------
    // sub-plots
    // ---------------------------------------------

    for (var i = 0; i < divs_sub.length; i++) {
        sub_plot(divs_sub[i]);
    }
    
    // ---------------------------------------------
    // sort
    // ---------------------------------------------
    {
        // sort axis-x
        div_mut_bar_top.sort(sort_state.x.name_list, sort_state.x.asc_list);
        div_mut_checker.sort(sort_state.x.name_list, sort_state.x.asc_list, "x");
        
        for (var i = 0; i< divs_sub.length; i++) {
            divs_sub[i].obj.sort(sort_state.x.name_list, sort_state.x.asc_list);
        }

        // sort axis-y
        div_mut_bar_left.sort(sort_state.y.name_list, sort_state.y.asc_list);
        div_mut_checker.sort(sort_state.y.name_list, sort_state.y.asc_list, "y");
    }

}

function sub_plot(sub) {
    
    var sub_dataset = mut_data.get_sub_data(sub.name);
    
    for (var i=0; i < sub_dataset.length; i++) {
        sub.obj.dataset[i] = new sub.obj.dataset_template("sub_" + sub.name + "_" + i);
        sub.obj.dataset[i].data = sub_dataset[i].data;
        sub.obj.dataset[i].keys = sub_dataset[i].keys;
        sub.obj.dataset[i].tooltips = sub_dataset[i].tooltips;
    
        sub.obj.dataset[i].color_fill = sub_dataset[i].color_n;
        sub.obj.dataset[i].color_fill_hilight = sub_dataset[i].color_h;
        
        sub.obj.dataset[i].enable = true;
    };
    
    sub.obj.keys = mut_data.Ids;
    sub.obj.tags[0] = new sub.obj.tag_template("sample_ID");
    sub.obj.tags[0].values = mut_data.Ids;
    sub.obj.tags[0].note = "fix";
    sub.obj.tags[1] = new sub.obj.tag_template("number_of_mutations");
    sub.obj.tags[1].values = div_mut_bar_top.tags[1].values;
    sub.obj.tags[1].note = "id_num";
    sub.obj.tags[2] = new sub.obj.tag_template("sub_" + sub.name);
    sub.obj.tags[2].values = mut_data.get_sub_values(sub.name);
    sub.obj.tags[2].note = "fix";

    sub.obj.options.resizeable_w = true;
    sub.obj.options.resizeable_h = true;
    sub.obj.options.tooltip.enable = true;
    sub.obj.options.tooltip.position = "bar";
    sub.obj.options.multi_select = MULTI_SELECT;
    
    sub.obj.options.padding_left = 1 + BAR_TOP_AXIS_Y;
    sub.obj.options.padding_right = 1;
    sub.obj.options.padding_top = 1;
    sub.obj.options.padding_bottom = 1;
    
    sub.obj.options.direction_x = "left-right";
    sub.obj.options.direction_y = "bottom-up";
    
    sub.obj.draw();
}
