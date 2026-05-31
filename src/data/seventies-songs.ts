// Curated list of popular 70's songs for the RSVP form
// Data structure: { title, artist, year, musicbrainz_id? }
export interface Song {
  title: string;
  artist: string;
  year: number;
  musicbrainz_id?: string;
}

export const SEVENTIES_SONGS: Song[] = [
  // 1970
  { title: "Bridge Over Troubled Water", artist: "Simon & Garfunkel", year: 1970 },
  { title: "Let It Be", artist: "The Beatles", year: 1970 },
  { title: "ABC", artist: "The Jackson 5", year: 1970 },
  { title: "I Want You Back", artist: "The Jackson 5", year: 1970 },
  { title: "American Pie", artist: "Don McLean", year: 1971 },

  // 1971
  { title: "Maggie May", artist: "Rod Stewart", year: 1971 },
  { title: "Joy to the World", artist: "Three Dog Night", year: 1971 },
  { title: "It's Too Late", artist: "Carole King", year: 1971 },
  { title: "Go Away Little Girl", artist: "Donny Osmond", year: 1971 },

  // 1972
  { title: "The First Time Ever I Saw Your Face", artist: "Roberta Flack", year: 1972 },
  { title: "Alone Again (Naturally)", artist: "Gilbert O'Sullivan", year: 1972 },
  { title: "I Can See Clearly Now", artist: "Johnny Nash", year: 1972 },
  { title: "Long Cool Woman", artist: "The Hollies", year: 1972 },

  // 1973
  { title: "Tie a Yellow Ribbon Round the Ole Oak Tree", artist: "Tony Orlando & Dawn", year: 1973 },
  { title: "Killing Me Softly With His Song", artist: "Roberta Flack", year: 1973 },
  { title: "Crocodile Rock", artist: "Elton John", year: 1973 },
  { title: "Bad, Bad Leroy Brown", artist: "Jim Croce", year: 1973 },
  { title: "Superstition", artist: "Stevie Wonder", year: 1973 },

  // 1974
  { title: "The Way You Make Me Feel", artist: "Barbra Streisand", year: 1974 },
  { title: "Seasons in the Sun", artist: "Terry Jacks", year: 1974 },
  { title: "Rock the Boat", artist: "The Hues Corporation", year: 1974 },
  { title: "Annie's Song", artist: "John Denver", year: 1974 },
  { title: "Kung Fu Fighting", artist: "Carl Douglas", year: 1974 },

  // 1975
  { title: "Love Will Keep Us Together", artist: "Captain & Tennille", year: 1975 },
  { title: "Rhinestone Cowboy", artist: "Glen Campbell", year: 1975 },
  { title: "Philadelphia Freedom", artist: "Elton John", year: 1975 },
  { title: "My Eyes Adored You", artist: "Frankie Valli", year: 1975 },
  { title: "Lady Marmalade", artist: "Labelle", year: 1975 },

  // 1976
  { title: "Silly Love Songs", artist: "Wings", year: 1976 },
  { title: "Don't Go Breaking My Heart", artist: "Elton John & Kiki Dee", year: 1976 },
  { title: "December, 1963 (Oh, What a Night)", artist: "The Four Seasons", year: 1976 },
  { title: "50 Ways to Leave Your Lover", artist: "Paul Simon", year: 1976 },
  { title: "Dancing Queen", artist: "ABBA", year: 1976 },

  // 1977
  { title: "Tonight's the Night", artist: "Rod Stewart", year: 1977 },
  { title: "I Just Want to Be Your Everything", artist: "Andy Gibb", year: 1977 },
  { title: "Best of My Love", artist: "The Emotions", year: 1977 },
  { title: "Angel in Your Arms", artist: "Hot", year: 1977 },
  { title: "Stayin' Alive", artist: "Bee Gees", year: 1977 },
  { title: "How Deep Is Your Love", artist: "Bee Gees", year: 1977 },
  { title: "More Than a Woman", artist: "Bee Gees", year: 1977 },

  // 1978
  { title: "Shadow Dancing", artist: "Andy Gibb", year: 1978 },
  { title: "Boogie Oogie Oogie", artist: "A Taste of Honey", year: 1978 },
  { title: "Miss You", artist: "The Rolling Stones", year: 1978 },
  { title: "Three Times a Lady", artist: "Commodores", year: 1978 },
  { title: "Copacabana", artist: "Barry Manilow", year: 1978 },
  { title: "Le Freak", artist: "Chic", year: 1978 },

  // 1979
  { title: "My Sharona", artist: "The Knack", year: 1979 },
  { title: "Bad Girls", artist: "Donna Summer", year: 1979 },
  { title: "Ring My Bell", artist: "Anita Ward", year: 1979 },
  { title: "Sad Eyes", artist: "Robert John", year: 1979 },
  { title: "Hot Stuff", artist: "Donna Summer", year: 1979 },
  { title: "I Will Survive", artist: "Gloria Gaynor", year: 1979 },
  { title: "Y.M.C.A.", artist: "Village People", year: 1979 },
  { title: "Macho Man", artist: "Village People", year: 1979 },

  // Additional disco hits
  { title: "That's the Way (I Like It)", artist: "KC and the Sunshine Band", year: 1975 },
  { title: "(Shake, Shake, Shake) Shake Your Booty", artist: "KC and the Sunshine Band", year: 1976 },
  { title: "Get Down Tonight", artist: "KC and the Sunshine Band", year: 1975 },
  { title: "Play That Funky Music", artist: "Wild Cherry", year: 1976 },
  { title: "Car Wash", artist: "Rose Royce", year: 1976 },
  { title: "Brick House", artist: "Commodores", year: 1977 },
  { title: "Boogie Wonderland", artist: "Earth, Wind & Fire", year: 1979 },
  { title: "September", artist: "Earth, Wind & Fire", year: 1978 },
  { title: "Shining Star", artist: "Earth, Wind & Fire", year: 1975 },

  // Rock classics
  { title: "Free Bird", artist: "Lynyrd Skynyrd", year: 1974 },
  { title: "Stairway to Heaven", artist: "Led Zeppelin", year: 1971 },
  { title: "Black Dog", artist: "Led Zeppelin", year: 1971 },
  { title: "Whole Lotta Love", artist: "Led Zeppelin", year: 1970 },
  { title: "Smoke on the Water", artist: "Deep Purple", year: 1973 },
  { title: "We Will Rock You", artist: "Queen", year: 1977 },
  { title: "We Are the Champions", artist: "Queen", year: 1977 },
  { title: "Bohemian Rhapsody", artist: "Queen", year: 1975 },
  { title: "Another Brick in the Wall", artist: "Pink Floyd", year: 1979 },
  { title: "Hotel California", artist: "Eagles", year: 1976 },
  { title: "Take It Easy", artist: "Eagles", year: 1972 },

  // Soul and R&B
  { title: "What's Going On", artist: "Marvin Gaye", year: 1971 },
  { title: "Let's Stay Together", artist: "Al Green", year: 1971 },
  { title: "Love Train", artist: "The O'Jays", year: 1973 },
  { title: "For the Love of Money", artist: "The O'Jays", year: 1974 },
  { title: "Papa Was a Rollin' Stone", artist: "The Temptations", year: 1972 },
  { title: "Family Affair", artist: "Sly & The Family Stone", year: 1971 },

  // Motown and Pop
  { title: "Dancing in the Street", artist: "Martha and the Vandellas", year: 1970 },
  { title: "I'll Be There", artist: "The Jackson 5", year: 1970 },
  { title: "Never Can Say Goodbye", artist: "The Jackson 5", year: 1971 },
  { title: "Rock with You", artist: "Michael Jackson", year: 1979 },
  { title: "Don't Stop 'Til You Get Enough", artist: "Michael Jackson", year: 1979 },

  // Folk and Country-Pop
  { title: "Fire and Rain", artist: "James Taylor", year: 1970 },
  { title: "Sweet Caroline", artist: "Neil Diamond", year: 1970 },
  { title: "Cracklin' Rosie", artist: "Neil Diamond", year: 1970 },
  { title: "Take Me Home, Country Roads", artist: "John Denver", year: 1971 },
  { title: "Rocky Mountain High", artist: "John Denver", year: 1972 },

  // International hits
  { title: "Fernando", artist: "ABBA", year: 1976 },
  { title: "Knowing Me, Knowing You", artist: "ABBA", year: 1977 },
  { title: "Take a Chance on Me", artist: "ABBA", year: 1978 },
  { title: "Mamma Mia", artist: "ABBA", year: 1975 },
  { title: "SOS", artist: "ABBA", year: 1975 },
].sort((a, b) => {
  if (a.year !== b.year) return a.year - b.year;
  if (a.artist !== b.artist) return a.artist.localeCompare(b.artist);
  return a.title.localeCompare(b.title);
});

// Helper function to format song for display
export function formatSongDisplay(song: Song): string {
  return `${song.title} - ${song.artist} (${song.year})`;
}

// Helper function to find song by title and artist
export function findSong(title: string, artist: string): Song | undefined {
  return SEVENTIES_SONGS.find(song =>
    song.title.toLowerCase() === title.toLowerCase() &&
    song.artist.toLowerCase() === artist.toLowerCase()
  );
}