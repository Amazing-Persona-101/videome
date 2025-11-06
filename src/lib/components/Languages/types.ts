export interface Language {
  value: string;
  text: string;
}

export interface LanguageGroup {
  group: string;
  languages: Language[];
}
