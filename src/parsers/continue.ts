import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import type { WatchedMovie } from '../types';

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
      const element = $(el);
      const idStr = element.attr('id');
      
      if (!idStr || !idStr.includes('videosave-')) return;

      const titleElement = element.find('.td.title a');
      const url = titleElement.attr('href');
      const title = titleElement.text().trim();
      const imageUrl = titleElement.data('cover_url') as string;
      const id = parseInt(idStr.replace('videosave-', ''), 10);
      const details = element.find('.td.title small').text().trim();
      const lastWatchedInfo = element.find('.td.info').clone().children().remove().end().text().trim();
      const dateStr = element.find('.td.date').text().trim();
      const lastWatchedAt = parseDate(dateStr);

      if (url && title) {
        movies.push({
          id,
          url,
          title,
          imageUrl,
          details,
          lastWatchedInfo,
          lastWatchedAt
        });
      }
    });

    return movies;
  }
}