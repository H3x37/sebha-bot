import axios from 'axios';
import https from 'https';
import { config } from '../config';

export const adhanApi = axios.create({ baseURL: config.adhanApi });
export const quranApi = axios.create({ baseURL: config.quranApi });
export const hadithApi = axios.create({ baseURL: config.hadithApi });

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function fetchPrayerTimes(city: string, country: string, method = 5) {
  const { data } = await adhanApi.get('/timingsByCity', {
    params: { city, country, method },
  });
  return data.data;
}

export async function fetchQuranVerse(surah: number, ayah: number) {
  const { data } = await quranApi.get(`/ayah/${surah}:${ayah}`);
  return data.data;
}

export async function fetchQuranPage(page: number) {
  const { data } = await quranApi.get(`/page/${page}`);
  return data.data;
}

export async function searchQuran(query: string) {
  const { data } = await quranApi.get('/search/' + encodeURIComponent(query));
  return data.data;
}

export async function fetchHadithRandom() {
  const { data } = await axios.get('https://hadith.gading.dev/books/bukhari/random', { httpsAgent });
  return data.data;
}

export async function fetchHadithByBook(book: string, number: number) {
  const { data } = await axios.get(`https://hadith.gading.dev/books/${book}/${number}`, { httpsAgent });
  return data.data;
}
