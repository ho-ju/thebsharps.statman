import React, { Component } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import { Grid, Row, Col, PageHeader, Form, Table, Checkbox, FormGroup, ControlLabel, FormControl, HelpBlock, Image, Button, Alert} from 'react-bootstrap';

function FieldGroup({ id, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <FormControl {...props} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      isLoaded: false,
      items: [],
      byeIsChecked: false,
      teamGamePlayed: 0,
      t1Pts: '',
      t2Pts: '',
      resultOptions: [
        {key:'1', val:'DEF'},
        {key:'2', val:'LST'},
        {key:'3', val:'DRW'},
        {key:'4', val:'BYE'},
      ],
      selectRes: 'DEF',
      t1PtsValid: false,
      t2PtsValid: false,
      resultFormErrors: {t1Pts: '', t2Pts: ''},
      resultFormValid: false,

      players: [],
      playersFormValid: false
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handlePlayerInputChange = this.handlePlayerInputChange.bind(this);
    this.handleCheckboxDNP = this.handleCheckboxDNP.bind(this);
  }

  componentDidMount() {
    const noOfPlayers = 14;
    let playersState = [];
    for(var i=1; i<=noOfPlayers; i++) {
      playersState.push(
        {["formControlsTextPts" + i]: '', ["formControlsTextFTA" + i]: '', ["formControlsTextFTM" + i]: '', ["formControlsText3pt" + i]: '', ["formControlsTextFls" + i]: '', played: 1, dnp: false}
      );
    }
    console.log(playersState);

    this.setState({
      players: playersState
    })

    fetch('//thebsharps/services/stat-man/')
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            isLoaded: true,
            items: result
          });
      },
      (error) => {
        this.setState({
          isLoaded: true,
          error
        });
      }
    )
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if(name === "selectRes") {
      this.setState({selectRes: value});
      if(value === "BYE") {
        this.setState({
          byeIsChecked: true
        })
        this.setByeValues();
      } else {
        if(this.state.byeIsChecked){
          this.setState({
            byeIsChecked: false
          });
          this.resetByeValues();
        }
      }
    } else {
      this.setState({[name]: value},
      () => { this.validateField(name, value) });
    }
  }

  validateField(fieldName, value) {
    let fieldValidationErrors = this.state.resultFormErrors;
    let t1PtsValid = this.state.t1PtsValid;
    let t2PtsValid = this.state.t2PtsValid;

    switch(fieldName) {
      case 't1Pts':
      case 't2Pts':
        this[fieldName + "Valid"] = (value.length > 0 && !/\D/.test(value)) ? true : false;
        fieldValidationErrors[fieldName] = this[fieldName + "Valid"] ? '' : ' is invalid';
        break;
      default:
        break;
    }

    this.setState({[fieldName + "Valid"]: this[fieldName + "Valid"],
                  }, this.validateForm);
  }

  validateForm() {
    this.setState({resultFormValid: this.state.t1PtsValid && this.state.t2PtsValid});
  }

  errorClass(error) {
    return(error.length === 0 ? '' : 'has-error');
  }


  handleCheckboxBye = () => {
    this.setState({
      byeIsChecked: !this.state.byeIsChecked
    });
    if(this.state.byeIsChecked) {
      this.resetByeValues();
    } else {
      this.setByeValues();
    }
  }

  setByeValues(){
    this.setState({
      t1Pts: 0,
      t2Pts: 0,
      selectRes: 'BYE',
      teamGamePlayed: 0,
      resultFormValid: true,
      resultFormErrors: {t1Pts: '', t2Pts: ''},
    })
  }

  resetByeValues() {
    this.setState({
      t1Pts: '',
      t2Pts: '',
      selectRes: 'DEF',
      resultFormValid: false
    })
  }

  updatePlayedRes = () => {
    this.setState({ teamGamePlayed: 1 });
  }

  updateResultsDB = () => {
    const formData = {
      rt1: this.state.t1Pts,
      res: this.state.selectRes,
      rt2: this.state.t2Pts,
      gmPlayed: this.state.teamGamePlayed,
      roundID: this.state.items.latestRound[0].roundID
    }
    alert(JSON.stringify(formData));
    //debugger;
    fetch('//thebsharps/services/update-results/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    }).then((response) => response.json())
      .then((responseJson) => {
      // Showing response message coming from server updating records.
      alert(responseJson);
    }).catch((error) => {
      alert(JSON.stringify(formData));
      alert(error);
    });
  }

  handlePlayerInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    console.log(name);
    this.setState({[name]: value},
    () => { this.validatePlayerField(name, value) });
  }

  handleCheckboxDNP = (event) =>  {
    console.log(event.target);
    const target = event.target;
    const value = target.checked;
    const name = target.name;
    const pid = target.attributes.getNamedItem('data-pid').value;
    console.log(pid);

    if(value) {
      this.setPlayerDNP(pid);
    } else {
      this.resetPlayerDNP(pid);
    }
  }

  setPlayerDNP(pid) {
    const players = this.state.players;
    players[pid-1]["formControlsTextPts" + pid] = 0;
    players[pid-1]["formControlsTextFTA" + pid] = 0;
    players[pid-1]["formControlsTextFTM" + pid] = 0;
    players[pid-1]["formControlsText3pt" + pid] = 0;
    players[pid-1]["formControlsTextFls" + pid] = 0;
    players[pid-1].played = 0;
    players[pid-1].dnp = true;

    this.forceUpdate();
  }

  resetPlayerDNP(pid) {
    const players = this.state.players;
    players[pid-1]["formControlsTextPts" + pid] = '';
    players[pid-1]["formControlsTextFTA" + pid] = '';
    players[pid-1]["formControlsTextFTM" + pid] = '';
    players[pid-1]["formControlsText3pt" + pid] = '';
    players[pid-1]["formControlsTextFls" + pid] = '';
    players[pid-1].played = 1;
    players[pid-1].dnp = false;

    this.forceUpdate();
  }

  validatePlayerField(fieldName, value) {
    
    this[fieldName + "Valid"] = (value.length > 0 && !/\D/.test(value)) ? true : false;

    console.log(fieldName  + " is valid:" + this[fieldName + "Valid"]);

    // this.setState({[fieldName + "Valid"]: this[fieldName + "Valid"],
    //               }, this.validateForm);
  }

  validateForm() {
    this.setState({resultFormValid: this.state.t1PtsValid && this.state.t2PtsValid});
  }

  render() {
    const { error, isLoaded, items, t1Pts, t2Pts, byeIsChecked, resultOptions, selectRes, resultFormValid, progByCheck, dnpIsChecked, players, playersFormValid} = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <Grid>
          <Row className="show-grid">
            <Col xs={12} md={12}>
              <PageHeader>
                <Image src="//thebsharps/static/img/logo-star.png" />Stat Man<small> The B-Sharps Basketball Club.</small>
              </PageHeader>
              <h2>Player Stats</h2>
              <Form>
                <Table striped bordered condensed hover>
                  <thead>
                    <tr>
                      <th>Round No.</th>
                      <th>Round ID</th>
                      <th>Player ID</th>
                      <th>Player Name</th>
                      <th>Points</th>
                      <th>FTA</th>
                      <th>FTM</th>
                      <th>3PT</th>
                      <th>Fouls</th>
                      <th>Season</th>
                      <th>Final</th>
                      <th>Venue</th>
                      <th>Played</th>
                      <th>DNP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.players.map(item => (
                      <tr key={item.PID}>
                        <td>{items.latestRound[0].roundName} ({items.prevRound[0].Round + 1})</td>
                        <td>{items.latestRound[0].roundID}</td>
                        <td>{item.PID}</td>
                        <td>{item.PName}</td>
                        <td>
                           <FieldGroup
                              name={"formControlsTextPts" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextPts" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                            />
                        </td>
                        <td>
                           <FieldGroup
                              name={"formControlsTextFTA" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextFTA" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                            />
                        </td>
                        <td>
                           <FieldGroup
                              name={"formControlsTextFTM" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextFTM" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                            />
                        </td>
                        <td>
                           <FieldGroup
                              name={"formControlsText3pt" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsText3pt" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                            />
                        </td>
                        <td>
                           <FieldGroup
                              name={"formControlsTextFls" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextFls" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                            />
                        </td>
                        <td>{items.latestRound[0].seasonID}</td>
                        <td>{items.latestRound[0].final}</td>
                        <td>{items.latestRound[0].venue}</td>
                        <td>
                          <span>{players[item.PID -1].played}</span>
                        </td>
                        <td>
                          <Checkbox name={"checkDNP" + item.PID} data-pid={item.PID} onChange={this.handleCheckboxDNP}></Checkbox>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Button type="submit" disabled={!playersFormValid}>Submit Player Stats</Button>
              </Form>
              <h2>Results</h2>
              <Form onSubmit={this.updateResultsDB}>
                <Table striped bordered condensed hover>
                  <thead>
                    <tr>
                      <th>Round No.</th>
                      <th>Round ID</th>
                      <th>Team 1</th>
                      <th>Points</th>
                      <th>Result</th>
                      <th>Points</th>
                      <th>Team 2</th>
                      <th>Played</th>
                      <th>Bye</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{items.latestRound[0].roundName} ({items.prevRound[0].Round + 1})</td>
                      <td>{items.latestRound[0].roundID}</td>
                      <td>{items.latestRound[0].t1}</td>
                      <td className={this.errorClass(this.state.resultFormErrors.t1Pts)}>
                          <FieldGroup
                            name="t1Pts"
                            type="text"
                            value={t1Pts}
                            disabled={byeIsChecked}
                            onChange={this.handleInputChange}
                            onBlur={this.updatePlayedRes}
                          />
                      </td>
                      <td>
                        <FormGroup controlId="formControlsSelectResult">
                          <FormControl componentClass="select" name="selectRes" value={selectRes} onChange={this.handleInputChange}>
                            {resultOptions.map(item => (
                              <option key={item.key} value={item.val}>{item.val}</option>
                            ))}
                          </FormControl>
                        </FormGroup>
                      </td>
                      <td className={this.errorClass(this.state.resultFormErrors.t2Pts)}><FieldGroup
                          name="t2Pts"
                          type="text"
                          value={t2Pts}
                          disabled={byeIsChecked}
                          onChange={this.handleInputChange}
                        /></td>
                      <td>{items.latestRound[0].t2}</td>
                      <td>{this.state.teamGamePlayed}</td>
                      <td><Checkbox id="checkBye" onChange={this.handleCheckboxBye} checked={byeIsChecked}></Checkbox></td>
                    </tr>
                  </tbody>
                </Table>
                <Button type="submit" disabled={!resultFormValid}>Submit Game Score</Button>
              </Form>
              </Col>
            </Row>
        </Grid>
      );
    }
  }
}

export default App;
