# -*- coding: utf-8 -*-
"""
Created on Wed Dec 02 17:43:52 2015

@author: okada

$Id: run.py 179 2016-11-07 03:54:23Z aokada $
"""

import os
import paplot.subcode.tools as tools
import paplot.subcode.merge as merge
import paplot.prep as prep

def conf_main(args):

    # config
    [config, conf_file] = tools.load_config(tools.win_to_unix(args.config_file))

    tools.print_conf(config, conf_file, "paplot")

def index_main(args):

    # config
    [config, conf_file] = tools.load_config(tools.win_to_unix(args.config_file))

    # dirs
    output_dir = os.path.abspath(args.output_dir)
    if (os.path.exists(output_dir) is False):
        os.makedirs(output_dir)

    prep.recreate_index(config, tools.win_to_unix(args.output_dir), remarks=args.remarks)

def qc_main(args):
    import paplot.qc as qc

    # config
    [config, conf_file] = tools.load_config(tools.win_to_unix(args.config_file))

    input_list = tools.get_inputlist(tools.win_to_unix(args.input))
    if len(input_list) == 0:
        print("input no file.")
        return

    [sec_in, sec_out] = tools.get_section("qc")
    id_list = tools.get_idlist(input_list, tools.config_getstr(config, sec_in, "suffix"))

    # dirs
    output_html_dir = prep.create_dirs(tools.win_to_unix(args.output_dir), args.project_name, config)
    output_data = "data_%s%s" % (args.ellipsis, os.path.splitext(input_list[0])[1])
    positions = merge.merge_result(input_list, id_list, output_html_dir + "/" + output_data, "qc", config, extract=True)
    if positions == {}:
        print("merge.merge_result: input file is invalid.")
        return

    html_name = "graph_%s.html" % args.ellipsis
    params_html = {"dir": output_html_dir,
                   "data": output_data,
                   "js": "data_%s.js" % args.ellipsis,
                   "html": html_name,
                   "project": args.project_name,
                   "title": args.title,
                   }
    qc.output_html(params_html, positions, config)

    prep.create_index(config, tools.win_to_unix(args.output_dir), html_name, args.project_name, args.title,
                      overview=args.overview, remarks=args.remarks)

def ca_main(args):
    '''
    ca main script

    Parameters
    ----------
    args: argparse.Namespace
        : Args contains the arguments specified in the paplot command

    Args parameters
    ----------
    input       : string  : Input file path
    output_dir  : string  : Output directory path
    project_name: string  : Project name path
    config_file : string  : Config file path
    title       : string  : Report title name
    ellipsis    : string  : File name identifier for report
    overview    : string  : Report summary
    remarks     : string  : Additional information about report
    func        : function: This function (ca_main)

    Return
    ------
    None
    '''
    # The default values of the variables are defined in the file: ../../paplot
    # config_file: ""                       :
    # title      : "CA graphs"              : This value is replaced by {title} in ./templates/graph_ca.html
    # ellipsis   : "ca"                     : This value is used as part of file names, such as graph_ca.html
    # overview   : "Chromosomal Aberration.": This value is used in _convert_index_item function in ./prep.py
    # remarks    : ""                       : This value is replaced by {remarks} in ./templates/index.html

    import paplot.ca as ca

    # config
    [config, conf_file] = tools.load_config(tools.win_to_unix(args.config_file))

    # input_list: a list with input data files as elements
    input_list = tools.get_inputlist(tools.win_to_unix(args.input))
    if len(input_list) == 0:
        print("input no file.")
        return

    [sec_in, sec_out] = tools.get_section("ca")
    # id_list is used when the column candidates defined in the config file are not in the header of input files
    # see ids veriable of with_header function in ./subcode/merge.py for details
    id_list = tools.get_idlist(input_list, tools.config_getstr(config, sec_in, "suffix"))

    # output_html_dir: The absolute path of the project directory
    # output_data    : File name like data_ca.csv
    #                : This file is created by the merge.merge_result function and placed in the project directory
    #                : The contents of the file are formatted from the input file to match the configuration file
    #                : After that, read the contents and convert it to Json format in ca.output_html function
    # positions      : A nested dictionary: {'must'  : {key1: title1, ...}, 'option': {key2: title2, ...}}
    output_html_dir = prep.create_dirs(tools.win_to_unix(args.output_dir), args.project_name, config)
    output_data = "data_%s%s" % (args.ellipsis, os.path.splitext(input_list[0])[1])
    positions = merge.merge_result(input_list, id_list, output_html_dir + "/" + output_data, "ca", config, extract=True)
    if positions == {}:
        print("merge.merge_result: input file is invalid.")
        return

    html_name = "graph_%s.html" % args.ellipsis
    params_html = {"dir": output_html_dir,              # Project directory full path
                   "data": output_data,                 # Data file name like csv
                   "js": "data_%s.js" % args.ellipsis,  # JavaScript file name
                   "html": html_name,                   # HTML file name
                   "project": args.project_name,        # Project name given by user on command line
                   "title": args.title,                 # 'CA graphs' as default
                   }
    ca.output_html(params_html, positions, config)

    prep.create_index(config, tools.win_to_unix(args.output_dir), html_name, args.project_name, args.title,
                      overview=args.overview, remarks=args.remarks)


def mutation_main(args):
    import paplot.mutation as mut

    # config
    [config, conf_file] = tools.load_config(tools.win_to_unix(args.config_file))

    input_list = tools.get_inputlist(tools.win_to_unix(args.input))
    if len(input_list) == 0:
        print("input no file.")
        return

    [sec_in, sec_out] = tools.get_section("mutation")
    id_list = tools.get_idlist(input_list, tools.config_getstr(config, sec_in, "suffix"))

    # dirs
    output_html_dir = prep.create_dirs(tools.win_to_unix(args.output_dir), args.project_name, config)
    output_data = "data_%s%s" % (args.ellipsis, os.path.splitext(input_list[0])[1])
    positions = merge.merge_result(input_list, id_list, output_html_dir + "/" + output_data, "mutation", config, extract=True)
    if positions == {}:
        print("merge.merge_result: input file is invalid.")
        return

    html_name = "graph_%s.html" % args.ellipsis
    params_html = {"dir": output_html_dir,
                   "data": output_data,
                   "js": "data_%s.js" % args.ellipsis,
                   "html": html_name,
                   "project": args.project_name,
                   "title": args.title,
                   }
    mut.output_html(params_html, positions, config)

    prep.create_index(config, tools.win_to_unix(args.output_dir), html_name, args.project_name, args.title,
                      overview=args.overview, remarks=args.remarks)


def signature_main(args):
    import paplot.signature as signature

    # config
    [config, conf_file] = tools.load_config(tools.win_to_unix(args.config_file))

    input_list = tools.get_inputlist(tools.win_to_unix(args.input))
    if len(input_list) == 0:
        print("input no file.")
        return

    # dirs
    output_html_dir = prep.create_dirs(tools.win_to_unix(args.output_dir), args.project_name, config)

    for input_file in input_list:
        params_in = {"dir": output_html_dir,
                     "data": input_file,
                     "project": args.project_name,
                     "title": args.title,
                     "ellipsis": args.ellipsis,
                     }
        params_out = signature.output_html(params_in, config)

        if params_out is None:
            continue

        if params_out == {}:
            prep.create_index(config, tools.win_to_unix(args.output_dir), "", args.project_name, args.title,
                              overview=args.overview, sub_text="",
                              composite=True, remarks=args.remarks)
            continue

        sig_num_sift = 0
        if tools.config_getboolean(config, "result_format_signature", "background"):
            sig_num_sift = 1
        prep.create_index(config, tools.win_to_unix(args.output_dir), params_out["html"], args.project_name, args.title,
                          overview=args.overview, sub_text="#sig %d" % (params_out["sig_num"] + sig_num_sift),
                          composite=True, remarks=args.remarks)

def pmsignature_main(args):
    import paplot.pmsignature as pmsignature

    # config
    [config, conf_file] = tools.load_config(tools.win_to_unix(args.config_file))

    input_list = tools.get_inputlist(tools.win_to_unix(args.input))
    if len(input_list) == 0:
        print("input no file.")
        return

    # dirs
    output_html_dir = prep.create_dirs(tools.win_to_unix(args.output_dir), args.project_name, config)

    for input_file in input_list:
        params_in = {"dir": output_html_dir,
                     "data": input_file,
                     "project": args.project_name,
                     "title": args.title,
                     "ellipsis": args.ellipsis,
                     }
        params_out = pmsignature.output_html(params_in, config)

        if params_out is None:
            continue

        if params_out == {}:
            prep.create_index(config, tools.win_to_unix(args.output_dir), "", args.project_name, args.title,
                              overview=args.overview, sub_text="",
                              composite=True, remarks=args.remarks)
            continue

        sig_num_sift = 0
        if tools.config_getboolean(config, "result_format_pmsignature", "background"):
            sig_num_sift = 1

        prep.create_index(config, tools.win_to_unix(args.output_dir), params_out["html"], args.project_name, args.title,
                          overview=args.overview, sub_text="#sig %d" % (params_out["sig_num"] + sig_num_sift),
                          composite=True, remarks=args.remarks)
