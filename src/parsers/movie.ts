import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import type { MovieDetails, Season, Rating, FranchisePart } from '../types';
import {
  parseLinks,
  parsePersons,
  parseDate,
  parseTranslators,
} from './utils';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';

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
    const metadata = this._extractMetadata($, infoTable, url);
    const credits = this._extractCredits($, infoTable);
    const ratings = this._extractRatings($, url);
    const seriesInfo = this._extractSeriesInfo($, parseTranslators($), url);
    const franchise = this._extractFranchise($, url);
    
    const description = this.extractText($, '.b-post__description_text');
    
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
          releaseDate: parseDate($el.find('.td-4').text()),
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
      franchise,
    };
  }

  private _extractPrimaryInfo($: CheerioAPI, url: string) {
    const match = url.match(/\/(\d+)-/);
    const id = match ? Number(match[1]) : 0;
    const title = this.extractText($, '.b-post__title h1');
    let originalTitle: string | undefined;
    try {
      originalTitle = this.extractText($, '.b-post__origtitle');
    } catch (e) {
      this.logger.warn({ error: e, context: { id, url } }, 'Failed to extract originalTitle');
    }
    const poster = this.extractAttribute($, '.b-sidecover img', 'src');

    return { id, title, originalTitle, poster };
  }

  private _extractMetadata($: CheerioAPI, infoTable: Cheerio<Element>, url: string) {
    let slogan: string | undefined;
    try {
      slogan = this.extractText($, infoTable, 'tr:contains("Слоган") td:last-child').replace(/[«»]/g, '');
    } catch (e) {
      this.logger.warn({ error: e, context: { url } }, 'Failed to extract slogan');
    }

    const releaseDate = parseDate(this.extractText($, infoTable, 'tr:contains("Дата выхода") td:last-child'));
    const country = this.extractText($, infoTable, 'tr:contains("Страна") td:last-child');
    const quality = this.extractText($, infoTable, 'tr:contains("В качестве") td:last-child');
    
    let ageRestriction: number | undefined;
    try {
      ageRestriction = parseInt(this.extractText($, infoTable, 'tr:contains("Возраст") td:last-child'), 10);
    } catch (e) {
      this.logger.warn({ error: e, context: { url } }, 'Failed to extract ageRestriction');
    }

    let duration: number | undefined;
    try {
      duration = parseInt(this.extractText($, infoTable, 'tr:contains("Время") td:last-child'), 10);
    } catch (e) {
      this.logger.warn({ error: e, context: { url } }, 'Failed to extract duration');
    }

    return {
      slogan,
      releaseDate,
      country: country || undefined,
      quality: quality || undefined,
      ageRestriction: isNaN(ageRestriction!) ? undefined : ageRestriction,
      duration: isNaN(duration!) ? undefined : duration
    };
  }

  private _extractCredits($: CheerioAPI, infoTable: Cheerio<Element>) {
    const extractor = {
      extractText: this.extractText.bind(this),
      extractAttribute: this.extractAttribute.bind(this)
    };
    const directors = parsePersons($, infoTable, 'Режиссер', extractor);
    const actors = parsePersons($, infoTable, 'В ролях актеры', extractor);
    const genres = parseLinks($, infoTable, 'Жанр', extractor);
    const collections = parseLinks($, infoTable, 'Из серии', extractor);
    const lists = parseLinks($, infoTable, 'Входит в списки', extractor);

    return { directors, actors, genres, collections, lists };
  }

  private _extractRatings($: CheerioAPI, url: string) {
    const rating: { imdb?: Rating; kinopoisk?: Rating; main?: Rating; } = {};

    try {
      const imdbRatingNode = $('.b-post__info_rates.imdb');
      const imdbRating = Number(this.extractText($, imdbRatingNode, '.bold'));
      const imdbVotesMatch = this.extractText($, imdbRatingNode, 'i').match(/\(([\d\s,]+)\)/);
      const imdbVotes = imdbVotesMatch ? Number(imdbVotesMatch[1]?.replace(/[\s,]/g, '')) : 0;
      if(imdbRating && imdbVotes) rating.imdb = { rating: imdbRating, votes: imdbVotes };
    } catch (e) {
      this.logger.warn({ error: e, context: { url } }, 'Failed to extract imdb rating');
    }

    try {
      const kinopoiskRatingNode = $('.b-post__info_rates.kp');
      const kinopoiskRating = Number(this.extractText($, kinopoiskRatingNode, '.bold'));
      const kinopoiskVotesMatch = this.extractText($, kinopoiskRatingNode, 'i').match(/\(([\d\s,]+)\)/);
      const kinopoiskVotes = kinopoiskVotesMatch ? Number(kinopoiskVotesMatch[1]?.replace(/[\s,]/g, '')) : 0;
      if(kinopoiskRating && kinopoiskVotes) rating.kinopoisk = { rating: kinopoiskRating, votes: kinopoiskVotes };
    } catch (e) {
      this.logger.warn({ error: e, context: { url } }, 'Failed to extract kinopoisk rating');
    }

    try {
      const mainRatingText = this.extractText($, '.b-post__rating .num');
      const mainVotesText = this.extractText($, '.b-post__rating .votes');
      const mainMatch = mainVotesText.match(/\(([\d,]+)\)/);
      if(mainRatingText && mainMatch && mainMatch[1]) rating.main = { rating: Number(mainRatingText), votes: Number(mainMatch[1].replace(/,/g, '')) };
    } catch (e) {
      this.logger.warn({ error: e, context: { url } }, 'Failed to extract main rating');
    }

    return rating;
  }

  private _extractSeriesInfo($: CheerioAPI, translators: import('../types').Translator[] | undefined, url: string) {
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
          this.logger.warn({ error: e, context: { url } }, 'Failed to parse initCDNSeriesEvents arguments');
        }
      }
    }
    
    return {
        seasons: seasons.length > 0 ? seasons : undefined,
        currentWatch,
        translators: updatedTranslators
    }
  }

  private _extractFranchise($: CheerioAPI, url: string): FranchisePart[] | undefined {
    const franchise: FranchisePart[] = [];

    $('.b-post__partcontent_item').each((_, el) => {
      const $el = $(el);
      try {
        const itemUrl = this.extractAttribute($, $el, 'data-url');
        const title = this.extractText($, $el, '.title');
        const year = parseInt(this.extractText($, $el, '.year'), 10);
        const rating = parseFloat(this.extractText($, $el, '.rating'));

        franchise.push({
          url: itemUrl,
          title,
          year,
          rating: isNaN(rating) ? undefined : rating
        });
      } catch (e) {
        this.logger.warn({ error: e, context: { url } }, 'Failed to parse franchise item');
      }
    });

    return franchise.length > 0 ? franchise : undefined;
  }

  private async _getUrlFromId(id: number): Promise<string> {
    const response = await this.scraper.client.post('engine/ajax/quick_content.php', {
      form: { id, is_touch: 1, },
      headers: { 'X-Requested-With': 'XMLHttpRequest', },
    });

    const $ = this.parse(response.body);
    const url = this.extractAttribute($, '.b-content__bubble_title a', 'href');

    return url;
  }

  public async extract(): Promise<MovieDetails> {
    throw new Error('This method is not applicable for the Movie parser. Use get() instead.');
  }
}