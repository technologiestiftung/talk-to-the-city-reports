#!/usr/bin/env node
// @ts-check

import chardet from "chardet";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { resolve } from "path";

function help() {
	console.log(`
===================================================
  check-encoding.js - Checks the encoding of a file

  USAGE:
  node check-encoding.js --file <filename>

  OPTIONS:
  --file, -f <filename>  Specify the file to check
  --help, -h             Display this help message
  `);
	process.exit(0);
}
async function main() {
	try {
		const { values } = parseArgs({
			options: {
				file: {
					type: "string",
					short: "f",
				},
				help: {
					type: "boolean",
					short: "h",
				},
			},
		});

		if (values.help) {
			help();
		}

		if (!values.file) {
			throw new Error("file must be a string");
		}

		if (values.file) {
			// check if values.file is a string and exists
			if (typeof values.file !== "string") {
				throw new Error("file must be a string");
			}
			const filePath = resolve(process.cwd(), values.file);
			if (!existsSync(filePath)) {
				throw new Error("file does not exist");
			}

			const encoding = await chardet.detectFile(filePath);
			console.log(encoding);
		}
	} catch (error) {
		console.error(error.message);
		help();
		process.exit(1);
	}
}

main().catch(console.error);
