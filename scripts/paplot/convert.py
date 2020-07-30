# -*- coding: utf-8 -*-
"""
Created on Thu May 12 12:34:57 2016

@author: okada

$Id: convert.py 208 2017-08-16 06:16:25Z aokada $
"""
import paplot.subcode.tools as tools

def prohibition(text):
    import re
    new_text = re.sub(r'[\'"/;:\[\] ]', "_", text)
    if re.match(r'^[0-9]', new_text):
        new_text = "_" + new_text
    return new_text

def list_prohibition(li):
    li_p = []
    for item in li:
        li_p.append(prohibition(item))
    return li_p

def value_to_index(li, value, default):
    """Returns the index of the list element on success"""
    for i in range(len(li)):
        if li[i] == value:
            return i
    return default

def list_to_text(li):
    """
    Return a string of concatenated list elements
    List elements are enclosed in quotations and they are concatenated with commas
    """
    text = ""
    for item in li:
        text += "'" + str(item) + "',"
    return text

def text_to_list(text, sep):
    """
    Return a list with elements that are substrings of string split by delimiter
    Empty substring elements are excluded
    """
    splt = []
    if sep == "":
        splt.append(text)
    else:
        splt = text.split(sep)
    li = []
    for item in splt:
        value = item.strip().rstrip("\r\n")
        if value != "":
            li.append(value)
    return li

def fnmatch_list(target, li):
    """Return True if any list element matches a target"""
    import fnmatch
    for value in li:
        if fnmatch.fnmatch(target, value):
            return True
    return False

def group_list(colmun, mode, name, config):
    """
    Create and return group names and their color values

    Parameters
    ----------
    colmun: list: colmun data for group title
    mode  : str : ca or mutation
    name  : str : "group"
    config: configparser.RawConfigParser

    Return
    ------
    A nested list with elements funcs and colors
    funcs : list: group names
    colors: list: color values
    """

    import paplot.color as color

    # option_input: section name
    option_input = ""
    if mode == "mutation":
        option_input = "result_format_mutation"
    elif mode == "ca":
        option_input = "result_format_ca"
    else:
        return []

    # Get values from a configuration file
    sept = tools.config_getstr(config, option_input, "sept_%s" % name)                        # key: sept_group
    limited_list = text_to_list(tools.config_getstr(config, mode, "limited_%s" % name), ",")  # key: limited_group
    nouse_list = text_to_list(tools.config_getstr(config, mode, "nouse_%s" % name), ",")      # key: nouse_group

    # Create funcs that is a list with group names as elements
    funcs = []
    for row in colmun:
        # Split row if necessary
        splt = []
        if sept == "":
            splt.append(row)
        else:
            splt = row.split(sept)
        # Limit the elements to be added to funcs
        for func in splt:
            func = func.strip()
            # Ignore empty string
            if func == "":
                continue
            # Ignore if func is not in non-empty limited_list
            if len(limited_list) > 0 and fnmatch_list(func, limited_list) is False:
                continue
            # Ignore if func is in nouse_list
            if fnmatch_list(func, nouse_list):
                continue
            funcs.append(func)
    # Sort after eliminating duplicated elements of funcs
    funcs = list(set(funcs))
    funcs.sort()

    # Create color_di that is a dictionary with group names as keys and color values as values
    color_di = {}
    for f in tools.config_getstr(config, mode, "%s_color" % name).split(","):  # key: group_color
        # Ignore empty string
        if len(f) == 0:
            continue
        # f assumes something like "A:#66C2A5"
        cols = text_to_list(f, ":")
        if len(cols) >= 2:
            color_di[cols[0]] = color.name_to_value(cols[1])

    # Determine color values for groups
    color_di = color.create_color_dict(funcs, color_di, color.metro_colors)

    # Create color list for groups
    colors = []
    for key in funcs:
        colors.append(color_di[key])

    return [funcs, colors]

def pyformat_to_jstooltip_text(positions, config, section_fmt, section_col, item_startwith):
    """
    Create tooltip components obtained by decomposing a string of the tooltip_format

    Parameters
    ----------
    positions     : dcit: A dictionary with column titles as values
    config        : configparser.RawConfigParser
    section_fmt   : str: A section name such as "ca", "mutation", "pmsignature", "signature", ...
    section_col   : str: A section name such as "result_format_ca", "result_format_mutation", "result_format_qc", ...
    item_startwith: str: The first string of section key, such as "tooltip_format", "tooltip_format_checker_title", ...

    Return
    ------
    A dictionary-style string with "format" and "keys"
        format: [[{...}, ...], ...] where the dictionares have the following keys and values
              : label: For fix type, a string outside the braces
              :      : Others, a string before the letter ":" in braces
              : type : One of the following: fix, numeric, str
              : keys : For fix type, empty string
              :      : Others, a string that precedes the letter ":" in braces and excludes the arithmetic term
              : ext  : For fix type, empty string
              :      : Others, a string after the letter ":" in braces
        keys  : a set-style string
              : A concatenated string of the above "keys" values
    """

    tooltip_detail_templete = "{{label:'{label}',type:'{type}',keys:[{keys}],ext:'{ext}'}},"

    import re
    re_compile = re.compile(r"\{[0-9a-zA-Z\+\-\*\/\#\:\,\.\_\ ]+\}")  # Bracketed area
    re_compile2 = re.compile(r"[\+\-\*\/\:]")

    # Determine keys_list and tooltip_fomat_text

    keys_list = []
    tooltip_fomat_text = ""
    for option in tools.config_getoptions(config, section_fmt, item_startwith):

        # formt    : "[{chr1}] {break1:,}; [{chr2}] {break2:,}"
        # keys_list: ["{chr1}", "{break1:,}", "{chr2}", "{break2:,}"]
        formt = tools.config_getstr(config, section_fmt, option)  # tooltip format
        key_text_list = re_compile.findall(formt)  # Extract string enclosed in braces

        # Determine tooltip_detail_text

        tooltip_detail_text = ""
        for key_text in key_text_list:
            # key_text: "{chr1}"   "{break1:,}"   "{chr2}"   "{break2:,}"   ...

            # Update tooltip_detail_text: fix type
            start = formt.find(key_text)  # Index of matched string
            if start > 0:
                # label: "["   "] "   "; ["   "] "   ...
                tooltip_detail_text += tooltip_detail_templete.format(label=formt[0:start], type="fix", keys="", ext="")

            # slice for the next loop
            formt = formt[start + len(key_text):]

            # Update key_text: lowercase
            # Set label_text
            # Set sub_keys
            key_text = key_text.lower()
            label_text = key_text.replace(" ", "").replace("{", "").replace("}", "")  # "{break1:,}" => "break1:,"
            sub_keys = re_compile2.split(label_text)                                  # "break1:,"   => ["break1", ","]

            # Set ttype: numeric or str
            ttype = "numeric"  # numeric if key_text contains either "+", "-", "*", "/", or ":"
            if len(sub_keys) == 1:
                ttype = "str"

            # Set ext          : "" or something like ","
            # Update label_text: remove extra characters
            # Update sub_keys  : remove extra elements
            ext = ""
            if label_text.find(":") > 0:
                ext_start = label_text.index(":")         # Index of :
                ext = label_text[ext_start + 1:]          # "break1:," => ","
                label_text = label_text[0:ext_start]      # "break1:," => "break1"
                sub_keys = re_compile2.split(label_text)  # "break1"   => ["break1"]

            # Update sub_keys: remove numeric block
            for sub_key in sub_keys:
                try:
                    float(sub_key)
                    sub_keys.remove(sub_key)
                except Exception:
                    pass

            # Set check        : True or False
            # Update label_text: add braces
            check = True
            for sub_key in list(set(sub_keys)):
                if sub_key not in positions.keys() and not sub_key.startswith("#"):
                    print("[WARNING] key:{key} is not defined.".format(key=sub_key))
                    check = False
                    break
                label_text = label_text.replace(sub_key, "{" + sub_key + "}")  # "break1" => "{break1}"

            # Update tooltip_detail_text: numeric or str type
            if check is True:
                # label: "{chr1}"   "{break1}"   "{chr2}"   {"break2"}   ...
                # keys : "'chr1',"  "'break1',"  "'chr2',"  "'break2',"  ...  "'" and "," are added
                # ext  : ""         ","          ""         ","          ...
                tooltip_detail_text += tooltip_detail_templete.format(label=label_text, type=ttype, keys=list_to_text(sub_keys), ext=ext)
                keys_list.extend(sub_keys)  # add a list such as ["chr1"], ["break1"], ["chr2"], ["break2"], ...

        # Update tooltip_detail_text: fix type
        if len(formt) > 0:
            tooltip_detail_text += tooltip_detail_templete.format(label=formt, type="fix", keys="", ext="")

        tooltip_fomat_text += "[" + tooltip_detail_text + "],"

    # Convert a list to a string
    key_text = ""
    keys_dup = list(set(keys_list))
    keys_dup.sort()
    for key in keys_dup:
        key_text += "{" + key.lower() + "} "
    # keys_list: ['break1', 'break2', 'chr1', 'chr2']
    # kety_text: "{break1} {break2} {chr1} {chr2}"

    tooltip_templete = "{{format:[{formats}], keys: '{keys}'}}"
    return tooltip_templete.format(formats=tooltip_fomat_text, keys=key_text)
