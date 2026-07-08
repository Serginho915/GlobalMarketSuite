import { auditLog } from './auditLog';
import { getAdminSettings } from './adminSettings';
import { pickRandomCoverImage } from './mediaStore';
import { generateArticlesWithOpenRouter } from './openrouter';
import { makeSlug, upsertPost } from './postStore';

let timer: NodeJS.Timeout | undefined;
let lastRunKey = '';

export async function generateAndStoreArticles(actor?: { id?: string; email?: string }, count = 1) {
  await auditLog('generation_trigger', actor || null);
  const inputs = await generateArticlesWithOpenRouter(count);
  const now = Date.now();
  return Promise.all(
    inputs.map(async (input, index) => {
      input.slug = `${makeSlug(input.slug || input.title)}-${now}-${index + 1}`;
      input.coverImage = await pickRandomCoverImage() || input.coverImage;
      return upsertPost(input, 'ai');
    }),
  );
}

export function startGenerationScheduler() {
  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    try {
      const settings = await getAdminSettings();
      if (!settings.autoGenerationEnabled) return;
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const day = now.getDay();
      const times = settings.generationTimes.slice(0, settings.generationCount);
      const shouldRunToday = settings.generationMode === 'daily' || settings.generationWeekdays.includes(day);
      const key = `${now.toISOString().slice(0, 10)}-${hhmm}`;
      if (shouldRunToday && times.includes(hhmm) && key !== lastRunKey) {
        lastRunKey = key;
        await generateAndStoreArticles(undefined, 1);
      }
    } catch (error) {
      console.error('Generation scheduler failed', error);
    }
  }, 60 * 1000);
}
