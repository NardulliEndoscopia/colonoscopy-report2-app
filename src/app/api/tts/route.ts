import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Server TTS disabled. The app uses browser speech synthesis.' },
    { status: 410 }
  );
}
