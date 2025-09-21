import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import type { MovieDetails, Season, Rating } from '../types';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import {
  parseLinks,
  parsePersons,
  parseDate,
  parseTranslators,
} from './utils';

export class Movie extends Page<MovieDetails> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async get(idOrUrl: number | string): Promise<MovieDetails> {
    const url = typeof idOrUrl === 'number' ? await this._getUrlFromId(idOrUrl) : idOrUrl;
    const response = await this.scraper.get(url);
    const $ = this.parse(response.body);

    const primaryInfo = this._extractPrimaryInfo($, url);
    const infoTable = $('.b-post__info');
    const metadata = this._extractMetadata(infoTable);
    const credits = this._extractCredits($, infoTable);
    const ratings = this._extractRatings($);
    const seriesInfo = this._extractSeriesInfo($, parseTranslators($));
    
    const description = $('.b-post__description_text').text().trim();
    
    const roadmap: MovieDetails['roadmap'] = [];
    $('.b-post__schedule_list tr').each((_, el) => {
      const $el = $(el);
      const seasonEpisode = $el.find('.td-1').text();
      const seasonMatch = seasonEpisode.match(/(\d+) сезон (\d+) серия/);
      if (seasonMatch) {
        roadmap.push({
          season: Number(seasonMatch[1]),
          episode: Number(seasonMatch[2]),
          title: $el.find('.td-2 b').text() || undefined,
          releaseDate: $el.find('.td-4').text() || undefined,
        });
      }
    });

    return {
      url,
      ...primaryInfo,
      ...metadata,
      ...credits,
      description: description || undefined,
      rating: ratings,
      roadmap: roadmap.length > 0 ? roadmap : undefined,
      ...seriesInfo,
    };
  }

  private _extractPrimaryInfo($: cheerio.CheerioAPI, url: string) {
    const match = url.match(/\/(\d+)-/);
    const id = match ? Number(match[1]) : 0;
    const title = $('.b-post__title h1').text();
    const originalTitle = $('.b-post__origtitle').text();
    const poster = $('.b-sidecover img').attr('src') || '';

    return { id, title, originalTitle, poster };
  }

  private _extractMetadata(infoTable: cheerio.Cheerio<Element>) {
    const slogan = infoTable.find('tr:contains("Слоган") td:last-child').text().trim().replace(/[«»]/g, '');
    const releaseDate = parseDate(infoTable.find('tr:contains("Дата выхода") td:last-child').text());
    const country = infoTable.find('tr:contains("Страна") td:last-child').text().trim();
    const quality = infoTable.find('tr:contains("В качестве") td:last-child').text().trim();
    const ageRestriction = parseInt(infoTable.find('tr:contains("Возраст") td:last-child').text(), 10) || undefined;
    const duration = parseInt(infoTable.find('tr:contains("Время") td:last-child').text(), 10) || undefined;

    return { 
      slogan: slogan || undefined,
      releaseDate,
      country: country || undefined,
      quality: quality || undefined,
      ageRestriction,
      duration
    };
  }

  private _extractCredits($: cheerio.CheerioAPI, infoTable: cheerio.Cheerio<Element>) {
    const directors = parsePersons($, infoTable, 'Режиссер');
    const actors = parsePersons($, infoTable, 'В ролях актеры');
    const genres = parseLinks($, infoTable, 'Жанр');
    const collections = parseLinks($, infoTable, 'Из серии');
    const lists = parseLinks($, infoTable, 'Входит в списки');

    return { directors, actors, genres, collections, lists };
  }

  private _extractRatings($: cheerio.CheerioAPI) {
    const imdbRatingNode = $('.b-post__info_rates.imdb');
    const imdbRating = Number(imdbRatingNode.find('.bold').text());
    const imdbVotesMatch = imdbRatingNode.find('i').text().match(/\(([\d\s,]+)\)/);
    const imdbVotes = imdbVotesMatch ? Number(imdbVotesMatch[1]?.replace(/[\s,]/g, '')) : 0;

    const kinopoiskRatingNode = $('.b-post__info_rates.kp');
    const kinopoiskRating = Number(kinopoiskRatingNode.find('.bold').text());
    const kinopoiskVotesMatch = kinopoiskRatingNode.find('i').text().match(/\(([\d\s,]+)\)/);
    const kinopoiskVotes = kinopoiskVotesMatch ? Number(kinopoiskVotesMatch[1]?.replace(/[\s,]/g, '')) : 0;

    const mainRatingText = $('.b-post__rating .num').text();
    const mainVotesText = $('.b-post__rating .votes').text();
    const mainMatch = mainVotesText.match(/\(([\d,]+)\)/);

    const rating: { imdb?: Rating; kinopoisk?: Rating; main?: Rating; } = {};
    if(imdbRating && imdbVotes) rating.imdb = { rating: imdbRating, votes: imdbVotes };
    if(kinopoiskRating && kinopoiskVotes) rating.kinopoisk = { rating: kinopoiskRating, votes: kinopoiskVotes };
    if(mainRatingText && mainMatch && mainMatch[1]) rating.main = { rating: Number(mainRatingText), votes: Number(mainMatch[1].replace(/,/g, '')) };

    return rating;
  }

  private _extractSeriesInfo($: cheerio.CheerioAPI, translators: import('../types').Translator[] | undefined) {
    let currentWatch: MovieDetails['currentWatch'] | undefined;
    const seasons: Season[] = [];
    let updatedTranslators = translators;

    $('#simple-seasons-tabs .b-simple_season__item').each((_: number, seasonEl: Element) => {
      const $seasonEl = $(seasonEl);
      const seasonId = Number($seasonEl.data('tab_id'));
      if (seasonId) {
        const season: Season = { id: seasonId, title: $seasonEl.text(), episodes: [] };
        
        $(`#simple-episodes-list-${seasonId} .b-simple_episode__item`).each((_: number, episodeEl: Element) => {
          const $episodeEl = $(episodeEl);
          const episodeId = $episodeEl.data('episode_id');
          if (episodeId) {
            season.episodes.push({
              id: Number(episodeId),
              title: $episodeEl.text()
            });
          }
        });
        seasons.push(season);
      }
    });
    
    if (seasons.length === 0) {
        seasons.push({
            id: 0,
            title: 'Сезон 0',
            episodes: [{
                id: 0,
                title: 'Эпизод 0'
            }]
        });
    }

    const scriptContent = $('script:contains("initCDNSeriesEvents")').last().html();
    if (scriptContent) {
      const regexMatch = scriptContent.match(/initCDNSeriesEvents\((.*?)\);/);
      if (regexMatch && regexMatch[1]) {
        const argsString = regexMatch[1];
        try {
          const args = new Function(`return [${argsString}]`)();
          if (args.length > 2) {
            const translatorId = args[1];
            currentWatch = {
              translatorId,
              season: args[2],
              episode: args[3],
            };

            if (!updatedTranslators || updatedTranslators.length === 0) {
                updatedTranslators = [{
                    id: translatorId,
                    name: 'Unknown'
                }];
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }
    
    return {
        seasons: seasons.length > 0 ? seasons : undefined,
        currentWatch,
        translators: updatedTranslators
    }
  }

  private async _getUrlFromId(id: number): Promise<string> {
    const response = await this.scraper.client.post('engine/ajax/quick_content.php', {
      form: { id, is_touch: 1, },
      headers: { 'X-Requested-With': 'XMLHttpRequest', },
    });

    const $ = this.parse(response.body);
    const url = $('.b-content__bubble_title a').attr('href');

    if (!url) {
      throw new Error(`Could not find URL for movie with ID ${id}`);
    }
    return url;
  }

  public async extract(): Promise<MovieDetails> {
    throw new Error('This method is not applicable for the Movie parser. Use get() instead.');
  }
}