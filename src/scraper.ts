import { Scraper as CoreScraper } from './core/scraper';
import { Movies } from './parsers/movies';
import { Auth } from './parsers/auth';
import { Movie } from './parsers/movie';
import { Person } from './parsers/person';
import { Genres } from './parsers/genres';
import { Search } from './parsers/search';
import { Continue } from './parsers/continue';
import { StreamParser } from './parsers/stream';
import { Comments } from './parsers/comments';

export class Scraper {
  private readonly core: CoreScraper;
  public readonly movies: Movies;
  public readonly auth: Auth;
  public readonly movie: Movie;
  public readonly person: Person;
  public readonly genres: Genres;
  public readonly search: Search;
  public readonly continue: Continue;
  public readonly stream: StreamParser;
  public readonly comments: Comments;

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
