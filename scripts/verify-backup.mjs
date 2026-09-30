import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
const directory=process.argv[2]
if (!directory) throw new Error('Specify a backup directory')
const manifest=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'))
if (manifest.format!=='groblin-backup'||manifest.version!==1) throw new Error('Unsupported backup format')
for (const name of ['database.dump','media.tar','config.env']) {
 const hash=createHash('sha256')
 for await (const chunk of createReadStream(resolve(directory,name))) hash.update(chunk)
 if (manifest.files?.[name]!==hash.digest('hex')) throw new Error(`Backup checksum mismatch: ${name}`)
}
const {stdout}=await promisify(execFile)('tar',['-tf',resolve(directory,'media.tar')],{maxBuffer:64*1024*1024})
if (stdout.split('\n').some(name=> name.startsWith('/')||name.split('/').includes('..'))) throw new Error('Unsafe media archive path')
const listing=await promisify(execFile)('tar',['-tvf',resolve(directory,'media.tar')],{maxBuffer:64*1024*1024})
if (listing.stdout.split('\n').some(line=>line.startsWith('l')||line.startsWith('h'))) throw new Error('Media archive links are unsupported')
console.log('Backup checksums and archive paths verified')
