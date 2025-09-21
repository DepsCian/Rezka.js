import got, { HTTPError, RequestError } from 'got';
import type { Got, OptionsOfTextResponseBody, ExtendOptions } from 'got';
import { CookieJar } from 'tough-cookie';
import { NetworkError, NotFoundError } from '@/errors';
import { logger } from '@/logger';
import type { Logger } from 'pino';

export class Scraper {
  public readonly client: Got;
  public readonly cookieJar: CookieJar;
  public readonly logger: Logger;

  constructor(baseURL: string = 'https://rezka.ag/', config: ExtendOptions = {}) {
    this.logger = logger;
    this.cookieJar = new CookieJar();
    const cache = new Map();
    this.client = got.extend({
      prefixUrl: baseURL,
      cookieJar: this.cookieJar,
      cache,
      followRedirect: true,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
        Referer: baseURL,
        Origin: baseURL,
      },
      ...config,
    });
  }

  /**
   * Sends a GET request to the specified path.
   * @param path The path to send the request to.
   * @param config Optional Got request configuration.
   * @returns The response data.
   */
  public async get(path: string, config?: OptionsOfTextResponseBody) {
    try {
      if (path.startsWith('https://') || path.startsWith('http://')) {
        return await this.client.get(path, { ...config, prefixUrl: '' });
      }
      return await this.client.get(path, config);
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode === 404) {
        throw new NotFoundError(`Resource not found at ${path}`, error);
      }
      if (error instanceof RequestError) {
        throw new NetworkError(`Request to ${path} failed`, error);
      }
      throw error;
    }
  }

  /**
   * Sends a POST request to the specified path.
   * @param path The path to send the request to.
   * @param data The data to send with the request.
   * @param config Optional Got request configuration.
   * @returns The response data.
   */
  public async post(
    path: string,
    data?: Record<string, string | number | boolean>,
    config?: OptionsOfTextResponseBody
  ) {
    try {
      return await this.client.post(path, { ...config, form: data });
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode === 404) {
        throw new NotFoundError(`Resource not found at ${path}`, error);
      }
      if (error instanceof RequestError) {
        throw new NetworkError(`Request to ${path} failed`, error);
      }
      throw error;
    }
  }
}
