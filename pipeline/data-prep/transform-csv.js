#!/usr/bin/env node
//@ts-check

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
function help() {
	console.log(`
=====================================================================================
	transform-csv.js - Transforms a CSV file

	USAGE:
			node transform-csv.js --file <filename>

	OPTIONS:
			--file, -f <filename>  Specify the CSV file to transform
			--help, -h             Display this help message

	The script transforms the CSV file by renaming the 'ID' column to 'comment-id' and the 'Quote' column to 'comment-body'.
	The transformed CSV is saved as 'transformed.<original filename>'.
	`);
	process.exit(0);
}

async function main() {
	const { values } = parseArgs({
		options: {
			help: {
				type: "boolean",
				short: "h",
			},
			file: {
				type: "string",
				short: "f",
			},
		},
	});

	if (values.help) {
		help();
	}
	if (typeof values.file !== "string") {
		throw new Error("file must be a string");
	}
	const filePath = resolve(process.cwd(), values.file);
	if (!existsSync(filePath)) {
		throw new Error("file does not exist");
	}
	const input = readFileSync(filePath, "utf8");

	const records = parse(input, {
		delimiter: ";",
		columns: true,
		skip_empty_lines: true,
	});
	const transformed = records.map((record) => {
		return { "comment-id": record["ID"], "comment-body": record["Quote"] };
	});

	const csv = stringify(transformed);
	// console.log(csv);
	const targetFilePath = filePath
		.split(".")
		.map((e, i, a) => {
			if (i === a.length - 1) {
				return `transformed.${e}`;
			}
			return `${e}`;
		})
		.join(".");

	writeFileSync(targetFilePath, csv);
	try {
	} catch (error) {
		console.error(error);
		help();
		process.exit(1);
	}
}

main().catch(console.error);
