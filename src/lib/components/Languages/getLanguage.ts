import type { LanguageGroup } from "./types";
import { getLanguageFileNames } from '$lib/languageLoader';

type LanguageCode = keyof typeof languages;

const languages = {
	ab: {
		value: 'Abkhazian'
	},
	aa: {
		value: 'Afar'
	},
	af: {
		value: 'Afrikaans'
	},
	ak: {
		value: 'Akan'
	},
	sq: {
		value: 'Albanian'
	},
	am: {
		value: 'Amharic'
	},
	ar: {
		value: 'Arabic'
	},
	an: {
		value: 'Aragonese'
	},
	hy: {
		value: 'Armenian'
	},
	as: {
		value: 'Assamese'
	},
	av: {
		value: 'Avaric'
	},
	ae: {
		value: 'Avestan'
	},
	ay: {
		value: 'Aymara'
	},
	az: {
		value: 'Azerbaijani'
	},
	bm: {
		value: 'Bambara'
	},
	ba: {
		value: 'Bashkir'
	},
	eu: {
		value: 'Basque'
	},
	be: {
		value: 'Belarusian'
	},
	bn: {
		value: 'Bengali (Bangla)'
	},
	bh: {
		value: 'Bihari'
	},
	bi: {
		value: 'Bislama'
	},
	bs: {
		value: 'Bosnian'
	},
	br: {
		value: 'Breton'
	},
	bg: {
		value: 'Bulgarian'
	},
	my: {
		value: 'Burmese'
	},
	ca: {
		value: 'Catalan'
	},
	ch: {
		value: 'Chamorro'
	},
	ce: {
		value: 'Chechen'
	},
	ny: {
		value: 'Chichewa, Chewa, Nyanja'
	},
	zh: {
		value: 'Chinese'
	},
	'zh-Hans': {
		value: 'Chinese (Simplified)'
	},
	'zh-Hant': {
		value: 'Chinese (Traditional)'
	},
	cv: {
		value: 'Chuvash'
	},
	kw: {
		value: 'Cornish'
	},
	co: {
		value: 'Corsican'
	},
	cr: {
		value: 'Cree'
	},
	hr: {
		value: 'Croatian'
	},
	cs: {
		value: 'Czech'
	},
	da: {
		value: 'Danish'
	},
	dv: {
		value: 'Divehi, Dhivehi, Maldivian'
	},
	nl: {
		value: 'Dutch'
	},
	dz: {
		value: 'Dzongkha'
	},
	en: {
		value: 'English'
	},
	eo: {
		value: 'Esperanto'
	},
	et: {
		value: 'Estonian'
	},
	ee: {
		value: 'Ewe'
	},
	fo: {
		value: 'Faroese'
	},
	fj: {
		value: 'Fijian'
	},
	fi: {
		value: 'Finnish'
	},
	fr: {
		value: 'French'
	},
	ff: {
		value: 'Fula, Fulah, Pulaar, Pular'
	},
	gl: {
		value: 'Galician'
	},
	gd: {
		value: 'Gaelic (Scottish)'
	},
	ka: {
		value: 'Georgian'
	},
	de: {
		value: 'German'
	},
	el: {
		value: 'Greek'
	},
	kl: {
		value: 'Greenlandic'
	},
	gn: {
		value: 'Guarani'
	},
	gu: {
		value: 'Gujarati'
	},
	ht: {
		value: 'Haitian Creole'
	},
	ha: {
		value: 'Hausa'
	},
	he: {
		value: 'Hebrew'
	},
	hz: {
		value: 'Herero'
	},
	hi: {
		value: 'Hindi'
	},
	ho: {
		value: 'Hiri Motu'
	},
	hu: {
		value: 'Hungarian'
	},
	is: {
		value: 'Icelandic'
	},
	io: {
		value: 'Ido'
	},
	ig: {
		value: 'Igbo'
	},
	id: {
		value: 'Indonesian'
	},
	in: {
		value: 'Indonesian'
	},
	ia: {
		value: 'Interlingua'
	},
	ie: {
		value: 'Interlingue'
	},
	iu: {
		value: 'Inuktitut'
	},
	ik: {
		value: 'Inupiak'
	},
	ga: {
		value: 'Irish'
	},
	it: {
		value: 'Italian'
	},
	ja: {
		value: 'Japanese'
	},
	jv: {
		value: 'Javanese'
	},
	kn: {
		value: 'Kannada'
	},
	kr: {
		value: 'Kanuri'
	},
	ks: {
		value: 'Kashmiri'
	},
	kk: {
		value: 'Kazakh'
	},
	km: {
		value: 'Khmer'
	},
	ki: {
		value: 'Kikuyu'
	},
	rw: {
		value: 'Kinyarwanda (Rwanda)'
	},
	rn: {
		value: 'Kirundi'
	},
	ky: {
		value: 'Kyrgyz'
	},
	kv: {
		value: 'Komi'
	},
	kg: {
		value: 'Kongo'
	},
	ko: {
		value: 'Korean'
	},
	ku: {
		value: 'Kurdish'
	},
	kj: {
		value: 'Kwanyama'
	},
	lo: {
		value: 'Lao'
	},
	la: {
		value: 'Latin'
	},
	lv: {
		value: 'Latvian (Lettish)'
	},
	li: {
		value: 'Limburgish ( Limburger)'
	},
	ln: {
		value: 'Lingala'
	},
	lt: {
		value: 'Lithuanian'
	},
	lu: {
		value: 'Luga-Katanga'
	},
	lg: {
		value: 'Luganda, Ganda'
	},
	lb: {
		value: 'Luxembourgish'
	},
	gv: {
		value: 'Manx'
	},
	mk: {
		value: 'Macedonian'
	},
	mg: {
		value: 'Malagasy'
	},
	ms: {
		value: 'Malay'
	},
	ml: {
		value: 'Malayalam'
	},
	mt: {
		value: 'Maltese'
	},
	mi: {
		value: 'Maori'
	},
	mr: {
		value: 'Marathi'
	},
	mh: {
		value: 'Marshallese'
	},
	mo: {
		value: 'Moldavian'
	},
	mn: {
		value: 'Mongolian'
	},
	na: {
		value: 'Nauru'
	},
	nv: {
		value: 'Navajo'
	},
	ng: {
		value: 'Ndonga'
	},
	nd: {
		value: 'Northern Ndebele'
	},
	ne: {
		value: 'Nepali'
	},
	no: {
		value: 'Norwegian'
	},
	nb: {
		value: 'Norwegian bokmål'
	},
	nn: {
		value: 'Norwegian nynorsk'
	},
	oc: {
		value: 'Occitan'
	},
	oj: {
		value: 'Ojibwe'
	},
	cu: {
		value: 'Old Church Slavonic, Old Bulgarian'
	},
	or: {
		value: 'Oriya'
	},
	om: {
		value: 'Oromo (Afaan Oromo)'
	},
	os: {
		value: 'Ossetian'
	},
	pi: {
		value: 'Pāli'
	},
	ps: {
		value: 'Pashto, Pushto'
	},
	fa: {
		value: 'Persian (Farsi)'
	},
	pl: {
		value: 'Polish'
	},
	pt: {
		value: 'Portuguese'
	},
	pa: {
		value: 'Punjabi (Eastern)'
	},
	qu: {
		value: 'Quechua'
	},
	rm: {
		value: 'Romansh'
	},
	ro: {
		value: 'Romanian'
	},
	ru: {
		value: 'Russian'
	},
	se: {
		value: 'Sami'
	},
	sm: {
		value: 'Samoan'
	},
	sg: {
		value: 'Sango'
	},
	sa: {
		value: 'Sanskrit'
	},
	sr: {
		value: 'Serbian'
	},
	sh: {
		value: 'Serbo-Croatian'
	},
	st: {
		value: 'Sesotho'
	},
	tn: {
		value: 'Setswana'
	},
	sn: {
		value: 'Shona'
	},
	ii: {
		value: 'Sichuan Yi'
	},
	sd: {
		value: 'Sindhi'
	},
	si: {
		value: 'Sinhalese'
	},
	ss: {
		value: 'Siswati'
	},
	sk: {
		value: 'Slovak'
	},
	sl: {
		value: 'Slovenian'
	},
	so: {
		value: 'Somali'
	},
	nr: {
		value: 'Southern Ndebele'
	},
	es: {
		value: 'Spanish'
	},
	su: {
		value: 'Sundanese'
	},
	sw: {
		value: 'Swahili (Kiswahili)'
	},
	sv: {
		value: 'Swedish'
	},
	tl: {
		value: 'Tagalog'
	},
	ty: {
		value: 'Tahitian'
	},
	tg: {
		value: 'Tajik'
	},
	ta: {
		value: 'Tamil'
	},
	tt: {
		value: 'Tatar'
	},
	te: {
		value: 'Telugu'
	},
	th: {
		value: 'Thai'
	},
	bo: {
		value: 'Tibetan'
	},
	ti: {
		value: 'Tigrinya'
	},
	to: {
		value: 'Tonga'
	},
	ts: {
		value: 'Tsonga'
	},
	tr: {
		value: 'Turkish'
	},
	tk: {
		value: 'Turkmen'
	},
	tw: {
		value: 'Twi'
	},
	ug: {
		value: 'Uyghur'
	},
	uk: {
		value: 'Ukrainian'
	},
	ur: {
		value: 'Urdu'
	},
	uz: {
		value: 'Uzbek'
	},
	ve: {
		value: 'Venda'
	},
	vi: {
		value: 'Vietnamese'
	},
	vo: {
		value: 'Volapük'
	},
	wa: {
		value: 'Wallon'
	},
	cy: {
		value: 'Welsh'
	},
	wo: {
		value: 'Wolof'
	},
	fy: {
		value: 'Western Frisian'
	},
	xh: {
		value: 'Xhosa'
	},
	'yi, ji': {
		value: 'Yiddish'
	},
	yo: {
		value: 'Yoruba'
	},
	za: {
		value: 'Zhuang, Chuang'
	},
	zu: {
		value: 'Zulu'
	}
};

const displayedLanguages: Partial<Record<LanguageCode, number>> = {
	af: 1,
	am: 1,
	ar: 1,
	bg: 1,
	bn: 1,
	ca: 1,
	da: 1,
	de: 1,

	el: 1,
	en: 1,
	es: 1,
	fa: 1,
	fi: 1,
	fr: 1,
	he: 1,
	hi: 1,
	hr: 1,

	id: 1,
	it: 1,
	ja: 1,
	ko: 1,
	lt: 1,
	lv: 1,
	ml: 1,
	ms: 1,
	nb: 1,
	nl: 1,

	pl: 1,
	pt: 1,
	ro: 1,
	sk: 1,
	sl: 1,
	sr: 1,
	sv: 1,
	sw: 1,

	ta: 1,
	tr: 1,
	uk: 1,
	ur: 1,
	vi: 1,
	zh: 1,
};

interface LanguageEntry {
	value: string;
	translation?: string;
}

const fileNames: Record<string, LanguageEntry> = {};

getLanguageFileNames().forEach((fileName) => {
	fileNames[fileName] = {
		value: languages[fileName as keyof typeof languages]?.value || ''
	};
});

function groupLanguagesByFirstLetter(languages: { value: string; text: string }[]): LanguageGroup[] {
	const groups: Record<string, { value: string; text: string }[]> = {
		'A-D': [],
		'E-H': [],
		'I-N': [],
		'O-S': [],
		'T-Z': []
	};

	languages.forEach((lang) => {
		const firstLetter = lang.text.charAt(0).toUpperCase();
		if (firstLetter >= 'A' && firstLetter <= 'D') {
			groups['A-D'].push(lang);
		} else if (firstLetter >= 'E' && firstLetter <= 'H') {
			groups['E-H'].push(lang);
		} else if (firstLetter >= 'I' && firstLetter <= 'N') {
			groups['I-N'].push(lang);
		} else if (firstLetter >= 'O' && firstLetter <= 'S') {
			groups['O-S'].push(lang);
		} else {
			groups['T-Z'].push(lang);
		}
	});

	return Object.entries(groups)
		.map(([key, value]) => ({
			group: key,
			languages: value
		}))
		.filter((group) => group.languages.length > 0);
}

export const getLanguageList = (): LanguageGroup[] => {
	/**
	 * @type {any[]}
	 */
	const response: { value: string; text: string }[] = [];

	for (const [key, englishName] of Object.entries(fileNames)) {
		if (key in displayedLanguages) {
			response.push({
				value: key,
				text: englishName.value
			});
		}
	}

	return groupLanguagesByFirstLetter(response);
};

export const getLanguage = (/** @type {string | number} */ language: string) => {
	const noValueFound = {
		abbreviation: language,
		englishValue: language,
		translatedValue: language
	};
	return fileNames[language]
		? {
			abbreviation: language,
			englishValue: fileNames[language].value,
			translatedValue: fileNames[language].translation || fileNames[language].value
		}
		: noValueFound;
};
