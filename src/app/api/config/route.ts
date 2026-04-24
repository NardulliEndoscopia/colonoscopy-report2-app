import { NextRequest, NextResponse } from 'next/server';
import { DoctorConfig } from '@/lib/types';
import path from 'path';
import fs from 'fs';

const KV_KEY         = 'nardulli_doctor_config';
const BLOB_JSON_PATH = 'config/doctor-config.json';
const CONFIG_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'doctor-config-live.json');

function isKvAvailable()   { return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN); }
function isBlobAvailable() { return !!process.env.BLOB_READ_WRITE_TOKEN; }

/* ── Vercel KV ─────────────────────────────────────────────────────── */
async function readFromKv(): Promise<DoctorConfig> {
  const { kv } = await import('@vercel/kv');
  return (await kv.get<DoctorConfig>(KV_KEY)) ?? {};
}
async function writeToKv(config: DoctorConfig): Promise<void> {
  const { kv } = await import('@vercel/kv');
  await kv.set(KV_KEY, config);
}

/* ── Vercel Blob JSON ──────────────────────────────────────────────── */
async function readFromBlob(): Promise<DoctorConfig> {
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'config/' });
    const found = blobs.find((b) => b.pathname === BLOB_JSON_PATH);
    if (!found) return {};
    const res = await fetch(`${found.url}?t=${Date.now()}`);
    if (!res.ok) return {};
    return (await res.json()) as DoctorConfig;
  } catch { return {}; }
}
async function writeToBlob(config: DoctorConfig): Promise<void> {
  const { put } = await import('@vercel/blob');
  await put(BLOB_JSON_PATH, JSON.stringify(config), {
    access: 'public', contentType: 'application/json', allowOverwrite: true,
  });
}

/* ── Local file (dev only) ─────────────────────────────────────────── */
function readFromFile(): DoctorConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH))
      return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8')) as DoctorConfig;
  } catch { /* ignore */ }
  return {};
}
function writeToFile(config: DoctorConfig): void {
  const dir = path.dirname(CONFIG_FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

/* ── GET ───────────────────────────────────────────────────────────── */
export async function GET() {
  try {
    if (isKvAvailable())   return NextResponse.json(await readFromKv());
    if (isBlobAvailable()) return NextResponse.json(await readFromBlob());
    return NextResponse.json(readFromFile());
  } catch (err) {
    console.error('Config GET error:', err);
    return NextResponse.json({});
  }
}

/* ── POST ──────────────────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, config }: { password: string; config?: DoctorConfig } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword)
      return NextResponse.json({ error: 'ADMIN_PASSWORD not configured' }, { status: 500 });
    if (password !== adminPassword)
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });

    if (!config) return NextResponse.json({ success: true, authenticated: true });

    if (isKvAvailable())        await writeToKv(config);
    else if (isBlobAvailable()) await writeToBlob(config);
    else                        writeToFile(config);

    return NextResponse.json({ success: true, saved: true });
  } catch (err) {
    console.error('Config POST error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
