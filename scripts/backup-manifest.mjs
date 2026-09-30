import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const directory=process.env.BACKUP_DIRECTORY
if (!directory) throw new Error('BACKUP_DIRECTORY is required')
const files={}
for (const name of ['database.dump','media.tar','config.env']) {
 const hash=createHash('sha256')
 for await (const chunk of createReadStream(resolve(directory,name))) hash.update(chunk)
 files[name]=hash.digest('hex')
}
await writeFile(resolve(directory,'manifest.json'),JSON.stringify({format:'groblin-backup',version:1,createdAt:new Date().toISOString(),applicationVersion:'0.1.0',files},null,2)+'\n',{mode:0o600})
