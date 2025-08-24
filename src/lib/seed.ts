import type { Nasheed } from '@/types'

export const seedNasheeds: Nasheed[] = [
  {
    id: 'seed-1',
    title: 'Nasheed Sample 1',
    artist: 'Sample Artist',
    duration: 240,
    file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    title: 'Nasheed Sample 2',
    artist: 'Sample Artist',
    duration: 210,
    file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover_url: null,
    created_at: new Date().toISOString(),
  },
]
