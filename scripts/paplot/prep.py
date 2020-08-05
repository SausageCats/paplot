# -*- coding: utf-8 -*-
"""
Created on Wed Dec 02 17:43:52 2015

@author: okada

$Id: prep.py 189 2017-01-25 06:47:57Z aokada $
"""

def copy_dir_lib(dst):
    """Copy ./lib directory to the destination directory"""
    import shutil
    import os
    import glob

    pattern = os.path.dirname(os.path.abspath(__file__)) + "/lib/*/*"  # ./lib/*/*
    li_files = glob.glob(pattern)

    for f in li_files:
        dst_dir = dst + "/" + os.path.basename(os.path.dirname(f))
        if os.path.exists(dst_dir) is False:
            os.mkdir(dst_dir)
        shutil.copy(f, dst_dir)

def copy_dir_js(dst):
    """Copy ./js directory to the destination directory"""
    import shutil
    import os
    import glob

    pattern = os.path.dirname(os.path.abspath(__file__)) + "/js/*"  # ./js/*
    li_files = glob.glob(pattern)

    for f in li_files:
        shutil.copy(f, dst)

def copy_dir_style(dst, config):
    """Copy ./style directory to the destination directory"""
    import paplot.subcode.tools as tools
    import shutil
    import os
    import glob

    pattern = os.path.dirname(os.path.abspath(__file__)) + "/style/*"  # ./style/*
    li_files = glob.glob(pattern)

    for f in li_files:
        shutil.copy(f, dst)

    # for option file
    option = tools.config_getpath(config, "style", "path")  # Additional style file
    if len(option) > 0:
        shutil.copy(option, dst)

def copy_dir_layout(dst):
    """Copy ./layout directory to the destination directory"""
    import shutil
    import os
    import glob

    pattern = os.path.dirname(os.path.abspath(__file__)) + "/layout/*"  # ./layout/*
    li_files = glob.glob(pattern)

    for f in li_files:
        shutil.copy(f, dst)

def create_dirs(args_output_dir, project_name, config):
    """
    Create an output directory hierarchy
    Return the project directory path
    """
    # output directory
    #   +--- project_name
    #   +--- js
    #   +--- lib
    #   +--- style
    #   +--- layout
    import os

    output_dir = os.path.abspath(args_output_dir)
    if (os.path.exists(output_dir) is False):
        os.makedirs(output_dir)

    # Create subdirectories in the output directory

    output_html_dir = output_dir + "/" + project_name  # project directory path
    if (os.path.exists(output_html_dir) is False):
        os.makedirs(output_html_dir)

    output_js_dir = output_dir + "/js"
    if (os.path.exists(output_js_dir) is False):
        os.makedirs(output_js_dir)

    output_lib_dir = output_dir + "/lib"
    if (os.path.exists(output_lib_dir) is False):
        os.makedirs(output_lib_dir)

    output_style_dir = output_dir + "/style"
    if (os.path.exists(output_style_dir) is False):
        os.makedirs(output_style_dir)

    output_layout_dir = output_dir + "/layout"
    if (os.path.exists(output_layout_dir) is False):
        os.makedirs(output_layout_dir)

    # Copy to the subdirectories
    copy_dir_js(output_js_dir)
    copy_dir_lib(output_lib_dir)
    copy_dir_style(output_style_dir, config)
    copy_dir_layout(output_layout_dir)

    return output_html_dir

def version_text():
    from paplot import __version__
    return "paplot-" + __version__

# -------------------------------------
# methods for write index.html
# -------------------------------------
_META_FILE_ = ".meta.json"

def _convert_index_item(json_data):
    """Create and return html string for the link using elements from json data"""

    proj_template = """<h2>{proj}</h2>
<table style="margin-left:40px;">
{graphs}
</table>"""
    graph_templete = "<tr><td><img src='layout/{icon}'></td><td class='title'>{link}</td><td class='text'>...{overview}</td></tr>"
    link_templete = "<a class='plot' href='{proj}/{output_html}' target=_blank>{name}</a>"
    unlink_templete = "{name}"
    graph_templete_table = """<tr><td><img src="layout/folder.png"></td><td class="title">{name}</td><td class="text">...{overview}</td></tr>
    <tr><td colspan=3>
    <table style="margin-left:40px;"><tr>
        {td}
    </tr></table>
    </td></tr>"""
    graph_templete_td = "<td><img src='layout/{icon}'></td><td class='text'>{link}</td>"
    link_templete_td = "<a class='plot' href='{proj}/{output_html}' target=_blank>{sub_text}</a>"

    output = ""
    for data in json_data:
        graphs_text = ""
        for graph in data["graphs"]:
            # Check the existence of multiple reports
            if graph["composite"] is True:
                td_text = ""
                for item in graph["items"]:
                    # Default string for link
                    link_text = item["sub_text"]
                    if link_text == "":
                        link_text = "No Data."
                    else:
                        link_text += ", No Data."
                    # Overwrite the string if the report exists
                    icon = "block.png"
                    if item["exists"]:  # Check whether report html exists
                        # html for link
                        link_text = link_templete_td.format(proj=data["proj"], output_html=item["output_html"], sub_text=item["sub_text"])
                        icon = "bar_chart_1.png"
                    # html for icon of link
                    td_text += graph_templete_td.format(icon=icon, link=link_text)
                # html for folder icon, report title, and summary
                graphs_text += graph_templete_table.format(name=graph["name"], overview=graph["overview"], td=td_text)
            else:
                item = graph["items"][0]
                # Defult string for html
                link_text = unlink_templete.format(name=graph["name"])  # html for project name
                icon = "block.png"
                overview = "No Data."
                # Overwrite the string if the report exists
                if item["exists"]:
                    # html for link
                    link_text = link_templete.format(proj=data["proj"], output_html=item["output_html"], name=graph["name"])
                    icon = "bar_chart_1.png"
                    overview = graph["overview"]
                # html for icon of link and report summary
                graphs_text += graph_templete.format(icon=icon, link=link_text, overview=overview)

        # html for project name
        output += proj_template.format(proj=data["proj"], graphs=graphs_text)

    return output

def _load_metadata(output_dir, output_html, project_name, name, overview, sub_text, composite, exists):
    """Return json data containing project information"""
    import json

    arg_data = {"proj": project_name,                # Project name
                "graphs": [{"name": name,            # Report title
                            "overview": overview,    # Report summary
                            "composite": composite,  # Existence of multiple reports
                            "items": [{"output_html": output_html,  # HTML file name
                                       "exists": exists,            # Existence of Homepage
                                       "sub_text": sub_text}]       # Additional string
                            }]}

    # Update json data if it already exists
    # Create a new json data if it does not exist
    try:
        json_data = json.load(open(output_dir + "/" + _META_FILE_))  # Hidden file

        # Input args to json_data
        find = False
        for data in json_data:
            # Ignore a known project name
            if data["proj"] != project_name:
                continue

            for graph in data["graphs"]:
                # Ignore an unknown report name
                if graph["name"] != name:
                    continue
                for item in graph["items"]:
                    # Ignore an unknown HTML
                    if item["output_html"] != output_html:
                        continue
                    item["exists"] = exists
                    item["sub_text"] = sub_text
                    find = True
                    break

                if find is False:
                    # Add an unknown HTML items
                    graph["items"].append(arg_data["graphs"][0]["items"][0])
                    find = True
                break

            if find is False:
                # Add an unknown report items
                data["graphs"].append(arg_data["graphs"][0])
                find = True
            break

        if find is False:
            # Add an unknown project items
            json_data.append(arg_data)

    except Exception:
        # New items
        json_data = [arg_data]

    # Write json data
    f = open(output_dir + "/" + _META_FILE_, "w")
    f.writelines(json.dumps(json_data, indent=2))
    f.close()

    return json_data

def create_index(config, output_dir, output_html, project_name, name, overview="", sub_text="", composite=False, remarks=""):
    """
    Create homepage

    Parameters
    ----------
    config      : configparser.RawConfigParser
    output_dir  : string: Output directory path
    output_html : string: HTML file name
    project_name: string: Project name given by user on command line
    name        : string: Report title
    overview    : string: Report summary
    sub_text    : string: Additional string to display if composite=True and a report does not exist
    composite   : bool  : Whether or not to have multiple reports
    remarks     : string: Additional information about report

    Return
    ----------
    None
    """

    import paplot.subcode.tools as tools
    import os

    # Confirm existence of homepage
    html_exists = os.path.exists(output_dir + "/" + project_name + "/" + output_html)
    if output_html == "":
        html_exists = False

    # Create json data
    json_data = _load_metadata(output_dir, output_html, project_name, name, overview, sub_text, composite, html_exists)

    # Create html for link
    link_text = _convert_index_item(json_data)

    # Load the template html for the homepage
    f_template = open(os.path.dirname(os.path.abspath(__file__)) + "/templates/index.html")  # ./templates/index.html
    html_template = f_template.read()
    f_template.close()

    # Extract remarks from a configuration
    if remarks == "":
        remarks = tools.config_getstr(config, "style", "remarks")

    # Create html file for a homepage
    f_html = open(output_dir + "/index.html", "w")
    f_html.write(html_template.format(
        version=version_text(),   # Version
        date=tools.now_string(),  # Current time
        remarks=remarks,          # Some string
        link=link_text)           # HTML for link
    )
    f_html.close()


def _reload_metadata(output_dir):

    import json
    import os
    try:
        json_data = json.load(open(output_dir + "/" + _META_FILE_))

        # input args to json_data
        for data in json_data:
            for graph in data["graphs"]:
                for item in graph["items"]:
                    if item["output_html"] is True and os.path.exists(output_dir + "/" + data["proj"] + "/" + item["output_html"]) is False:
                        graph["items"].remove(item)

                if len(graph["items"]) == 0:
                    data["graphs"].remove(graph)

            if len(data["graphs"]) == 0:
                json_data.remove(data)

    except Exception:
        json_data = []

    f = open(output_dir + "/" + _META_FILE_, "w")
    f.writelines(json.dumps(json_data, indent=2))
    f.close()

    return json_data

def recreate_index(config, output_dir, remarks=""):

    import paplot.subcode.tools as tools
    import os

    json_data = _reload_metadata(output_dir)

    link_text = _convert_index_item(json_data)

    f_template = open(os.path.dirname(os.path.abspath(__file__)) + "/templates/index.html")
    html_template = f_template.read()
    f_template.close()

    if remarks == "":
        remarks = tools.config_getstr(config, "style", "remarks")

    f_html = open(output_dir + "/index.html", "w")
    f_html.write(
        html_template.format(
            version=version_text(),
            date=tools.now_string(),
            remarks=remarks,
            link=link_text
        )
    )
    f_html.close()
