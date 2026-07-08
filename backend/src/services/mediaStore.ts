import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { HttpError } from '../middleware/errorHandler';
import { makeSlug } from './postStore';

const uploadRoot = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
const coverDir = path.join(uploadRoot, 'covers');
const allowedMimeTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export type MediaAsset = {
  name: string;
  url: string;
  size: number;
  createdAt: string;
};

async function ensureCoverDir() {
  await fs.mkdir(coverDir, { recursive: true });
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new HttpError(400, 'Upload must be a base64 image data URL.');

  const mimeType = match[1].toLowerCase();
  const extension = allowedMimeTypes[mimeType];
  if (!extension) throw new HttpError(400, 'Only JPG, PNG, WEBP, and GIF images are allowed.');

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) throw new HttpError(400, 'Image file is empty.');
  if (buffer.byteLength > 6 * 1024 * 1024) throw new HttpError(400, 'Image must be 6MB or smaller.');

  return { buffer, extension };
}

export async function listCoverImages(): Promise<MediaAsset[]> {
  await ensureCoverDir();
  const entries = await fs.readdir(coverDir, { withFileTypes: true });
  const assets = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const stat = await fs.stat(path.join(coverDir, entry.name));
        return {
          name: entry.name,
          url: `/uploads/covers/${entry.name}`,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        };
      }),
  );

  return assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveCoverImage(input: { fileName?: string; dataUrl?: string }): Promise<MediaAsset> {
  await ensureCoverDir();
  if (!input.dataUrl) throw new HttpError(400, 'Image data is required.');

  const { buffer, extension } = parseDataUrl(input.dataUrl);
  const baseName = makeSlug(input.fileName || 'cover-image').replace(/\.(jpg|jpeg|png|webp|gif)$/i, '') || 'cover-image';
  const name = `${baseName}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const filePath = path.join(coverDir, name);

  await fs.writeFile(filePath, buffer, { flag: 'wx' });
  const stat = await fs.stat(filePath);

  return {
    name,
    url: `/uploads/covers/${name}`,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
  };
}

export async function deleteCoverImage(name: string) {
  const safeName = path.basename(name);
  if (safeName !== name) throw new HttpError(400, 'Invalid image name.');

  await ensureCoverDir();
  await fs.unlink(path.join(coverDir, safeName)).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') throw new HttpError(404, 'Image not found.');
    throw error;
  });
}

export async function pickRandomCoverImage() {
  const assets = await listCoverImages();
  if (!assets.length) return null;
  return assets[Math.floor(Math.random() * assets.length)].url;
}
