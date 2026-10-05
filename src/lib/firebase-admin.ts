import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
try {
  const configPath = path.resolve('firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    projectId = config.projectId || projectId;
  }
} catch (e) {
  console.warn('Failed to read firebase-applet-config.json:', e);
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId || 'ai-studio-bizflow-7df2f724-37f1-4fe7-bf5d-a692e18bc6d3',
  });
}

export const adminAuth = getAuth();
