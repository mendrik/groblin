import { createServer } from 'node:http'
const cmsUrl=process.env.GROBLIN_URL
const key=process.env.GROBLIN_API_KEY
if (!cmsUrl||!key) throw new Error('Set GROBLIN_URL and GROBLIN_API_KEY; create and publish a root String field named Title')
const escape=text=>text.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]))
const server=createServer(async(_request,response)=>{
 try {
  const result=await fetch(new URL('/content/graphql',cmsUrl),{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':key},body:JSON.stringify({query:'query { Title }'}),signal:AbortSignal.timeout(5000)})
  const payload=await result.json()
  if (!result.ok||payload.errors||typeof payload.data?.Title!=='string') throw new Error('Content unavailable')
  response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'})
  response.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Groblin consumer</title><main><h1>${escape(payload.data.Title)}</h1><p>Published content from the Groblin API.</p></main></html>`)
 } catch {response.writeHead(503);response.end('Content is temporarily unavailable')}
})
server.listen(Number(process.env.PORT??8089),'127.0.0.1',()=>console.log('Consumer website ready'))
process.on('SIGTERM',()=>server.close())
