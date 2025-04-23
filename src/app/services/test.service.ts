import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay, catchError, tap } from 'rxjs/operators';

export interface Song {
  readonly head: string;
  readonly info: string;
  readonly song: string;
  readonly audio?: string;
  readonly audioType?: string;
  readonly image?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private readonly baseUrl =
    'https://raw.githubusercontent.com/sshankara/testData/refs/heads/main';
  private readonly urlMap = {
    batch1: `${this.baseUrl}/apr12songs`,
    batch2: `${this.baseUrl}/a12seniorSongs`,
    batch3: `${this.baseUrl}/a19newsongs`,
    batch4: `${this.baseUrl}/collection1`,
    batch5: `${this.baseUrl}/apr20thweek`,
  } as const;

  private readonly cache = new Map<string, Observable<readonly Song[]>>();

  constructor(private readonly http: HttpClient) {}

  getData(batch: keyof typeof this.urlMap): Observable<readonly Song[]> {
    const cached = this.cache.get(batch);
    if (cached) return cached;

    const request = this.http.get<Song[]>(this.urlMap[batch]).pipe(
      tap(data => console.log(`Received data for ${batch}:`, data)),
      map(this.sortSongs),
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError((error) => {
        console.error(`Error fetching ${batch} from ${this.urlMap[batch]}:`, error);
        this.cache.delete(batch);
        throw error;
      })
    );

    this.cache.set(batch, request);
    return request;
  }

  private sortSongs(songs: readonly Song[]): readonly Song[] {
    return [...songs].sort((a, b) => {
      const numA = parseInt(a.head.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.head.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
  }
}