// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app.component';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));
import {
  Component,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TestService, Song } from './app/services/test.service';

type BatchType = 'batch1' | 'batch2' | 'batch3' | 'batch4' | 'batch5';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="container">
      <h1>திருப்புகழ் Songs</h1>      
      <div class="batch-selector">
        @for (batch of batches; track batch.id) {
          <button 
            class="batch-button" 
            [class.active]="selectedBatch() === batch.id"
            (click)="selectBatch(batch.id)"
          >
            {{ batch.label }}
          </button>
        }
      </div>

      <div class="button-container">
        @for (song of songs(); track song.head) {
          <button 
            (click)="selectSong(song)"
            class="song-button"
            [class.active]="selectedSong()?.head === song.head"
            [attr.aria-label]="'Select song ' + song.head"
          >
            {{ song.head }}
          </button>
        }
      </div> 

      @defer {
        <div class="song-details-wrapper">
          @if (selectedSong(); as song) {
            <div class="song-details">
              <h2>{{ song.head }}</h2>
              <p class="info">{{ song.info }}</p>
              @if(song.image){
              <div class="picture-container">             
                <img src={{song.image}}    alt="Umber Tharu"   class="display-picture">
                </div>
              }
              @if(song.audio){         
              <audio controls [src]="song.audio"></audio>
              }
              <pre class="lyrics">{{ song.song }}</pre>
            </div>
          } @else {
            <div class="song-details">
              <p class="info">Please select a song to view details</p>
            </div>
          }
        </div>
      } @loading (minimum 500ms) {
        <div class="song-details-wrapper">
          <div class="song-details">
            <p class="info">Loading song details...</p>
          </div>
        </div>
      }

      <div class="stats">
        <p>Current Batch Songs count: {{ totalSongs() }}</p>
      </div>
    </div>
  `,
})
export class App implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly songs = signal<Song[]>([]);
  protected readonly selectedSong = signal<Song | null>(null);
  protected readonly selectedBatch = signal<BatchType>('batch3');
  protected readonly totalSongs = computed(() => this.songs().length);
  protected readonly showPicture = signal<boolean>(false);

  protected readonly batches = [
    { id: 'batch1' as const, label: 'I Batch' },
    { id: 'batch2' as const, label: 'II Batch' },
    { id: 'batch3' as const, label: 'Apr19th' },
    { id: 'batch4' as const, label: 'Apr11th' },
    { id: 'batch5' as const, label: 'apr20th' },
  ] as const;

  constructor(private readonly testService: TestService) {}

  ngOnInit() {
    this.loadSongs();
  }

  protected selectBatch(batch: BatchType) {
    if (this.selectedBatch() === batch) return;

    this.selectedBatch.set(batch);
    this.selectedSong.set(null);
    this.showPicture.set(false);
    this.loadSongs();
  }

  private loadSongs() {
    this.testService
      .getData(this.selectedBatch())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const mutableSongs = data.slice();
          this.songs.set(mutableSongs);
        },
        error: (error) => console.error('Error loading songs:', error),
      });
  }

  protected selectSong(song: Song) {
    if (this.selectedSong()?.head === song.head) return;
    if (!song.head.includes('1.உம்பர்தருத் தேநுமணிக்')) {
      this.showPicture.set(false);
    }
    this.selectedSong.set(song);
  }

  protected togglePicture() {
    this.showPicture.update((value) => !value);
  }
}

bootstrapApplication(App, {
  providers: [provideHttpClient(withFetch())],
}).catch((err) => console.error(err));
