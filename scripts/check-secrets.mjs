import { execFileSync } from 'node:child_process'
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)
const forbidden=paths.filter(path=>/(^|\/)\.env($|\.)/.test(path)&& !/\.env\.(example|template)$/.test(path)||path==='backend/database/test-data.sql')
if (forbidden.length) throw new Error(`Private files are tracked: ${forbidden.join(', ')}`)
console.log('Tracked private configuration and database dump check passed')
