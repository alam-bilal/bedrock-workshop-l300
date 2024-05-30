import './movienight.css';
import { useState, useEffect } from 'react';

interface Movie {
  original_title: string;
  tmdb_id: number;
  genres: string;
  original_language: string;
  description: string;
  keywords: string;
  actors: string;
  director: string;
  year: number;
  popularity_bins: string;
  vote_average: number;
  vote_average_bins: string;
}


const VITE_APP_API_ENDPOINT = import.meta.env.VITE_APP_API_ENDPOINT;
const TMDB_API_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;

const getTMDBImage = async (accessToken: string, id: number): Promise<string> => {
  const url = `https://api.themoviedb.org/3/movie/${id}/images`;
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', Authorization: 'Bearer ' + accessToken }
  };
  const response = await fetch(url, options);
  const json = await response.json();
  const baseUrl = "https://image.tmdb.org/t/p/";
  const filePath = json['posters'][0]['file_path'];
  const final_url = baseUrl + "w1280" + filePath;
  return final_url;
};

interface MovieProps {
  movie: Movie;
}

const Movie: React.FC<MovieProps> = ({ movie }) => {
  const [imgUrl, setImgUrl] = useState('');

  useEffect(() => {
    getTMDBImage(TMDB_API_TOKEN, movie.tmdb_id).then(response => {
      console.log("image url:" + response);
      setImgUrl(response);
    });
  }, [movie]);

  return (
    <div className="movie">
      <div className="movieImage">
        <img src={imgUrl} alt="movie poster" />
      </div>
      <div className="movieMetadata">
        <div className="movieTitle"><b>Title:</b> {movie.original_title}</div>
        <div className="movieTmdb"><b>TMDB ID:</b> {movie.tmdb_id}</div>
        <div className="movieGenre"><b>Genre:</b> {movie.genres}</div>
        <div className="movieLanguage"><b>Original language:</b> {movie.original_language}</div>
        <div className="movieDescription"><b>Description:</b> {movie.description}</div>
        <div className="movieKeywords"><b>Keywords:</b> {movie.keywords}</div>
        <div className="movieActors"><b>Actors:</b> {movie.actors}</div>
        <div className="movieDirector"><b>Director:</b> {movie.director}</div>
        <div className="movieYear"><b>Year:</b> {movie.year}</div>
        <div className="moviePopularity"><b>Popularity:</b> {movie.popularity_bins}</div>
        <div className="movieVotes"><b>Vote score:</b> {movie.vote_average}</div>
        <div className="movieVotesDesc"><b>Vote description:</b> {movie.vote_average_bins}</div>
      </div>
    </div>
  );
};

interface MovieListProps {
  data: Movie[];
}

const MovieList: React.FC<MovieListProps> = (data) => {
  const movies = data.data;
  const isEmpty = movies.length === 0;

  return (
    <>
      <div className="movieList">
        <div className="movies">
          {isEmpty ? (
            <div></div>
          ) : (
            movies.map(movie => (
              <Movie key={movie.original_title} movie={movie} />
            ))
          )}
        </div>
      </div>
    </>
  );
};

const MovieNight: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [moviesData, setMoviesData] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleReset = () => {
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchSubmit();
    }
  };

  /*eslint-disable*/
  function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  const searchSubmit = async () => {
    setSearching(true);

    //var idToken = parseJwt(sessionStorage.idToken.toString());
    var accessToken = sessionStorage.accessToken.toString();
    console.log(accessToken)
    const question = encodeURIComponent(inputValue);
    const url = `${VITE_APP_API_ENDPOINT}?question=${question}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    const rawData = JSON.stringify(data.message);

    if (rawData !== null && rawData === "Service Unavailable") {
      console.log("Service Unavailable");
      setMoviesData([]);
    } else {
      const dataJson = JSON.parse(rawData);
      const dataJsonParsed = JSON.parse(dataJson);
      setMoviesData(dataJsonParsed.Titles);
    }

    setSearching(false);
  };

  return (
    <div className="App">
      <div className="appHeader">MovieNight</div>
      <div className="appSearchHeader">
        <div className="appSearchHeaderInner">
          <div className="searchEltGroup">
            <div className="inputField">
              <input
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="searchButton"><button onClick={searchSubmit}>Search</button></div>
            <div className="emptyButton"><button onClick={handleReset}>Clear</button></div>
          </div>
        </div>
      </div>
      <div className="mainBlock">
        <>
          {searching ? (<div className="searchLoading"><img alt='loading' src='img/loading-7528_256.gif' /></div>) : (<div></div>)}
          {moviesData ? (<MovieList data={moviesData} />) : (<div></div>)}
        </>
      </div>
    </div>
  );
};

export default MovieNight;