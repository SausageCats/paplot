# -*- coding: utf-8 -*-
"""
Created on Wed Feb 03 12:31:47 2016

@author: okada

$Id: ca.py 205 2017-08-08 06:25:59Z aokada $
"""
import re

#
# JS template
#

js_header = """(function() {
ca_data = {};
"""

js_footer = """
})();
Object.freeze(ca_data);
"""

js_dataset = """
ca_data.node_size_detail = {node_size_detail}; // for detailed thumbnails
ca_data.node_size_thumb = {node_size_thumb}; // for thumbnails
ca_data.node_size_select = {node_size_select}; // for bar graph

// Genome content
// chr  : Sequential number
// size : Chromosome length
// color: RGB color
// label: Chromosome
ca_data.genome_size = [
{genome_size}
];

// Sample names that are the values of id column in data file
ca_data.index_ID = [{IDs}];

// Group information
// name : Group name
// label: Group name
// color: RGB color
ca_data.group = [{group}];

// Tooltip components obtained by decomposing a string of the tooltip_format
// format: label: For fix type, a string outside the braces
//       :      : Others, a string before the letter ":" in braces
//       : type : One of the following: fix, numeric, str
//       : keys : For fix type, empty string
//       :      : Others, a string that precedes the letter ":" in braces and excludes the arithmetic term
//       : ext  : For fix type, empty string
//       :      : Others, a string after the letter ":" in braces
//  keys : A concatenated string of the above "keys" values
ca_data.tooltip_format = {{ bundle:{tooltip}, }};

// Column names for option, but excluding the "group" and "id" columns
ca_data.link_header = [{link_header}];
"""

genome_size_template = '{{"chr":"{Chr:0>2}", "size":{size}, "color":"{color}", "label":"{label}",}}'
group_template = '{{"name":"{name}", "label":"{label}", "color":"{color}" }}'

js_links_1 = """
// 0:ID, 1:chr1, 2:break1, 3:chr2, 4:break2, 5:is_inner, 6:group_id, 7:tooltip_data
ca_data.links = ["""
links_template = '["{ID}","{Chr1:0>2}",{pos1},"{Chr2:0>2}",{pos2},{inner_flg},{group_id},[{tooltip}]],'
js_links_2 = "];\n"

js_selection = """
// select_value: The number of id values at a break position of a chromosome in a group
//             : The number of duplicate id's is also counted
ca_data.select_value = [{value}];

// select_key: [The index of ca_data.genome_size, Break position]
ca_data.select_key = [{key}];

// select_item: The indexes of ca_data.index_ID
ca_data.select_item = [{item}];
"""

#
# HTML template
#

def to_mintext(text):
    text = re.sub(r"\n\s+", "\n", text)
    text = re.sub(r"\n([<>])", "\\1", text)
    text = re.sub(r"\n", " ", text)
    text = re.sub(r" $", "\n", text)
    return text

# Rough thumbnail
li_template = """
<li class="thumb" id="thumb{id}_li">
  <div class="thumb_head" id="thumb{id}_head">
    <label><input type="checkbox" name="thumb_cb" value="{id}" checked="checked"
            onclick="ca_draw.auto_overlaying('cb_thumb')" />
    <span class="thumb_title"
     onmouseover="ca_draw.thumb_title_mouseover('#thumb{id}_head')"
     onmouseout="ca_draw.thumb_title_mouseout('#thumb{id}_head')"
    ><strong>{title}</strong></span></label>
  </div>
  <div class="thumb_circos" id="thumb{id}" onclick="ca_draw.show_float(event,'{id}','{title}')"></div>
</li>
"""
li_template = to_mintext(li_template)

call_template = 'ca_draw.draw_bandle_thumb("{id}", "{title}");\n'

# Detailed thumbnail
detail_template = """
<div class="float_frame" id="float{id}" onclick="fwin.bring_window_to_front('#float{id}')">
  <table>
    <tr>
      <td rowspan="2" colspan="2" class="float_title" id="float{id}_t"><strong>{title}</strong></td>
      <td><input type="button" value="X" class="float_close" onclick="ca_draw.hide_float('{id}')" margin="0" /></td>
    </tr>
    <tr><td><input type="button" value="D" class="float_data" onclick="viewer.update({id})" /></td></tr>
    <tr><td colspan="2" class="float_svg" id="map{id}"></td></tr>
  </table>
  <div class="float_handle" id="float{id}_h"
    onmousedown="fwin.mouse_down(event, '#float{id}', '#float{id}_h')"
    onmousemove="fwin.mouse_move(event, '#float{id}')"
    onmouseup="fwin.mouse_up(event, '#float{id}')"
    onmouseout="fwin.mouse_out('#float{id}')"
  ></div>
  <div id="view{id}" class="view">
    <div class="view_area_source view_area_common">
      <div>
        <div class="view_autoscroll">
          <input type="checkbox" id="view_autoscroll{id}" />
          <label for="view_autoscroll{id}"><span></span></label>
        </div>
        <input type="button" value="Clear" onclick="viewer.clear({id})" />
        <input id="view_extract{id}" type="button" value="Extract" onclick="viewer.extract({id})" />
        <input type="button" value="Uncheck" onclick="viewer.uncheck({id})" />
      </div>
      <div class="view_mode">
        <div><label for="view_mode" onchange="viewer.change_extract({id})"><select id='view_mode{id}'>
          <option value="startend" selected>Extract data based on start and end points</option>
          <option value="start">Extract data based on start point</option>
          <option value="end">Extract data based on end point</option>
        </select></label></div>
      </div>
      <hr class="view_hr">
      <input type="button" value="Save" onclick="viewer.save({id}, 'source')" />
      <div id="view{id}_data_source" class="view_data_common"><ul></ul></div>
    </div>
    <hr class="view_hr">
    <div class="view_area_target view_area_common">
      <div><input type="button" value="Save" onclick="viewer.save({id}, 'target')" /></div>
      <div id="view{id}_data_target" class="view_data_common"><ul></ul></div>
    </div>
  </div>
  <div id="view_vline{id}" onmousedown="viewer.vline_mousedown(event, '{id}')"></div>
</div>
"""
detail_template = to_mintext(detail_template)

overlay_template = """
<div id="overlay" style="margin: 10px;">
<div class="float_frame" id="float{id}" onclick="fwin.bring_window_to_front('#float{id}')">
  <table>
    <tr>
      <td class="float_title" id="float{id}_t"><strong>OVERLAY</strong></td>
      <td><input type="button" value="X" class="float_close" onclick="ca_draw.close_overlay()" margin="0" /></td>
    </tr>
    <tr><td colspan="2" class="float_svg" id="map{id}"></td></tr>
  </table>
  <div class="float_handle" id="float{id}_h"
    onmousedown="fwin.mouse_down(event, '#float{id}', 'float{id}_h')"
    onmousemove="fwin.mouse_move(event, '#float{id}')"
    onmouseup="fwin.mouse_up(event, '#float{id}')"
    onmouseout="fwin.mouse_out('#float{id}')"
  ></div>
</div>
</div>
"""
overlay_template = to_mintext(overlay_template)


#
# functions
#

def load_genome_size(config):
    """
    Read and parse a genome-size file and return a nested list:
    [ [ A chromosome number in lowercase letters,
        The size of the 1st element,
        The color of the 1st element,
        The original name of the 1st element(that is not necessarily lowercase) or a user-defined name,
      ],
      ...
    ]
    """
    import os
    import paplot.subcode.tools as tools

    default_path = os.path.dirname(os.path.abspath(__file__)) + "/templates/genome_size_hg19.csv"  # ./templates/genome_size_hg19.csv
    path = tools.config_getpath(config, "genome", "path", default_path)

    # Create a list with Name:Label:Color for each element
    # Name is like chromosome number such as 1, 2, ..., X, Y, ...
    # :Label and :Color is optional
    settings = tools.config_getstr(config, "ca", "use_chrs").replace(" ", "").split(",")

    use_chrs = []
    labels = []
    colors = []
    for i in range(len(settings)):
        # items[0]: Name corresponding to chromosome number
        # items[1]: Label
        # items[2]: Color
        items = settings[i].split(":")
        use_chrs.append(items[0].lower())  # Conversion of chromosome number to lowercase
        labels.append("")
        colors.append("#BBBBBB")  # gray

        for j in range(len(items)):
            if j == 0:
                if items[j][0:3] == "chr":
                    use_chrs[i] = items[j][3:]  # Remove the leading "chr"
            elif j == 1:
                labels[i] = items[j]
            elif j == 2:
                colors[i] = items[j]
    if len(use_chrs) < 1:
        return []

    # Read genome size
    f = open(path)
    read = f.read()
    f.close()
    formatt = read.replace("\r", "\n").replace(" ", "")

    genome_size = []
    _max = 0
    for row in formatt.split("\n"):
        # Delimiter setting
        sept = ","
        if row.find(",") < 0:
            sept = "\t"

        # Split the line and the second element must be numeric
        # item[0]: chromosome number
        # item[1]: size of item[0]
        items = row.split(sept)
        if len(items) < 2:
            continue
        if items[1].isdigit() is False:
            continue

        # The first element must be included in the list of chromosome numbers extracted from the configuration file
        label = items[0].lower()  # Convert label to lowercase
        if label[0:3] == "chr":
            label = label[3:len(label)]  # Remove the leading "chr"
        if (label in use_chrs) is False:
            continue

        # Create a list that is an element of genome_size
        # The list has the following elements
        #   1st: A chromosome number in lowercase letters
        #   2st: The size of the 1st element
        #   3st: The color of the 1st element
        #   4st: The original name of the 1st element(that is not necessarily lowercase) or a user-defined name
        # genome_size is in the order read from the genome-size file instead of the configuration file
        pos = use_chrs.index(label)
        if labels[pos] == "":
            labels[pos] = items[0]
        genome_size.append([label, int(items[1]), colors[pos], labels[pos]])

        # Maximum size of the chromosome
        if _max < int(items[1]):
            _max = int(items[1])

    # The minimum size of the chromosomes is set to 1/10 of the maximum size
    for i in range(len(genome_size)):
        if genome_size[i][1] < int(_max / 10):
            genome_size[i][1] = int(_max / 10)

    return genome_size

def calc_node_size(genome_size, total):
    """Return node size"""
    # total is 250 or 500
    # Determine total and minimum length of chromosomes
    _sum = 0
    _min = genome_size[0][1]  # size of chr[0]
    for i in range(len(genome_size)):
        _sum += genome_size[i][1]  # size of chr[i]
        if _min > genome_size[i][1]:
            _min = genome_size[i][1]
    # Determine node size
    size = int(_sum / (total - len(genome_size)))
    if _min <= size:
        size = _min - 1
    return size

def insite_genome(genome_size, chrom, pos):
    """
    Return a list of [index, length]
    index : Index of argument2 (chromosome) in the genome list
          : -1 if the element is not present
    length: -1 if index is -1
          : 0 if the argument3 (pos) is within the length of the argument2
          : Otherwise, the length of the argument2
    """
    for i in range(len(genome_size)):
        label = chrom.lower()
        if label[0:3] == "chr":
            label = label[3:len(label)]
        if genome_size[i][0] == label:    # genome_size[i][0]: chromosome
            if genome_size[i][1] >= pos:  # genome_size[i][1]: length of chromosome
                return [i, 0]
            else:
                return [i, genome_size[i][1]]
    return [-1, -1]

def output_html(output_di, positions, config):
    """
    Create JavaScript and HTML files

    Parameters
    ----------
    output_di: dict
             : Has the following keys and values
               'dir'    : Project directory full path
               'data'   : filenames for formatted data
               'js'     : JavaScript file name
               'html'   : HTML file name
               'project': Project name given by user on command line
               'title'  : Report title. The default is "CA graphs"
    positions: a nested dict
             : For example, the following dictionary
               'must'  : {'chr1': 'Chr1', 'break1': 'Break1', 'chr2': 'Chr2', 'break2': 'Break2'},
               'option': {'id': 'Sample'}
               The 'must' and 'option' values correspond to the column names in the data file (output_di['data'])
    config: configparser.RawConfigParser

    Return
    ------
    True on success
    """
    data = convert_tojs(output_di["dir"] + "/" + output_di["data"], output_di["dir"] + "/" + output_di["js"], positions, config)
    # data is a dictionary like this:
    # {
    #   'id_list'   : ['SAMPLE1', 'SAMPLE2', ... ],
    #   'group_list': ['outer'  , 'inner'],
    #   'color'     : ['#9E4A98', '#51BF69']
    # }
    if data is not None:
        create_html(data, output_di, config)
        return True

    return False

def convert_tojs(input_file, output_file, positions, config):
    '''
    Convert the input files to Json data and write them to the Javascript file
    Also write functions and methods to process those data

    Parameters
    ----------
    input_file : str : The absolute path of formatted data file
    output_file: str : The absolute path of JavaScript file
    positions  : dict: A nested dictionary with "must" and "option" as keys
    config     : configparser.RawConfigParser

    Return
    ------
    On success, return a dictionary: {"id_list": [...] "group_list": [...], "color": [...]}
        id_list   : The values for id column
        group_list: The names of groups
        color     : The colors in groups
    '''
    import paplot.subcode.data_frame as data_frame
    import paplot.subcode.merge as merge
    import paplot.subcode.tools as tools
    import paplot.convert as convert
    import os
    import math

    # genome_size: a nested list
    # [ [ A chromosome number in lowercase letters,
    #     The size of the 1st element,
    #     The color of the 1st element,
    #     The original name of the 1st element(that is not necessarily lowercase) or a user-defined name, ], ... ]
    genome_size = load_genome_size(config)
    if len(genome_size) == 0:
        return None

    # genome: dictionary-style string like this
    # {"chr":"00", "size":249250621, "color":"#BBBBBB", "label":"1",},
    # {"chr":"01", "size":243199373, "color":"#BBBBBB", "label":"2",},
    # ...
    # chr  : Sequential number
    # size : Size corresponding to the label
    # color: Color corresponding to the label
    # label: Name corresponding to chromosome
    genome = ""
    for i in range(len(genome_size)):
        if len(genome) > 0:
            genome += ",\n"
        genome += genome_size_template.format(Chr=i, size=genome_size[i][1], color=genome_size[i][2], label=genome_size[i][3])

    # Create a data frame that has title and data attributions
    # title is a list like ['Break1', 'Break2', 'Chr1', 'Chr2', 'Sample']
    # data is a nested list like [[16019088, 62784483, '14', '12', 'SAMPLE1'], ...]
    try:
        df = data_frame.load_file(
            input_file, header=1,
            sept=tools.config_getstr(config, "result_format_ca", "sept"),
            comment=tools.config_getstr(config, "result_format_ca", "comment")
        )
    except Exception as e:
        print("failure open data %s, %s" % (input_file, e.message))
        return None
    if len(df.data) == 0:
        print("no data %s" % input_file)
        return None

    # Create groups, labels, and colors_n
    # cols_di: a dictionary that merges must and option values
    #        : ex) {'chr1': 'Chr1', 'break1': 'Break1', 'chr2': 'Chr2', 'break2': 'Break2', 'id': 'Sample'}
    cols_di = merge.position_to_dict(positions)
    if "group" in cols_di:
        for i in range(len(df.data)):
            # A title may be stored in cols_di["group"]
            group_pos = df.name_to_index(cols_di["group"])  # Get group(title) index
            group = df.data[i][group_pos]                   # Get group(title) value for row i
            # Modify group value
            df.data[i][group_pos] = group.replace(" ", "_")
            if group == "":
                df.data[i][group_pos] = "_blank_"
        # groups  : list: group names
        # labels  : list: group names
        # colors_n: list: color values for groups
        [groups, colors_n] = convert.group_list(df.column(cols_di["group"]), "ca", "group", config)
        labels = groups
    else:
        groups = ["outer", "inner"]
        labels = ["Inter-chromosome", "Intra-chromosome"]
        colors_n = ["#9E4A98", "#51BF69"]  # purple, green

    # Create group_text that is a dictionary-style string with name, label, color
    conbined = []
    for i in range(len(groups)):
        conbined.append(group_template.format(name=groups[i], label=labels[i], color=colors_n[i]))
    group_text = ",".join(conbined)

    # id_list: Values for "id" column
    #        : Sorted without duplicates
    id_list = []
    for row in df.data:
        iid = row[df.name_to_index(cols_di["id"])]  # iid: column value for "id" title
        if iid != "":
            id_list.append(iid)
    id_list = list(set(id_list))
    id_list.sort()

    # option_keys: Store the option keys of the positions dictionary
    option_keys = tools.dict_keys(cols_di)  # option_keys: list: sorted keys of cols_di
    option_keys.remove("id")      # option key
    option_keys.remove("chr1")    # must key
    option_keys.remove("break1")  # must key
    option_keys.remove("chr2")    # must key
    option_keys.remove("break2")  # must key
    if "group" in option_keys:
        option_keys.remove("group")  # option key

    # node_size: Size to divide chromosomes
    node_size_select = tools.config_getint(config, "ca", "selector_split_size", 5000000)

    # Write header and dataset of JavaScript file

    f = open(output_file, "w")
    f.write(js_header + js_dataset.format(
        node_size_detail=calc_node_size(genome_size, 500),  # node size for detailed thumbnails
        node_size_thumb=calc_node_size(genome_size, 250),   # node size for rough thumbnails
        node_size_select=node_size_select,                  # node size for bar graph
        genome_size=genome,                 # A dictionary-style string containing keys of "chr", "size", "color", and "label"
        IDs=convert.list_to_text(id_list),  # A comma-separated string of id column values
        group=group_text,                   # A dictionary-style string containing keys of "name", "label", and "color"
        tooltip=convert.pyformat_to_jstooltip_text(cols_di, config, "ca", "result_format_ca", "tooltip_format"),  # A dictionary-style string containing keys of "name", "label", and "color"
        link_header=convert.list_to_text(option_keys),
    ))

    # Write link of JavaScript file

    f.write(js_links_1)  # Write the leading part

    data_links = []
    for row in df.data:
        iid = row[df.name_to_index(cols_di["id"])]  # iid: the value of "id" column
        # Ignore empty string
        if iid == "":
            continue

        chr1 = str(row[df.name_to_index(cols_di["chr1"])])  # chromosome1
        pos1 = row[df.name_to_index(cols_di["break1"])]     # break point1
        chr2 = str(row[df.name_to_index(cols_di["chr2"])])  # chromosome2
        pos2 = row[df.name_to_index(cols_di["break2"])]     # break point2

        # Check if chr1 and chr2 is in the genome list
        # Check if pos1 and pos2 is in the chr1 length
        # index1 and index2 are indexes of the genome_size for chr1 and chr2
        [index1, rang] = insite_genome(genome_size, chr1, pos1)
        if rang > 0:
            print("breakpoint 1 is over range. chr%s: input=%d, range=%d" % (chr1, pos1, rang))
            continue
        if rang < 0:
            #print("chr1 is undefined. %s" % (chr1))
            continue
        [index2, rang] = insite_genome(genome_size, chr2, pos2)
        if rang > 0:
            print("breakpoint 2 is over range. chr%s: input=%d, range=%d" % (chr2, pos2, rang))
            continue
        if rang < 0:
            #print("chr2 is undefined. %s" % (chr2))
            continue

        # Whether chr1 and chr2 are the same chromosome
        inner_flg = "false"
        if (chr1 == chr2):
            inner_flg = "true"

        # Set group_id: -1, 0, 1, index values of groups
        #             : Sequential numbers identifying groups
        group_id = -1  # Not belong to any groups
        if "group" in cols_di:
            # If the value of group column is in group list, then group_id is the index of the list
            # Others, group_id is -1
            group_id = convert.value_to_index(groups, row[df.name_to_index(cols_di["group"])], -1)
        else:
            if inner_flg == "false":
                group_id = 0  # chr1 and chr2 are in the different group
            else:
                group_id = 1  # chr1 and chr2 are in the same group

        # Add an element to data_links
        data_links.append([iid, index1, pos1, index2, pos2, group_id])

        # tooltip_items: Data for tooltip
        tooltip_items = []
        for k in range(len(option_keys)):  # Loop in the column titles except group, id, and must keys (chr1, chr2, break1, and break2)
            key = option_keys[k]
            if cols_di[key] == "":
                continue
            tooltip_items.append(row[df.name_to_index(cols_di[key])])

        # Write link
        f.write(links_template.format(
            ID=iid,
            Chr1=index1, pos1=pos1, Chr2=index2, pos2=pos2,
            inner_flg=inner_flg,
            group_id=group_id,
            tooltip="[" + convert.list_to_text(tooltip_items) + "],"))

    f.write(js_links_2)  # Write the ending part

    # Write integral bar item

    # link: [{bp1: iid, bp2: iid}, {...}, ...]
    #     : Separate elements by group_id
    link = []
    for g in range(len(groups)):
        link.append({})

    for dl in data_links:
        # dl = [iid, index1, pos1, index2, pos2, group_id]
        # iid     : The value of id title
        # index1/2: The index of genome_size
        # pos1/2  : Bareak point
        # group_id: Index of groups

        # Chr: The index of genome_size
        # Pos: A break position based on node
        bp1 = "root.{Chr:0>2}.{Chr:0>2}_{Pos:0>3}".format(Chr=dl[1], Pos=int(math.floor(dl[2] / node_size_select)))
        bp2 = "root.{Chr:0>2}.{Chr:0>2}_{Pos:0>3}".format(Chr=dl[3], Pos=int(math.floor(dl[4] / node_size_select)))

        group_id = dl[5]

        # For bp1
        if bp1 not in link[group_id]:
            link[group_id][bp1] = []
        link[group_id][bp1].append(dl[0])  # Append iid

        # For bp2
        if bp1 != bp2:
            if bp2 not in link[group_id]:
                link[group_id][bp2] = []
            link[group_id][bp2].append(dl[0])  # Append iid

    select_value_text = ""
    select_key_text = ""
    select_item_text = ""
    for i in range(len(groups)):
        values = []  # [Number of id, ...]
        keys = []    # [[genome_size index, Break position], ...]
        items = []   # [[id_list index, ...], ...]

        for bp in sorted(link[i].keys()):
            # values element
            # link[i][bp]: list that stores id column values at a break position of a chromosome in a group
            #            : Duplicate values are stored
            values.append(len(link[i][bp]))

            # keys element
            parts = bp.split(".")[2].split("_")  # parts: [Chr, Pos]
            keys.append([int(parts[0]), int(parts[1])])

            # items element
            sort = sorted(list(set(link[i][bp])))  # Delete duplicates
            temp = []
            for t in sort:
                temp.append(id_list.index(t))  # id_list that stores values of id column
            items.append(temp)

        select_value_text += "[%s]," % (",".join(map(str, values)).replace(" ", ""))  # += [1,1,...],
        select_key_text += "[%s]," % (",".join(map(str, keys)).replace(" ", ""))      # += [[0,1],[0,25],...],
        select_item_text += "[%s]," % (",".join(map(str, items)).replace(" ", ""))    # += [[9],[8],...],

    f.write(js_selection.format(
        value=select_value_text,
        key=select_key_text,
        item=select_item_text
    ))

    # Write rest of JavaScript file and footer

    f_template = open(os.path.dirname(os.path.abspath(__file__)) + "/templates/data_ca.js")  # ./templates/data_ca.js
    js_function = f_template.read()
    f_template.close()
    f.write(js_function)
    f.write(js_footer)

    f.close()

    return {"id_list": id_list, "group_list": groups, "color": colors_n}

def create_html(dataset, output_di, config):
    """
    Create HTML file for CA

    Parameters
    ----------
    dataset: dict: {"id_list"   : [id column values],
                    "group_list": [group names],
                    "color"     : [group colors]}
    output_di: dict: {"dir"    : project directory full path,
                      "data"   : filenames for formatted data
                      "js"     : JavaScript file name
                      "html"   : HTML file name
                      "project": Project name given by user on command line
                      "title"  : Report title. The default is "CA graphs"}
    config: configparser.RawConfigParser

    Return
    ------
    None
    """
    import os
    import paplot.prep as prep
    import paplot.subcode.tools as tools

    # Create strings of thumbnails to embed in HTML
    div_txt = ""
    call_txt = ""
    detail_txt = ""
    for i in range(len(dataset["id_list"])):
        div_txt += li_template.format(id=str(i), title=dataset["id_list"][i])         # Rough thumbnail
        detail_txt += detail_template.format(id=str(i), title=dataset["id_list"][i])  # Detailed thumbnail
        call_txt += call_template.format(id=str(i), title=dataset["id_list"][i])      # Drawing rough thumbnail
#        if i >= 50:
#            if i == 50:
#                call_txt += call_later_header
#            call_txt += call_later_template.format(id = str(i), title = dataset["id_list"][i])
#        else:
#            call_txt += call_template.format(id = str(i), title = dataset["id_list"][i])

    # Overlay
    overlay_txt = overlay_template.format(id=str(len(dataset["id_list"])))

    # Get HTML template
    f_template = open(os.path.dirname(os.path.abspath(__file__)) + "/templates/graph_ca.html")  # ./templates/graph_ca.html
    html_template = f_template.read()
    f_template.close()

    # Create HTML file
    f_html = open(output_di["dir"] + "/" + output_di["html"], "w")  # Create a file under the project directory
    f_html.write(
        html_template.format(
            project=output_di["project"],  # Project name
            title=output_di["title"],      # Report title
            data_js=output_di["js"],       # JavaScript file
            version=prep.version_text(),   # Paplot version
            date=tools.now_string(),       # Cuurent time
            div_list=div_txt,              # Rough thumbnail
            details=detail_txt,            # Detailed thumbnail
            overlay=overlay_txt,           # Overlay thumbnail
            call_list=call_txt,            # Drawing rough thumbnail
            style="../style/%s" % os.path.basename(tools.config_getpath(config, "style", "path", "default.js")),  # ./style/default.js
        ))
    f_html.close()
