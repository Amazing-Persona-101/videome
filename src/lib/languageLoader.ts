
// We'll use a type to represent the structure of the imported language files
type LanguageModule = {
  default: Record<string, string>;
};

let languageFiles: Record<string, () => Promise<LanguageModule>> | null = null;

export function getLanguageFiles() {
  if (!languageFiles) {
    languageFiles = import.meta.glob<LanguageModule>('../lang/*.json');
  }
  return languageFiles;
}

export function getLanguageFileNames() {
  const files = getLanguageFiles();
  return Object.keys(files).map(file => {
    const fileName = file.replace('../lang/', '').split('.')[0];
    return fileName;
  });
}

export async function loadLanguage(lang: string): Promise<Record<string, string>> {
  const files = getLanguageFiles();
  const filePath = `../lang/${lang}.json`;
  if (files[filePath]) {
    const module = await files[filePath]();
    return module.default;
  }
  throw new Error(`Language file not found: ${lang}`);
}
