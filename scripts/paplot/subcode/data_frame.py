# -*- coding: utf-8 -*-
"""
Created on Thu Feb 25 11:34:07 2016

@author: okada

$Id: data_frame.py 177 2016-10-24 04:23:59Z aokada $
"""

class DataFrame:
    """Tables data class"""

    def __init__(self):
        self.data = []
        self.title = []

    def column(self, col):  # col may be one of title if col is str type
        """Return the column data for an argument(col)"""
        if type(col) == str:
            col_index = self.name_to_index(col)
        elif type(col) == int:
            col_index = col
        else:
            return []
        li = []
        for row in self.data:
            li.append(row[col_index])
        return li

    def concat(self, data, title):

        new_title = []
        for item in title:
            new_title.extend(item)

        cat = []
        for pos in range(len(data[0])):
            cat_row = []
            for li in data:
                if type(li[0]) == list:
                    cat_row.extend(li[pos])
                else:
                    cat_row.append(li[pos])

            cat.append(cat_row)

        self.title = title
        self.data = cat

    def extract(self, col_index, filt, complete=False):

        extra = []
        for row in self.data:
            push = False
            if type(filt) == list:
                for v in filt:
                    if complete is True:
                        if row[col_index] == v:
                            push = True
                            break
                    else:
                        if v in row[col_index]:
                            push = True
                            break
            else:
                if complete is True:
                    if row[col_index] == filt:
                        push = True
                else:
                    if filt in row[col_index]:
                        push = True

            if push is True:
                extra.append(row)

        ret = DataFrame()
        ret.data = extra
        for item in self.title:
            ret.title.append(item)

        return ret

    def name_to_index(self, name):
        """Return an index of the title on success"""
        for index in range(len(self.title)):
            if self.title[index] == name:
                return index
        return -1

    def replace(self, before, after):
        for i in range(len(self.data)):
            for j in range(len(self.data[i])):
                if type(self.data[i][j]) == str:
                    self.data[i][j] = self.data[i][j].replace(before, after)

    def save(self, filepath, sept=",", header=True, mode="w"):

        lines = []
        if header is True:
            title_text = ""
            for i in range(len(self.title)):
                if i > 0:
                    title_text += sept
                title_text += str(self.title[i])

            lines.append(title_text + "\n")

        for row in self.data:
            row_text = ""
            for i in range(len(row)):
                if i > 0:
                    row_text += sept
                row_text += str(row[i])

            lines.append(row_text + "\n")

        f = open(filepath, mode)
        f.writelines(lines)
        f.close()

def _usecol(filepath, sept, header, skipfooter, comment):
    """Return a range(0, the maximum number of columns)"""

    # number of lines in file excluding the footer
    end = sum(1 for line in open(filepath)) - skipfooter

    # Count the maximum number of columns to create usecol

    header_counter = -1
    line_counter = -1
    max_colnum = 0
    for line in open(filepath):
        line_counter += 1
        line = line.rstrip("\r\n")

        # Ignore empty line
        if len(line) == 0:
            continue
        # Ignore comment line
        if len(comment) > 0 and line.find(comment) == 0:
            continue
        # Ignore header line
        header_counter += 1
        if header_counter < header:
            continue
        # Ignore footer line
        if line_counter >= end:
            break

        # Count columns
        cols = line.split(sept)
        if max_colnum < len(cols):
            max_colnum = len(cols)

    usecol = range(0, max_colnum)

    return usecol

def _f_usecol(usecol):
    """Return a list consisting of only non-negative values"""
    cols = []
    for u in usecol:
        if u >= 0:
            cols.append(u)
    return cols

def load_title(filepath, sept=",", usecol=None, header=0, skipfooter=0, comment="#"):
    """Return a title list extracted from the header lines of the file"""

    # Check for the existence of filepath
    import os
    if os.path.exists(filepath) is False:
        print("File does not exist. %s" % filepath)
        return []

    sept = sept.replace("\\t", "\t").replace("\\n", "\n").replace("\\r", "\r")

    # Create usecol that stores the column index
    if usecol is None:
        # usecol: range class
        usecol = _usecol(filepath, sept, header, skipfooter, comment)
    else:
        # usecol: list
        usecol = _f_usecol(usecol)

    # Create title
    title = []
    i = -1
    for line in open(filepath):
        line = line.rstrip("\r\n")
        # Ignore empty line
        if len(line) == 0:
            continue
        # Ignore comment line
        if len(comment) > 0 and line.find(comment) == 0:
            continue
        # Ignore data line
        i += 1
        if i >= header:
            break

        # line is header line
        cols = line.split(sept)
        for j in range(len(usecol)):
            value = cols[usecol[j]]
            if i == 0:
                title.append(value)
            else:
                title[j] += value  # Two or more header lines are possible

    return title

def load_file(filepath, sept=",", usecol=None, header=0, skipfooter=0, comment="#"):
    """
    Return a data frame instance with the attributions of title and data
    These attributions are created here from the filepath specified in first argument of this function
    title: list       : Column titles in the file's header line
    data : nested list: data[i] is a list with elements that split file's row[i] by title(column)
                      : For numeric expression string, they are cast to numbers
    """

    df = DataFrame()

    # Check file path
    import os
    if os.path.exists(filepath) is False:
        print("File does not exist. %s" % filepath)
        return df

    # Number of lines in file excluding the footer
    end = sum(1 for line in open(filepath)) - skipfooter

    # Delimiter
    sept = sept.replace("\\t", "\t").replace("\\n", "\n").replace("\\r", "\r")

    # Create usecol that stores the column index
    if usecol is None:
        # usecol: range class
        usecol = _usecol(filepath, sept, header, skipfooter, comment)
    else:
        # usecol: list
        usecol = _f_usecol(usecol)

    # Create title
    title = load_title(filepath, sept, usecol, header, skipfooter, comment)

    # Create tmp: a nested list
    # tmp elements are lists of data rows separated by columns
    tmp = []
    header_counter = -1
    line_counter = -1
    with open(filepath) as f:
        for line in f:
            line_counter += 1
            line = line.rstrip("\r\n")
            # Ignore empty line
            if len(line) == 0:
                continue
            # Ignore comment line
            if len(comment) > 0 and line.find(comment) == 0:
                continue
            # Ignore header line
            header_counter += 1
            if header_counter < header:
                continue
            # Ignore footer line
            if line_counter >= end:
                break

            # line is data line
            cols = line.split(sept)
            picks = []
            for j in usecol:
                value = ""
                if (j >= 0) and (j < len(cols)):
                    value = cols[j]
                picks.append(value)

            tmp.append(picks)

    # Determine the types of column data

    # Type definition
    TYPE_INT = 0    # selected if column data can be cast to int
    TYPE_FLOAT = 1  # selected if column data can be cast to float but cannot be cast to int
    TYPE_TEXT = 2   # selected if column data cannot be cast to int or float

    # Stores the initial type
    type_list = []
    for i in usecol:
        type_list.append(TYPE_INT)

    # Determine types
    for row in tmp:
        for pos in range(len(row)):
            # Check for a numeric type
            if type_list[pos] == TYPE_TEXT:
                continue
            # Check for int type
            if type_list[pos] == TYPE_INT:
                try:
                    int(row[pos])
                except Exception:
                    type_list[pos] = TYPE_FLOAT
            # Check for float type
            if type_list[pos] == TYPE_FLOAT:
                try:
                    float(row[pos])
                except Exception:
                    type_list[pos] = TYPE_TEXT

    # Create data that is similar to tmp
    # data elements are cast if columns are numeric type
    data = []
    for row in tmp:
        li = []
        for pos in range(len(row)):
            if type_list[pos] == TYPE_INT:
                li.append(int(row[pos]))
            elif type_list[pos] == TYPE_FLOAT:
                li.append(float(row[pos]))
            else:
                li.append(row[pos])
        data.append(li)

    # DataFrame attributions
    df.data = data
    df.title = title

    return df
