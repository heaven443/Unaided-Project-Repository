#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const OUT_DIR = path.join(__dirname, '..', 'assets', 'figma-exports')

async function main(){
  const TOKEN = process.env.FIGMA_TOKEN
  const FILE_KEY = process.env.FIGMA_FILE_KEY
  if(!TOKEN || !FILE_KEY){
    console.error('Usage: set FIGMA_TOKEN and FIGMA_FILE_KEY environment variables and run this script')
    process.exit(2)
  }

  if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const headers = { 'X-Figma-Token': TOKEN }

  console.log('Fetching file metadata...')
  const fileRes = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, { headers })
  if(!fileRes.ok) { console.error('Failed to fetch file:', fileRes.status, await fileRes.text()); process.exit(1) }
  const fileJson = await fileRes.json()

  function collectFrames(node, out){
    if(!node) return
    if(node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE' ){ out.push({ id: node.id, name: node.name }) }
    if(node.children) node.children.forEach(c=>collectFrames(c, out))
  }

  const frames = []
  collectFrames(fileJson.document, frames)
  if(frames.length === 0){ console.log('No frames found to export.'); process.exit(0) }

  console.log(`Found ${frames.length} frames; requesting image URLs...`)
  const ids = frames.map(f=>f.id).join(',')
  const imagesRes = await fetch(`https://api.figma.com/v1/images/${FILE_KEY}?ids=${ids}&format=png&scale=2`, { headers })
  if(!imagesRes.ok){ console.error('Failed to request images:', imagesRes.status, await imagesRes.text()); process.exit(1) }
  const imagesJson = await imagesRes.json()

  const images = imagesJson.images || {}
  const saved = []
  for(const f of frames){
    const url = images[f.id]
    if(!url) continue
    try{
      const resp = await fetch(url)
      if(!resp.ok) { console.warn('Failed to download image for', f.id); continue }
      const ext = 'png'
      const safeName = f.name.replace(/[^a-z0-9-_\.]/ig, '_') || f.id
      const outPath = path.join(OUT_DIR, `${safeName}.${ext}`)
      const arrayBuffer = await resp.arrayBuffer()
      fs.writeFileSync(outPath, Buffer.from(arrayBuffer))
      console.log('Saved', outPath)
      saved.push({ id: f.id, name: f.name, path: outPath })
    } catch(e){ console.warn('Error saving', f.id, e.message) }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(saved, null, 2))
  console.log('Export complete. Files written to', OUT_DIR)
}

main().catch(err=>{ console.error(err); process.exit(1) })
