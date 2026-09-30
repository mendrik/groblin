import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const email = process.argv[2]
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: node scripts/setup-selfhost.mjs owner@example.com [https://cms.example.com] [https://media.example.com]')
const publicUrl = new URL(process.argv[3] ?? 'http://localhost:8088')
const storageUrl = new URL(process.argv[4] ?? 'http://localhost:9008')
for (const url of [publicUrl, storageUrl]) if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/') throw new Error('Use an HTTP(S) origin without a path or credentials')
const secret = () => randomBytes(32).toString('hex')
const config = {
 GROBLIN_VERSION:'0.1.0', PUBLIC_URL: publicUrl.origin, STORAGE_PUBLIC_URL: storageUrl.origin,
 POSTGRES_PASSWORD:secret(), BETTER_AUTH_SECRET:secret(), MEDIA_SIGNING_SECRET:secret(),
 AWS_REGION:'us-east-1', AWS_BUCKET:'groblin-media', AWS_ACCESS_KEY_ID:randomBytes(12).toString('hex'), AWS_SECRET_ACCESS_KEY:secret(),
 EMAIL_TRANSPORT:'smtp', SMTP_URL:'smtp://mailpit:1025', EMAIL:'groblin@localhost.invalid',
 REGISTRATION_MODE:'invite', BOOTSTRAP_EMAIL:email.toLowerCase(),
 HISTORY_DAYS:'30', HISTORY_LIMIT:'1000', PUBLICATION_LIMIT:'100',
 HTTP_PORT:'80', HTTPS_PORT:'443', LOCAL_APP_PORT:'8088', LOCAL_STORAGE_PORT:'9008', MAILPIT_PORT:'8028'
}
const path = resolve(import.meta.dirname, '../deploy/.env')
await writeFile(path, Object.entries(config).map(([key,value])=>`${key}=${value}`).join('\n')+'\n', { mode:0o600, flag:'wx' })
console.log(`Created ${path}; replace SMTP_URL and EMAIL for production email.`)
