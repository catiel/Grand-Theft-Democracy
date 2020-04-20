/*MIT License

Copyright (c) 2019 Caleb Logan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React,{Component} from 'react';
import Sound from 'react-sound';
import './App.css';
import MapApp from './Components/Map/MapApp.js';
import MapRegion from './Components/Map/MapRegion.js';
import EmailApp from './Components/Email/EmailApp.js';
import CalendarApp from './Components/Calendar/CalendarApp.js';
import EchoApp from './Components/Echo/EchoApp.js'
import events from './Components/Calendar/EventList.json';
import emails from './Components/Email/EmailList.json';
import echos from './Components/Echo/echo.json';
import {Button} from 'react-bootstrap';
import EventPopup from './Components/Calendar/EventPopup.js';
import Event from ".//Components/Calendar/Event.js";
import TimelineApp from './Components/Timeline/TimelineApp.js'
import './MainPage.css';
import desktop from './Resources/Title_Computer.png';
import Situations from './Components/Calendar/Situations.json';
import mainMusicMP3 from './Resources/Music/ThemeLoopable.mp3';
import mainMusicWAV from './Resources/Music/ThemeLoopable.wav';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import { add, isBefore, isAfter, addDays } from 'date-fns';

/**
 * MainPage component of the app that renders and returns all the buttons
 * and allows you to switch between each page using reactRouter.
 * @extends React
 */
class MainPage extends Component{

	constructor(props) {
		super(props);

		this.state = {
			//Only stores red data to reduce unneccesary data storage
			pollData: {
				0: [75, 75, 75, 75, 75, 75, 75],
				1: [25, 25, 25, 25],
				2: [62, 33, 51, 83],
				3: [75, 50, 57],
				4: [38, 51],
				5: [18],
				6: [70, 25, 89, 34],
				7: [21, 12, 37]
			},
      //regionDistrictNames stores all of the names of the regions and districts to be displayed on the map the first name in the array is the region, all subsequent are districts
  		regionDistrictNames: {
  				0: ["Saika","Rakka","Feidler","Larch","Broon","Lona La","Oglad","Prock"],
  				1: ["Kaika","Ash","Holly","Kefler","Darby"],
  				2: ["Flaze","Gretroit","Hearth","Magdo","Garde"],
  				3: ["Libdove","Moka","Agon","Veera"],
  				4: ["Osco","Proe","Haley"],
  				5: ["Warren Central", "Warren Central"],
  				6: ["Dukaste","Locke","Rehlat","Selia","Dukaste City"],
  				7: ["Wegruesoe","Zaftan","Blektan","Wegruesoe City"]
  		},
      //eventsCompleted is an array to hold all of the events that have been finished by the player after they complete them.
			eventsCompleted: [],
      //events is an object that holds all of the events on the calendar
      events: Object.values(events).map((event) => {
        let date = new Date(event.year, event.month, event.day);
        return(
          {date: date, message: <Event key={event.id} message={event.message} date={date} id={event.id} status={event.status}/>, status: event.status}
        );
      }),
      //turnStartDate is the beginning Date for the game February 1, 2020
			turnStartDate: new Date(2020, 2, 1, 0, 0, 0, 0)
		}

		this.callback = this.callback.bind(this);
	}

	/**
	 * Allows an external component to add entries to eventsCompleted and update the pollData
	 * @param  {eventid}   eventsCompleted The id of the event completed.
	 * @param  {percent}   eventsCompleted The percentage amount of change for the region's district
	 * @param  {region}	   eventsCompleted The id of the region to update
	 * @param  {district}  eventsCompleted The id of the district to update
	 * @param  {eventState}  eventsCompleted What the status of the event is.
	 */
	callback = (eventid, percent, region, district, eventState) => {
		var eventCompleted = {
			eventID: eventid,
			percent: percent,
			region: region,
			district: district,
      state: eventState
		}

    let temporaryEvents = this.state.events;

    var found = temporaryEvents.find(element => element.id == eventCompleted.id);
    if(found != null){
        temporaryEvents[eventid].status = eventCompleted.state;
        this.setState({events: temporaryEvents});
    }

		let updatedData = this.state.pollData;
		updatedData[region][district] += (updatedData[region][district] * percent)

		//Get the event IDs between the two dates that need to be completed before the round can advance
		let eventsToComplete = this.getEventIDsBetween(this.state.turnStartDate, add(this.state.turnStartDate, {days: 13}));
  /*  for(var i = 0; i < eventsToComplete.length; i++){
      temporaryEvents[eventsToComplete[i]].status = 0;
    }
    */
		//Remove the newly completed event ID if it is in the array
		if(eventsToComplete.includes(eventid)) {
			eventsToComplete.splice(eventsToComplete.indexOf(eventid), 1);
		}

    this.setState({events: temporaryEvents});
    console.log(events[0].status);
		//Remove all completed event IDs from the array
		this.state.eventsCompleted.map((completedEvent) => {
			if(eventsToComplete.includes(completedEvent.eventID)) {
				eventsToComplete.splice(eventsToComplete.indexOf(completedEvent.eventID), 1);
			}
		});

    while(eventsToComplete.length == 0){
      //If all events are complete advance the
        this.setState({turnStartDate: add(this.state.turnStartDate, {weeks: 2})});
        eventsToComplete = this.getEventIDsBetween(this.state.turnStartDate, add(this.state.turnStartDate, {days: 13}));
    }

		this.setState({pollData: updatedData});
		this.setState({eventsCompleted: [...this.state.eventsCompleted, eventCompleted]});
  };

	//Returns all of the event IDs between 2 dates
	getEventIDsBetween = (turnStartDate, turnEndDate) => {
		let eventsBetween = [];

		Object.values(events).map((event) => {
			let eventDate = new Date(event.year, event.month, event.day, 0, 0, 0, 0);
			if(!(isBefore(eventDate, turnStartDate) || isAfter(eventDate, turnEndDate))) {
        event.status = 0;
        eventsBetween.push(event.id);
			}
		});
		return eventsBetween;
	}

	render(){
		return(
      <Router>
        <div id="screen">

        <audio controls autoplay loop id="main-music">
          <source src="mainMusicMP3" type="audio/mpeg"></source>
          <source src="mainMusicWAV" type="audio/wav"></source>
          Your Browser does not support the audio element.
        </audio>

        <img className="desktop" src={desktop} alt="desktop"/>
          <nav>
						<Link to='/Calendar'> {/*Button to Calendar*/}
							<Button className="button calendar-button">
								<span>Calendar</span>
							</Button>
						</Link>
						&nbsp;
						&nbsp; {/*This adds spaces between the buttons*/}
						&nbsp;

						<Link to='/Email'>
							<Button> {/*Button to Email*/}
								<span>Email</span>
							</Button>
						</Link>

						&nbsp;
						&nbsp; {/*This adds spaces between the buttons*/}
						&nbsp;
						<Link to='/Map'>
							<Button> {/*Button to Map*/}
								<span>Map</span>
							</Button>
						</Link>

						&nbsp;
						&nbsp; {/*This adds spaces between the buttons*/}
						&nbsp;
						<Link to= '/Echo'>
							<Button>
								<span>Echo</span>
							</Button>
						</Link>

						&nbsp;
						&nbsp; {/*This adds spaces between the buttons*/}
						&nbsp;
						<Link to= '/Timeline'>
							<Button>
								<span>Timeline</span>
							</Button>
						</Link>
					</nav>

					<Switch>{/*The switch to click between pages.*/}
						<Route path='/Calendar'>
							<CalendarApp   events={this.state.events} eventsCompleted={this.state.eventsCompleted} turnStartDate={this.state.turnStartDate}/>
							<Route path='/Calendar/:id' render={(props)=>{
								return <EventPopup callbackFromMain={this.callback} event={events[props.match.params.id]} situation = {Situations[Math.floor(Math.random()* 10)]}/>
							 }
							}/>
						</Route>
						<Route path='/Email'>
							<EmailApp emails={emails}/>
						</Route>
						<Route path='/Map'>
							<MapApp pollData={this.state.pollData} regionDistrictNames={this.state.regionDistrictNames}/>
							<Route path='/Map/:id' render={(props)=>{
									return <MapRegion region={props.match.params.id} pollData={this.state.pollData} regionDistrictNames={this.state.regionDistrictNames}/>
								}
							}/>
						</Route>
						<Route path='/Echo'>
							<EchoApp echos={echos}/>
						</Route>
						<Route path='/Timeline'>
							<TimelineApp  events={Object.values(events)} eventsCompleted={this.state.eventsCompleted}/>
						</Route>
					</Switch>
				</div>
			</Router>
		);
	}

}

export default MainPage
