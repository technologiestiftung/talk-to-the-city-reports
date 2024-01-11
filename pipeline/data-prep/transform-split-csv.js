#!/usr/bin/env node
//@ts-check

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, parse as pathParse } from "node:path";
import { parse } from "csv-parse/sync";

import { stringify } from "csv-stringify/sync";
import workshopQuestions from "./questions-workshop.json" assert { type: "json" };
import umfrageQuestions from "./questions-survey.json" assert { type: "json" };
function help() {
	console.log(`
=====================================================================================
	transform-csv.js - Transforms a CSV file

	USAGE:
			node transform-csv.js --file <filename>

	OPTIONS:
			--file, -f <filename>  Specify the CSV file to transform
			--help, -h             Display this help message
			--write-out, -w         Write the transformed CSV to a file

	The script transforms the CSV file by renaming the 'ID' column to 'comment-id' and the 'Quote' column to 'comment-body'.
	The transformed CSV is saved as 'transformed.<original filename>'.
	`);
	process.exit(0);
}

/**
 * Returns the file name without the directory path or extension.
 * @param {string} filePath - The file path.
 * @returns {string} The file name.
 */
function getBasename(filePath) {
	return pathParse(filePath).name;
}

/**
 * Returns the directory name of a file path.
 * @param {string} filePath - The file path.
 * @returns {string} The directory name.
 */
function getDirectoryName(filePath) {
	return pathParse(filePath).dir;
}

function createDirectoryIfNotExists(directoryPath) {
	if (!existsSync(directoryPath)) {
		mkdirSync(directoryPath, { recursive: true });
	}
}

/**
 * Returns a configuration object for the GPT-3.5-Turbo model.
 * @param {{
 *   question: string,
 *   input: string,
 *   group: string
 * }} options - The options for the configuration.
 * @returns {Object} The configuration object.
 */
function configGenerator({ question, input, group }) {
	return {
		name: "Gemeinsam Digital Berlin",
		// The question to be asked.
		question,
		// The input text to be used as context.
		input,
		model: "gpt-3.5-turbo",
		// The parameters for the extraction step.
		extraction: {
			workers: 3,
			limit: 12,
		},
		// The parameters for the clustering step.
		clustering: {
			clusters: 3,
		},
		// The parameters for the translation step.
		translation: {
			model: "gpt-3.5-turbo",
			// The languages to translate to.
			languages: ["English", "German"],
			// The language codes to use.
			flags: ["EN", "DE"],
		},
		// The introduction to be used in the report.
		intro: `Dieser von KI generierte Bericht stützt sich auf Daten aus den Smart City-Umfragen des Gemeinsam Digital Berlin Teams im CityLAB Berlin. Die Antworten stammen von der folgenden Gruppe: ${group}.`,
	};
}

/**
 * Returns the question with the specified ID from the list of questions.
 * @param {Object[]} questions - The list of questions.
 * @param {string} id - The ID of the question to retrieve.
 * @returns {Object} The question with the specified ID, or undefined if no question with the specified ID exists.
 */
function getQuestion(questions, id) {
	return questions.find((q) => q.id === id);
}

async function main() {
	const { values } = parseArgs({
		options: {
			help: {
				type: "boolean",
				short: "h",
			},
			"write-out": {
				type: "boolean",
				short: "w",
				default: false,
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

	const input = readFileSync(filePath, { encoding: "utf8" });
	let records = parse(input, { columns: true, delimiter: ";" });

	records.forEach((record) => {
		let kuerzelParts = record["Kürzel"].split("_");

		record.AkteursgruppeCode = kuerzelParts[0];

		record.VeranstaltungCode = kuerzelParts[1].replace(/[0-9]/g, "");

		record["comment-id"] = record.ID;
		delete record.ID;

		record["comment-body"] = record.Quote;
		delete record.Quote;
	});

	let groupedByMeta = {};

	records.forEach((record) => {
		if (!groupedByMeta[record.AkteursgruppeCode])
			groupedByMeta[record.AkteursgruppeCode] = {};

		if (!groupedByMeta[record.AkteursgruppeCode][record.VeranstaltungCode])
			groupedByMeta[record.AkteursgruppeCode][record.VeranstaltungCode] = {};

		if (
			!groupedByMeta[record.AkteursgruppeCode][record.VeranstaltungCode][
				record.Q
			]
		)
			groupedByMeta[record.AkteursgruppeCode][record.VeranstaltungCode][
				record.Q
			] = [];

		groupedByMeta[record.AkteursgruppeCode][record.VeranstaltungCode][
			record.Q
		].push(record);
	});

	// console.log(records);
	// console.log(groupedByMeta);
	Object.keys(groupedByMeta).forEach((agKey) => {
		// console.log(agKey);
		Object.keys(groupedByMeta[agKey]).forEach((vKey) => {
			// console.log("\t", vKey);
			Object.keys(groupedByMeta[agKey][vKey]).forEach((qKey) => {
				// console.log("\t\t", qKey);
				let csvData = stringify(groupedByMeta[agKey][vKey][qKey], {
					header: true,
				});

				const d = getDirectoryName(filePath);
				const b = getBasename(filePath);
				// const targetFilePath = filePath
				// 	.split(".")
				// 	.map((e, i, a) => {
				// 		if (i === a.length - 1) {
				// 			return `${agKey}_${vKey}_${qKey}.${e}`;
				// 		}
				// 		return `${e}`;
				// 	})
				// 	.join(".");

				createDirectoryIfNotExists(`${d}/split`);
				const targetFilePath = `${d}/split/${b}_${agKey}_${vKey}_${qKey}.csv`;
				if (values["write-out"]) {
					writeFileSync(targetFilePath, csvData);
					console.log(`File saved as ${targetFilePath}`);
				}
				let metaData = {};
				let question = {};
				if (vKey === "W") {
					// metaData = { questions: workshopQuestions };
					question = getQuestion(workshopQuestions.questions, qKey);
				} else {
					// metaData = { questions: umfrageQuestions };
					question = getQuestion(umfrageQuestions.questions, qKey);
				}

				metaData["question"] = question;
				console.log(question);
				const config = configGenerator({
					question: question?.text ?? "",
					input: pathParse(targetFilePath).name,
					group: groupedByMeta[agKey][vKey][qKey][0]["Akteursgruppe"],
				});
				config["meta"] = metaData;

				const targetMetaFilePath = `${d}/split/${b}_${agKey}_${vKey}_${qKey}.json`;
				// filePath
				// .split(".")
				// .map((e, i, a) => {
				// 	if (i === a.length - 1) {
				// 		return `${agKey}_${vKey}_${qKey}.json`;
				// 	}
				// 	return `${e}`;
				// })
				// .join(".");
				if (values["write-out"]) {
					writeFileSync(
						`${targetMetaFilePath}`,
						JSON.stringify(config, null, 2)
					);
					console.log(`File saved as "${targetMetaFilePath}"`);
				}
			});
		});
	});
}

main().catch(console.error);
