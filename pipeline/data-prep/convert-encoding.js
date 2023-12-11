#!/usr/bin/env node
//@ts-check
import iconv from "iconv-lite";
import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "path";

function help() {
	console.log(`
	=========================================================================================
	convert-encoding.js - Converts the encoding of a file

	USAGE:
			node convert-encoding.js --file <filename> --source-encoding <source-encoding> --target-encoding <target-encoding>

	OPTIONS:
			--file, -f <filename>           Specify the file to convert
			--source-encoding, -s <source-encoding>  Specify the source encoding
			--target-encoding, -t <target-encoding>  Specify the target encoding (default: utf-8)
			--help, -h                      Display this help message
	`);
	process.exit(0);
}
async function main() {
	try {
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
				"source-encoding": {
					type: "string",
					short: "s",
				},
				"target-encoding": {
					type: "string",
					short: "t",
					default: "utf-8",
				},
			},
		});

		// sanity checks

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

		if (!values["source-encoding"]) {
			throw new Error("source-encoding must be a string");
		}

		if (typeof values["source-encoding"] !== "string") {
			throw new Error("source-encoding must be a string");
		}

		if (typeof values["target-encoding"] !== "string") {
			throw new Error("target-encoding must be a string");
		}

		const sourceEncoding = values["source-encoding"];
		const targetEncoding = values["target-encoding"];

		const buffer = readFileSync(filePath);
		const str = iconv.decode(buffer, sourceEncoding);
		const targetFilePath = filePath
			.split(".")
			.map((e, i, a) => {
				if (i === a.length - 1) {
					return `${targetEncoding}.${e}`;
				}
				return `${e}`;
			})
			.join(".");

		writeFileSync(targetFilePath, str);
	} catch (error) {
		console.error(error.message);
		help();
		process.exit(1);
	}
}

main().catch(console.error);
