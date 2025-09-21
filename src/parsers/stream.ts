import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import type { Stream, Subtitle } from '../types';
import { parseStreams, parseSubtitles } from './utils';

export class StreamParser extends Page<never> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  /**
   * Fetches stream and subtitle information for a specific episode.
   * @param movieId The ID of the movie or series.
   * @param translatorId The ID of the translator. If no translators are available for the content, use `110` as a default to attempt to fetch default streams.
   * @param season The season number.
   * @param episode The episode number.
   * @returns A promise that resolves to an object containing streams and subtitles.
   */
  public async get(
    movieId: number,
    translatorId: number,
    season: number,
    episode: number
  ): Promise<{ streams: Stream[]; subtitles: Subtitle[] }> {
    const response = await this.scraper.client.post('ajax/get_cdn_series/', {
      form: {
        id: movieId,
        translator_id: translatorId,
        season,
        episode,
        action: 'get_stream',
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const data = JSON.parse(response.body);
    let streams: Stream[] = [];
    let subtitles: Subtitle[] = [];

    if (data.success) {
      if (data.url) {
        streams = parseStreams(data.url);
      }
      if (data.subtitle) {
        subtitles = parseSubtitles(data.subtitle);
      }
    }

    return { streams, subtitles };
  }

  public async extract(): Promise<never> {
    throw new Error('This method is not applicable for the Stream parser. Use get() instead.');
  }
}