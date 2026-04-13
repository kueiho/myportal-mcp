import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join } from 'path'

// Init Firebase - cert() takes the file path directly
const credPath = '/home/jarvis/projects/my-portal-private/my-portal-a0266-firebase-adminsdk-fbsvc-8090112576.json'
initializeApp({ credential: cert(credPath) })

const db = getFirestore()

// Read the research document
const docPath = '/home/jarvis/.openclaw/workspace-dev/README_UI_MCP_RESEARCH.md'
const content = readFileSync(docPath, 'utf-8')

// Upload to Firestore
async function main() {
  const doc = {
    title: 'Web MCP for Vue 3 研究報告 (2026-04-02)',
    content,
    tags: ['需求', '規格', '計畫'],
    isPinned: true,
    isFavorite: true,
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const result = await db.collection('mdDocuments').add(doc)
  console.log('文件已上傳，ID:', result.id)
}

main().catch(console.error)
