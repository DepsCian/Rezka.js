import { Scraper as CoreScraper } from '@/core/scraper';
import { Movies } from '@/parsers/movies';
import { Auth } from '@/parsers/auth';
import { Movie } from '@/parsers/movie';
import { Person } from '@/parsers/person';
import { Genres } from '@/parsers/genres';
import { Search } from '@/parsers/search';
import { Continue } from '@/parsers/continue';
import { StreamParser } from '@/parsers/stream';
import { Comments } from '@/parsers/comments';

/**
 * The main class for interacting with the parser.
 */
export class Scraper {
  private readonly core: CoreScraper;
  /**
   * Parser for interacting with movie sections.
   */
  public readonly movies: Movies;
  /**
   * Parser for authentication.
   */
  public readonly auth: Auth;
  /**
   * Parser for retrieving detailed movie information.
   */
  public readonly movie: Movie;
  /**
   * Parser for retrieving information about persons (actors, directors).
   */
  public readonly person: Person;
  /**
   * Parser for working with genres.
   */
  public readonly genres: Genres;
  /**
   * Parser for performing searches.
   */
  public readonly search: Search;
  /**
   * Parser for the "continue watching" list.
   */
  public readonly continue: Continue;
  /**
   * Parser for getting video stream sources.
   */
  public readonly stream: StreamParser;
  /**
   * Parser for working with comments.
   */
  public readonly comments: Comments;

  /**
   * @param baseURL Optional parameter to change the site mirror.
   */
  constructor(baseURL?: string) {
    this.core = new CoreScraper(baseURL);
    this.movies = new Movies(this.core);
    this.auth = new Auth(this.core);
    this.movie = new Movie(this.core);
    this.person = new Person(this.core);
    this.genres = new Genres(this.core);
    this.search = new Search(this.core);
    this.continue = new Continue(this.core);
    this.stream = new StreamParser(this.core);
    this.comments = new Comments(this.core);
  }
}
