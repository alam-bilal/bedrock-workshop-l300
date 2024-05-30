import './App.css';
import { Auth } from 'aws-amplify';
import { useState, useEffect } from 'react';

import AWS from 'aws-sdk';

//get tmdb image
const getTMDBImage = async (accessToken, id)=> {
  const url = "https://api.themoviedb.org/3/movie/" + id + "/images";
  const options = {
    method: 'GET',
    headers: {accept: 'application/json', Authorization: 'Bearer ' + accessToken}
  };

  const response = await fetch(url, options)
  const json = await response.json();
  const VITE_APP_API_ENDPOINT = import.meta.env.VITE_APP_API_ENDPOINT;
  const baseUrl = "https://image.tmdb.org/t/p/"  
  var filePath = json['posters'][0]['file_path']
  var final_url = baseUrl + "w1280" + filePath

  return final_url
}

const Movie = ({ movie }) => {
  const [imgUrl, setImgUrl] = useState([]);

  useEffect(() => {
      getTMDBImage(TMDB_API_TOKEN, movie.tmdb_id).then(response => {
      console.log("image url:" + response)
      setImgUrl(response)
    })
  }, [movie])

  return (
    <div className="movie">
      <div className="movieImage">
        <img src={imgUrl} alt="movie poster"/>
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

const MovieList = (data) => {
  let movies = data.data
  var isEmpty = true
  //update isEmpty if moviesData is not empty
  if (movies.length > 0) {
    isEmpty = false
  }
  return (
    <>
      <div className="movieList">
        <div className="movies">
          { isEmpty ? (
            <div></div>
          ) : (
            movies.map(movie => (
              <Movie key={movie.Title} movie={movie} />  
            ))
          )
          }
        </div>
      </div>
    </>
  );
}

function App() {

  //handles input value change
  const [inputValue, setInputValue] = useState([]);
  const handleChange = (e) => {
    setInputValue(e.target.value);
  }

  //handles clear button down
  const handleReset = () => {
    setInputValue('');
  }

  //Handles Enter key down event
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchSubmit()
    }
  }

  //handle search call
  const [moviesData, setMoviesData] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchSubmit = async () => {
    setSearching(true);
    //Call Semantic Search API
    const user = await Auth.currentAuthenticatedUser();
    if (user) 
      jwtToken = (await Auth.currentSession()).getIdToken().getJwtToken();
    var question = encodeURIComponent(inputValue)
    var url = VITE_APP_API_ENDPOINT + "?question=" + question

    const response = await fetch(url, {
                                        headers: {
                                          Authorization: `Bearer ${jwtToken}`
                                        }
                                      })
    const data = await response.json();
    var rawData = JSON.stringify(data.message)
    if (rawData != null && rawData == "Service Unavailable") {
      console.log("Service Unavailable")
      setMoviesData([]);
    } else {
      var dataJson = JSON.parse(rawData)
      var dataJsonParsed = JSON.parse(dataJson)
      setMoviesData(dataJsonParsed.Titles);
    }
    setSearching(false);
  }

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
        {searching ? (<div className="searchLoading"><img alt='loading' src='img/loading-7528_256.gif'/></div>) : (<div></div>) }
        {moviesData ? (<MovieList data={moviesData}/>) : (<div></div>) }
        
        </>
      </div>
    </div>
  );
}

export default App;
