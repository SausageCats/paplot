# -*- coding: utf-8 -*-
"""
Created on Wed Dec 02 17:43:52 2015

@author: okada

$Id: merge.py 204 2017-08-02 08:23:55Z aokada $
"""

from . import tools

def load_potisions(mode, config):
    """Return a nested dictionary with required and optional column entries"""
    # The nested dictionary is like {"must": must_di, "option": option_di}
    # must_di: dictionary
    #   key  : A string without the leading col_ of the key name col_*** defined in a config file
    #        : ex) col_chr1 => key=chr1
    #   value: The value corresponding to the col_*** key
    # option_di: dictionary
    #   key  : A string without the leading col_opt_ of the key name col_opt_*** defined in a config file
    #        : ex) col_opt_dir1 => key=dir1
    #   value: The value corresponding to the col_opt_*** key

    [section_in, section_out] = tools.get_section(mode)
    header = tools.config_getboolean(config, section_in, "header")

    must = {}
    opts = {}
    for option in config.options(section_in):  # Retrieve the keys defined in the section
        param = ""
        if option.startswith("col_"):
            param = option.replace("col_", "")

        if len(param) > 0:
            value = config.get(section_in, option)
            if value == "":
                continue

            if param.startswith("opt_"):
                # column index (option) in ../templates/paplot.cfg
                if header is True:
                    opts[param.replace("opt_", "")] = value
                else:
                    opts[param.replace("opt_", "")] = config.getint(section_in, option)
            else:
                # column index (required) in ../templates/paplot.cfg
                if header is True:
                    must[param] = value
                else:
                    must[param] = config.getint(section_in, option)

    return {"must": must, "option": opts}

def _load_option(mode, config):
    """Return configuration settings as a dictionary"""

    [section_in, section_out] = tools.get_section(mode)

    # data read
    header = config.getboolean(section_in, "header")
    if header < 0:
        header = 0
    sept = config.get(section_in, "sept").replace("\\t", "\t").replace("\\n", "\n").replace("\\r", "\r")
    comment = tools.config_getstr(config, section_in, "comment")
    lack = tools.config_getstr(config, section_out, "lack_column_complement")
    suffix = tools.config_getstr(config, section_in, "suffix")
    suffix_filt = tools.config_getstr(config, section_in, "suffix_filt")  # No suffix_filt key in config

    # return option dict
    return {"header": header, "sept": sept, "comment": comment, "lack": lack, "suffix": suffix, "suffix_filt": suffix_filt}

def _merge_metadata(files, option):
    """Merge metadata from comment lines in all input files and return the information as a string"""

    import os

    # read all file's meta-data
    meta_data = []
    headers = []
    for file_path in files:
        if len(option["comment"]) == 0:
            break
        for line in open(file_path):
            line = line.rstrip("\r\n")
            if len(line) == 0:  # Ignore blank line
                continue
            if line.find(option["comment"]) == 0:
                # comment line
                data = line.split(":")
                if len(data) < 2:
                    continue
                # Include metadata in comment line
                meta_data.append([data[0].replace(" ", ""), data[1].strip(), file_path])
                headers.append(data[0].replace(" ", ""))
            else:
                break
    headers = list(set(headers))
    headers.sort()

    # line = "# key:value" where # is comment mark
    #   => meta_data = [[key, value, path], ...]
    #   => headers   = [key, ...] ... is sorted and has no duplicate elements

    # merge meta-data
    meta_text = ""
    for header in headers:
        values = {}
        for meta in meta_data:
            if meta[0] == header:
                if (meta[1] in values) is False:
                    values[meta[1]] = []
                values[meta[1]].append(meta[2])
        # values = {value:[path,...], ...}
        for key in values:
            meta_text += header + ":" + key
            if len(values[key]) != len(files):
                f_text = ""
                for f in values[key]:  # f = file_path
                    if len(f_text) > 0:
                        f_text += ";"
                    f_text += os.path.basename(f).replace(option["suffix"], "").replace(option["suffix_filt"], "")
                meta_text += ":" + f_text
                # meta_text = "key:value:basename(path)" or "key:value:basename(path);basename(path)..."
            meta_text += "\n"
        # meta_text = "key:value\n..." or above, or combined

    return meta_text

def _merge_title(files, mode, option, config):
    """Return a list of titles(column names) extracted from input files headers with no duplicates"""

    if option["header"] is False:
        return []

    # titles
    merged_title = []
    for file_path in files:

        # Extract the titles of the header
        title = []
        for line in open(file_path):
            line = line.rstrip("\r\n")
            # Ignore blank line
            if len(line.replace(option["sept"], "")) == 0:
                continue
            # Ignore comment line
            if len(option["comment"]) > 0 and line.find(option["comment"]) == 0:
                continue
            # Get titles
            title = line.split(option["sept"])
            break

        for col in title:
            if (col in merged_title) is False:  # Do not include duplicate titles
                merged_title.append(col)

    return merged_title.sort()

def merge_result(files, ids, output_file, mode, config, extract=False):
    """
    Merge all the input files and output them to the file specified in output_file

    Parameters
    ----------
    files      : list: Input data files
    ids        : list: Alternate values for the id column of output file
    output_file: str : Absolute path for output
    mode       : str : ca, mustation, or qc
    config     : configparser.RawConfigParser
    extract    : bool: If True, titles are set from the config file
                     : If False, titles are set from the input file header
                     : The tities correspond to the column names of output_file

    Return
    ------
    On failure, empty dictionary
    On success, a nested dictionary: {'must'  : {key1: title1, ...},
                                      'option': {key2: title2, ...}}
    key1 is a name that excludes col_ from the key name col_*** set in the configuration file
    key2 is a name that excludes col_opt_ from the key name col_opt_*** set in the configuration file
    title1 and title2 are the values of key1 and key2, respectively
    These values assigned to the title(column) names in the output file
    """

    [section_in, section_out] = tools.get_section(mode)

    if tools.config_getboolean(config, section_in, "header") is True:
        return with_header(files, ids, output_file, mode, config, extract)
    else:
        return with_noheader(files, ids, output_file, mode, config, extract)

def with_header(files, ids, output_file, mode, config, extract=False):
    """Main processing for merging with headers"""

    def calc_map(header, all_header):
        mapper = [-1] * len(all_header)
        for i in range(len(all_header)):
            if all_header[i] in header:
                mapper[i] = header.index(all_header[i])
            else:
                mapper[i] = -1
        return mapper

    import os

    if len(files) == 0:
        return {}

    for file_path in files[:]:
        if os.path.exists(file_path) is False:
            print("[ERROR] file is not exist. %s" % file_path)
            files.remove(file_path)
            continue

    option = _load_option(mode, config)
    if option["header"] is False:
        print("[ERROR] header is necessary for this function.")
        return {}

    meta_text = _merge_metadata(files, option)

    # positions: A naested dictionary: {"must": {...}, "option": {...}}
    positions = load_potisions(mode, config)

    # Create titles list
    if extract is False:
        # titles values are extracted from input file headers
        titles = _merge_title(files, mode, option, config)
    else:
        # titles values are extracted from config file
        titles = []
        for key in tools.dict_keys(positions["must"]):
            titles.append(positions["must"][key])
        for key in tools.dict_keys(positions["option"]):
            titles.append(positions["option"][key])

    # update positions to merged title
    # Both positions and titles must have id value (positions["option"]["id"])
    if ("id" in positions["option"]) is False:
        positions["option"]["id"] = "id"
    if (positions["option"]["id"] in titles) is False:
        titles.insert(0, positions["option"]["id"])

    # Write meta-data and titles to a temporary file
    f = open(output_file + ".tmp", mode="w")  # Full path of temporary file
    f.write(meta_text)                        # Write metadata
    f.write(option["sept"].join(titles))      # Write titles(column names)
    f.write("\n")

    # Merges all input data files and writes them to the temporary file
    for idx in range(len(files)):
        file_path = files[idx]

        header = []
        mapper = []
        lines = []
        lines_count = 0
        for line in open(file_path):
            line = line.rstrip("\r\n")

            # Ignroe blank line
            if len(line.replace(option["sept"], "")) == 0:
                continue
            # Ignore comment line
            if len(option["comment"]) > 0 and line.find(option["comment"]) == 0:
                continue
            # Ignroe header line
            if len(header) == 0:
                header = line.split(option["sept"])
                mapper = calc_map(header, titles)  # header[mapper[i]] == titles[i] if mapper[i] != -1
                continue

            # line contains data
            data = line.split(option["sept"])
            sort_data = []
            for i in range(len(titles)):
                if mapper[i] < 0:
                    # Run here if a column name(titles[i]) is not in the header
                    if titles[i] == positions["option"]["id"]:
                        sort_data.append(ids[idx])  # Give an alternative value if id title is not in the header
                    else:
                        sort_data.append(option["lack"])  # Add elements like NA
                else:
                    sort_data.append(data[mapper[i]])  # The order of elements in sort_data is the same as that in titles

            # Concatenate sort_data
            lines.append(option["sept"].join(sort_data) + "\n")

            # Write intermediate data to the temporary file
            lines_count += 1
            if (lines_count > 10000):
                f.writelines(lines)
                lines = []
                lines_count = 0

        # Write the remaining unwritten data to the temporary file
        if (lines_count > 0):
            f.writelines(lines)

    f.close()

    if os.path.exists(output_file):
        os.remove(output_file)
    os.rename(output_file + ".tmp", output_file)

    return positions

def with_noheader(files, ids, output_file, mode, config, extract=False):
    """Main processing for merging without headers"""

    import os

    if len(files) == 0:
        return {}

    for file_path in files[:]:
        if os.path.exists(file_path) is False:
            print("[ERROR] file is not exist. %s" % file_path)
            files.remove(file_path)
            continue

    option = _load_option(mode, config)
    if option["header"] is True:
        print("[ERROR] this is function for no-header data.")
        return {}

    meta_text = _merge_metadata(files, option)
    positions = load_potisions(mode, config)

    usecols = []
    for key in positions["must"]:
        usecols.append(positions["must"][key])

    for key in positions["option"]:
        usecols.append(positions["option"][key])

    add_id = False
    if ("id" in positions["option"]) is False:
        add_id = True

    # write meta-data to file
    f = open(output_file + ".tmp", mode="w")
    f.write(meta_text)

    titles = []
    for idx in range(len(files)):
        file_path = files[idx]

        lines = []
        lines_count = 0
        for line in open(file_path):
            line = line.rstrip("\r\n")
            if len(line.replace(option["sept"], "")) == 0:
                continue

            if len(option["comment"]) > 0 and line.find(option["comment"]) == 0:
                continue

            data = line.split(option["sept"])

            # header
            if titles == []:
                if add_id is True:
                    titles.append("id")

                for i in range(1, len(data) + 1):
                    if extract is True:
                        if i in usecols:
                            titles.append("v%d" % i)
                    else:
                        titles.append("v%d" % i)

                lines.append(option["sept"].join(titles) + "\n")

            # add id
            cat_data = []
            if add_id is True:
                cat_data.append(ids[idx])

            for i in range(1, len(data) + 1):
                if extract is True:
                    if i in usecols:
                        cat_data.append(data[i - 1])
                else:
                    cat_data.append(data[i - 1])

            lines.append(option["sept"].join(cat_data) + "\n")
            lines_count += 1

            if (lines_count > 10000):
                f.writelines(lines)
                lines = []
                lines_count = 0

        if (lines_count > 0):
            f.writelines(lines)

    f.close()
    if os.path.exists(output_file):
        os.remove(output_file)
    os.rename(output_file + ".tmp", output_file)

    # update positions
    for key in positions["must"]:
        positions["must"][key] = "v%d" % (positions["must"][key])

    for key in positions["option"]:
        positions["option"][key] = "v%d" % (positions["option"][key])

    if ("id" in positions["option"]) is False:
        positions["option"]["id"] = "id"

    return positions

def position_to_dict(position):
    """Return a dictionary that merges the values of must and option"""
    di = {}
    for key in position["must"]:
        di[key] = position["must"][key]
    for key in position["option"]:
        di[key] = position["option"][key]
    return di
