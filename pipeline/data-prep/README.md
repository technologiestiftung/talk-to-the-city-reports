# Data Preparation

Small Node.js tools for prepping data.

## Install

```bash
cd /path/to/data-prep
npm ci

```

## check-encoding.js

Determine the character encoding of a file

### Usage

```bash
===================================================
  check-encoding.js - Checks the encoding of a file

  USAGE:
  node check-encoding.js --file <filename>

  OPTIONS:
  --file, -f <filename>  Specify the file to check
  --help, -h             Display this help message
```

## convert-encoding.js

Convert from a character encoding to another (default UTF-8)

### Usage

```bash
	=========================================================================================
	convert-encoding.js - Converts the encoding of a file

	USAGE:
			node convert-encoding.js --file <filename> --source-encoding <source-encoding> --target-encoding <target-encoding>

	OPTIONS:
			--file, -f <filename>           Specify the file to convert
			--source-encoding, -s <source-encoding>  Specify the source encoding
			--target-encoding, -t <target-encoding>  Specify the target encoding (default: utf-8)
			--help, -h                      Display this help message
```

## transform-csv.js

Fast and dirty using [csvkit](https://csvkit.readthedocs.io/en/latest/index.html)

```bash
csvsql -d ';' --query "select Quote as 'comment-body', ID as 'comment-id' from 'SmartCity_Datensatz.utf-8'" ./inputs/SmartCity_Datensatz.utf-8.csv
```
