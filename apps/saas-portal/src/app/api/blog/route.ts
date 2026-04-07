import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Point to the authoritative static documentation in the codebase
const BLOG_PATH = path.resolve(process.cwd(), '../../docs/ideation/project_journey_blog.md');
// Sync to the AI's "brain" location as well so future agents can read edits
const BRAIN_PATH = path.resolve(process.cwd(), '../../.gemini/antigravity/brain/ec50f75c-5070-4b08-86df-1bade5bd5220/project_journey_blog.md');

export async function GET() {
  try {
    const content = fs.existsSync(BLOG_PATH) ? fs.readFileSync(BLOG_PATH, 'utf-8') : '# Blog missing in root folder.';
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to read blog: ' + message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    
    // Write changes natively to the repo
    fs.writeFileSync(BLOG_PATH, content, 'utf-8');
    
    // Silently sync backwards into the Agent's active context memory if the directory exists
    if (fs.existsSync(path.dirname(BRAIN_PATH))) {
      fs.writeFileSync(BRAIN_PATH, content, 'utf-8');
    }
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update blog: ' + message }, { status: 500 });
  }
}
