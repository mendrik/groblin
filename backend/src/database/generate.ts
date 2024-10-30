import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Read the JSON file
const overrides = readFileSync('./src/database/overrides.json', 'utf-8')

// Run the codegen command
execSync(
	`kysely-codegen --out-file src/database/schema.ts --dialect sqlite --overrides='${overrides}'`,
	{
		stdio: 'inherit'
	}
)
