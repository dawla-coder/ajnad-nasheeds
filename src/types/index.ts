export type Nasheed = {
  id: string
  title: string
  artist: string
  duration: number | null
  file_url: string
  cover_url?: string | null
  created_at?: string
}

export type Playlist = {
  id: string
  name: string
  description?: string | null
  created_at?: string
}

export type Favorite = {
  id: string
  user_id: string
  nasheed_id: string
  created_at?: string
}
