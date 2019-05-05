import React, { Component } from 'react';
import './App.css';
import PlayList from './PlayList.js';
import SearchBar from './SearchBar.js';
import SelectBar from './SelectBar.js';

const schedule = require('./schedule.json')
const nba = require('nba-api-client');

class App extends Component {

  constructor(){
    super();

    this.state = {pbp: [], players: [], URL: '', title: '', selectedGame: {}, referees: []}
    this.games = [];
    this.selectedPlayer = '';
    this.allPBP = [];
    this.playerPBP = [];
  }

  getPBP = (gameID) => {
    var options = {formatted: true, parameters: false}

    document.getElementsByTagName('select')[0].selectedIndex = 0;
    this.setState({title: ''})
    this.setState({URL: ''})

    nba.playByPlay({GameID: gameID}, options).then((data) =>{
      console.log(data)
      if(data.AvailableVideo.VIDEO_AVAILABLE_FLAG === 1 || 
       data.AvailableVideo.VIDEO_AVAILABLE_FLAG === 2)
        this.parsePBP(data)
      else this.setState({pbp: []})
    })
  }

  parsePBP = (data) => {
    var plays = [];
    var playersList = [];
    var refereesList = [];

    plays = this.filterPlays(data.PlayByPlay);

    console.log(plays)

    for(var i=0; i<plays.length;i++){
        plays[i].Description = plays[i].HOMEDESCRIPTION ? plays[i].HOMEDESCRIPTION : plays[i].VISITORDESCRIPTION;

        if(plays[i].Description) {
          refereesList.push(plays[i].Description.split(') (')[1].slice(0, -1))

          if(plays[i].PLAYER1_NAME) playersList.push(plays[i].PLAYER1_NAME)
          if(plays[i].PLAYER2_NAME) playersList.push(plays[i].PLAYER2_NAME)
          if(plays[i].PLAYER3_NAME) playersList.push(plays[i].PLAYER3_NAME) 
        }
    }

    playersList = [...new Set(playersList)]
    refereesList = [...new Set(refereesList)]

    document.getElementsByTagName('select')[1].selectedIndex = 0;
    this.selectedPlayer = "";
    this.allPBP = plays;
    this.playerPBP = plays;

    this.setState({referees: refereesList})
    this.setState({pbp: plays})
    this.setState({players: playersList})
  }

  filterPlays = (data) => {
    //6 is fouls

    var key, filteredData = [];
    for(key in data){
      if(!(data[key].EVENTMSGTYPE === 9 || 
       data[key].EVENTMSGTYPE === 8 || 
       data[key].EVENTMSGTYPE === 3 ||
       data[key].EVENTMSGTYPE === 1 ||
       data[key].EVENTMSGTYPE === 2 ||
       data[key].EVENTMSGTYPE === 4 ||
       data[key].EVENTMSGTYPE === 5 ||
       data[key].EVENTMSGTYPE === 7 ||
       data[key].EVENTMSGTYPE === 10 ||
       data[key].EVENTMSGTYPE === 12 ||
       data[key].EVENTMSGTYPE === 11 ||
       data[key].EVENTMSGTYPE === 13 ||
       data[key].EVENTMSGTYPE === 18 ||
       (!data[key].HOMEDESCRIPTION && !data[key].VISITORDESCRIPTION))){
        filteredData.push(data[key])
      }
    }

    return filteredData;
  }

  getVidURL = (eventNum, gameID, size) => {
    nba.getPBPVideoURL({EventNum: eventNum, GameID: gameID, Size: size}).then((url) => {
      console.log(url)
      this.setState({URL: url})
    })
  }

  getSelectedVideoDetails = (eventNum, title) => {
    this.getVidURL(eventNum, this.state.selectedGame.GameID, '1920x1080') //change size if video not loading
    this.setState({title: title})
  }

  getSelectedGame = (game) => {
    this.setState({
      selectedGame: game
    })

    this.getPBP(game.GameID)
  }

  getSelectedPlayer = (player) => {
    document.getElementsByTagName('select')[1].selectedIndex = 0;

    var plays = this.allPBP;
    if(player !== 'all'){
      plays = plays.filter(play => play.PLAYER1_NAME === player || 
       play.PLAYER2_NAME === player || 
       play.PLAYER3_NAME === player) 
    }

    this.selectedPlayer = player;
    this.playerPBP = plays;
    this.setState({pbp: plays});
  }

  getSelectedReferee = (referee) => {

    var plays = this.playerPBP;

    if(referee !== 'all') plays = plays.filter(play => play.Description.includes(referee))

    this.setState({pbp: plays})
  }

  getSchedule = () => {
    for(var i=0; i<schedule.lscd.length;i++){
      for(var j=0; j<schedule.lscd[i].mscd.g.length;j++){
        var game = schedule.lscd[i].mscd.g[j];
        var homeCity = game.h.tc;
        var homeName = game.h.tn;
        var homeAbbr = game.h.ta;
        var homeTeamID = game.h.tid;
        var awayCity = game.v.tc;
        var awayName = game.v.tn;
        var awayAbbr = game.v.ta;
        var awayTeamID = game.v.tid;
        var date = game.gdte;

        this.games.push({GameID: game.gid,
         Arena: game.an,
         GameName: `${awayCity} ${awayName} @ ${homeCity} ${homeName} (${date})`,
         HomeCity: homeCity,
         HomeName: homeName,
         HomeAbbr: homeAbbr,
         HomeTeamID: homeTeamID,
         AwayCity: awayCity,
         AwayName: awayName,
         AwayAbbr: awayAbbr,
         AwayTeamID: awayTeamID,
         Date: date})
      }
    }
  }

  componentDidMount(){
    this.getSchedule();
  }

  render() {
    return (
      <div className="App">
        <div id="vid-wrapper">
          <SearchBar id="game-search" value={this.state.today} gameData={this.games} getSelectedGame={this.getSelectedGame}/>
          <video id="vid" key={this.state.URL} width="768" height="432" controls autoPlay>
            <source src={this.state.URL} type="video/mp4"/>
          </video>
          <div id="description">
            <span>{this.state.title}</span>
          </div>
        </div>
        <div id="plays-wrapper">
          <div id="select-wrapper">
            <SelectBar id="players-select" data={this.state.players} default="All Players" getSelected={this.getSelectedPlayer}/>
            <SelectBar id="referees-select" data={this.state.referees} default="All Referees" getSelected={this.getSelectedReferee}/>
          </div>
          <PlayList plays={this.state.pbp} getSelectedVideoDetails={this.getSelectedVideoDetails}/>
        </div>
      </div>
      );
  }
}

export default App;
