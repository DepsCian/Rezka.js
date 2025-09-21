import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Movie, Stream, Subtitle, PersonCredit, Link, Translator } from '../types';

type Extractor = {
  extractText: ($: CheerioAPI, context: Cheerio<Element> | string, selector?: string) => string;
  extractAttribute: ($: CheerioAPI, context: Cheerio<Element> | string, attribute: string, selector?: string) => string;
}

export function parseMovies($: CheerioAPI, extractor: Extractor): Movie[] {
  const moviesOnPage: Movie[] = [];
  $('.b-content__inline_item').each((_, el) => {
    const $el = $(el);
    moviesOnPage.push({
      id: Number(extractor.extractAttribute($, $el, 'data-id')),
      url: extractor.extractAttribute($, $el, 'href', '.b-content__inline_item-cover a'),
      title: extractor.extractText($, $el, '.b-content__inline_item-link a'),
      imageUrl: extractor.extractAttribute($, $el, 'src', '.b-content__inline_item-cover img'),
      type: extractor.extractText($, $el, '.cat i.entity'),
      details: extractor.extractText($, $el, '.b-content__inline_item-link div'),
      additionalInfo: (() => {
        try {
          return extractor.extractText($, $el, '.info');
        } catch (e) {
          return undefined;
        }
      })(),
    });
  });
  return moviesOnPage;
}

export function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const months: { [key: string]: string } = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
    'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
  };
  const parts = dateStr.split(' ');
  if (parts.length < 3) return undefined;
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  if (!day || !month || !year || !months[month]) {
    return undefined;
  }
  return `${year}-${months[month]}-${day.padStart(2, '0')}`;
}

export function parseDateTime(dateStr: string): string | undefined {
    if (!dateStr) return undefined;

    const cleanedDateStr = dateStr.replace('оставлен', '').trim();
    const now = new Date();

    const timeMatch = cleanedDateStr.match(/(\d{2}):(\d{2})$/);
    const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}:00` : '00:00:00';

    if (cleanedDateStr.includes('сегодня')) {
        const today = now.toISOString().split('T')[0];
        return `${today}T${time}.000Z`;
    }
    if (cleanedDateStr.includes('вчера')) {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        return `${yesterdayStr}T${time}.000Z`;
    }

    const months: { [key: string]: string } = {
        'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
        'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
    };

    const dateParts = cleanedDateStr.match(/(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u);
    if (dateParts && dateParts[1] && dateParts[2] && dateParts[3]) {
        const day = dateParts[1].padStart(2, '0');
        const month = months[dateParts[2]];
        const year = dateParts[3];
        if (day && month && year) {
            return `${year}-${month}-${day}T${time}.000Z`;
        }
    }

    return undefined;
}

export function parsePersons($: CheerioAPI, table: Cheerio<Element>, label: string, extractor: Extractor): PersonCredit[] | undefined {
  const persons: PersonCredit[] = [];
  table.find(`tr:contains("${label}") .persons-list-holder .item`).each((_, el) => {
    const $el = $(el).find('.person-name-item');
    try {
      const id = Number(extractor.extractAttribute($, $el, 'data-id'));
      const name = extractor.extractText($, $el, 'span[itemprop="name"]');
      persons.push({ id, name });
    } catch (e) {
      // Ignore if person item is malformed
    }
  });
  return persons.length > 0 ? persons : undefined;
}

export function parseLinks($: CheerioAPI, table: Cheerio<Element>, label: string, extractor: Extractor): Link[] | undefined {
  const links: Link[] = [];
  table.find(`tr:contains("${label}") a`).each((_, el) => {
    const $el = $(el);
    try {
      const name = extractor.extractText($, $el);
      const url = extractor.extractAttribute($, $el, 'href');
      links.push({ name, url });
    } catch (e) {
      // Ignore if link is malformed
    }
  });
  return links.length > 0 ? links : undefined;
}

export function parseTranslators($: any): Translator[] | undefined {
    const translators: Translator[] = [];
    const popularityMap = new Map<string, number>();

    const statsTitle = $('.b-rgstats__help').attr('title');
    if (statsTitle) {
        const $stats = $(statsTitle);
        $stats.find('.b-rgstats__list_item').each((_: number, item: Element) => {
            const $item = $(item);
            const name = $item.find('.title').text().trim();
            const popularityText = $item.find('.count').text().replace('%', '').replace(',', '.');
            const popularity = parseFloat(popularityText);
            if (name && !isNaN(popularity)) {
                popularityMap.set(name, popularity);
            }
        });
    }

    $('.b-translator__item').each((_: number, el: Element) => {
        const $el = $(el);
        const id = $el.data('translator_id');
        const name = $el.attr('title');
        if (id && name) {
            const popularity = popularityMap.get(name.trim());
            translators.push({
                id: Number(id),
                name: name.trim(),
                popularity,
                isPaid: $el.hasClass('b-prem_translator')
            });
        }
    });
    return translators.length > 0 ? translators : undefined;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseStreams(obfuscatedUrls: string): Stream[] {
  let trashString = obfuscatedUrls.replace("#h", "").split("//_//").join("");
  const trashList = ["@", "#", "!", "^", "$"];
  const trashCodesSet: string[] = [];

  for (let i = 2; i < 4; i++) {
      const product = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
      const combinations = product(...Array(i).fill(trashList));
      
      for (const chars of combinations) {
          const trashCombo = Buffer.from(chars.join('')).toString('base64');
          trashCodesSet.push(trashCombo);
      }
  }

  for (const trashCode of trashCodesSet) {
    trashString = trashString.replace(new RegExp(escapeRegExp(trashCode), 'g'), '');
  }
  
  const streamsStr = Buffer.from(trashString, 'base64').toString('utf8');

  const streamRegex = /\[([^\]]+)\]([^,]+)/g;
  let match;
  const streams: Stream[] = [];

  while ((match = streamRegex.exec(streamsStr)) !== null) {
    if (match[1] && match[2]) {
      const quality = match[1];
      match[2].split(' or ').forEach(url => {
        if (url.includes('//')) {
          streams.push({ quality, url: url.trim() });
        }
      });
    }
  }
  return streams;
}

export function parseSubtitles(subtitlesStr: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const subtitleRegex = /\[([^\]]+)\](https?:\/\/[^\s,]+)/g;
  let match;
  while ((match = subtitleRegex.exec(subtitlesStr)) !== null) {
    if (match[1] && match[2]) {
      subtitles.push({
        language: match[1],
        url: match[2]
      });
    }
  }
  return subtitles;
}