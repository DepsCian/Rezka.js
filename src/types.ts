export enum Genre {
  FILMS = 1,
  SERIES = 2,
  CARTOONS = 3,
  ANIME = 4,
}

export enum Filter {
  LAST = 'last',
  POPULAR = 'popular',
  SOON = 'soon',
  WATCHING = 'watching',
}

export enum ContentType {
  FILMS = 'Фильмы',
  SERIES = 'Сериалы',
  CARTOONS = 'Мультфильмы',
  ANIME = 'Аниме',
}

export enum Career {
  ACTOR = 'Актер',
  PRODUCER = 'Продюсер',
  DIRECTOR = 'Режиссер',
  WRITER = 'Сценарист',
  EDITOR = 'Монтажер',
  OPERATOR = 'Оператор',
  COMPOSER = 'Композитор',
  ARTIST = 'Художник',
}

export interface Link {
  name: string;
  url: string;
}

export interface PersonCredit {
  id: number;
  name: string;
}

export interface Translator {
  id: number;
  name: string;
  popularity?: number;
}

export interface Rating {
  rating: number;
  votes: number;
}

export interface Stream {
  quality: string;
  url: string;
  translator?: string;
}

export interface Subtitle {
  language: string;
  url: string;
}

export interface Episode {
  id: number;
  title: string;
  streams?: Stream[];
  subtitles?: Subtitle[];
}

export interface Season {
  id: number;
  title: string;
  episodes: Episode[];
}

export interface Movie {
  id: number;
  url: string;
  title: string;
  imageUrl: string;
  type: string;
  details: string;
  additionalInfo?: string;
}

export interface MovieDetails {
  id: number;
  url: string;
  title: string;
  originalTitle?: string;
  poster: string;
  slogan?: string;
  releaseDate?: string;
  country?: string;
  directors?: PersonCredit[];
  genres?: Link[];
  quality?: string;
  ageRestriction?: number;
  duration?: number;
  collections?: Link[];
  lists?: Link[];
  actors?: PersonCredit[];
  description?: string;
  rating?: {
    imdb?: Rating;
    kinopoisk?: Rating;
    main?: Rating;
  };
  seasons?: Season[];
  subtitles?: Subtitle[];
  translators?: Translator[];
  currentWatch?: {
    season: number;
    episode: number;
    translatorId: number;
  };
  roadmap?: {
    season: number;
    episode: number;
    title?: string;
    releaseDate?: string;
  }[];
}

export interface PersonDetails {
  id: number;
  url: string;
  name: string;
  originalName?: string;
  photo: string;
  stats?: string;
  careers?: Career[];
  height?: number;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  gender?: 'male' | 'female';
  filmography?: {
    [role: string]: Movie[];
  };
}

export type GenreInfo = Link;

export interface Paginated<T> {
  data: T[];
  meta: {
    currentPage: number;
    pageSize: number;
    total?: number;
    totalPages?: number;
  }
}

export interface WatchedMovie {
  id: number;
  url: string;
  title: string;
  imageUrl: string;
  details: string;
  lastWatchedInfo: string;
  lastWatchedAt: string;
}
