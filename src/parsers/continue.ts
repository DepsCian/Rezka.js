import { Page } from '@/core/page';
import type { Scraper } from '@/core/scraper';
import type { WatchedMovie } from '@/types';

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(dateStr: string): string {
  const today = new Date();
  if (dateStr.includes('сегодня')) {
    return toYMD(today);
  }
  if (dateStr.includes('вчера')) {
    today.setDate(today.getDate() - 1);
    return toYMD(today);
  }

  const parts = dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (parts) {
    const [, day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }

  return toYMD(new Date());
}

export class Continue extends Page<WatchedMovie[]> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async extract(): Promise<WatchedMovie[]> {
    const response = await this.scraper.get('continue/');
    const $ = this.parse(response.body);
    const movies: WatchedMovie[] = [];

    $('.b-videosaves__list_item').each((_, el) => {
      try {
        const element = $(el);
        const idStr = this.extractAttribute($, element, 'id');

        if (!idStr.includes('videosave-')) return;

        const titleElement = element.find('.td.title a');
        const url = this.extractAttribute($, titleElement, 'href');
        const title = this.extractText($, titleElement);
        const imageUrl = this.extractAttribute($, titleElement, 'data-cover_url');
        const id = parseInt(idStr.replace('videosave-', ''), 10);
        const details = this.extractText($, element, '.td.title small');
        const lastWatchedInfo = element
          .find('.td.info')
          .clone()
          .children()
          .remove()
          .end()
          .text()
          .trim(); // This is complex, leave as is for now
        const dateStr = this.extractText($, element, '.td.date');
        const lastWatchedAt = parseDate(dateStr);

        if (url && title) {
          movies.push({
            id,
            url,
            title,
            imageUrl,
            details,
            lastWatchedInfo,
            lastWatchedAt,
          });
        }
      } catch (e) {
        this.logger.warn({ error: e }, 'Failed to parse a watched movie item');
      }
    });

    return movies;
  }
}
