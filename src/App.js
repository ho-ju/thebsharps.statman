import React, { Component } from 'react';
import logo from './logo.svg';
import { Grid, Row, Col, PageHeader, Form, Table, Checkbox, FormGroup, FormControl, HelpBlock, Image, Button} from 'react-bootstrap';
import './App.css';

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
        {pid: i, ["formControlsTextPts" + i]: '', ["formControlsTextFTA" + i]: '', ["formControlsTextFTM" + i]: '', ["formControlsText3pt" + i]: '', ["formControlsTextFls" + i]: '', played: 0, dnp: false, ["formControlsTextPts" + i + "InValidClass"]: false, ["formControlsTextFTA" + i + "InValidClass"]: false, ["formControlsTextFTM" + i + "InValidClass"]: false, ["formControlsText3pt" + i + "InValidClass"]: false, ["formControlsTextFls" + i + "InValidClass"]: false}
      );
    }

    this.setState({ players: playersState });

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

  /**
    * Handle Input change for Results form Inpute
    * @method handleInputChange
    * @param {obj} event - event that was triggered
    */
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

  /**
    * Validate fields for Results Form
    * @method validateField
    * @param {string} fieldName - name of field to validate
    * @param {int} value - value input by user
    */
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

  /**
    * Validate Results Form
    * @method validateForm
    */
  validateForm() {
    this.setState({resultFormValid: this.state.t1PtsValid && this.state.t2PtsValid});
  }

  /**
    * Apply error class if field has error
    * @method errorClass
    * @param {obj} error - field to evaluate
    */
  errorClass(error) {
    return(error.length === 0 ? '' : 'has-error');
  }

  /**
    * Event handling for BYE checkbox
    * @method handleCheckboxBye
    */
  handleCheckboxBye = () => {
    this.setState({ byeIsChecked: !this.state.byeIsChecked });
    this.state.byeIsChecked ? this.resetByeValues() : this.setByeValues();
  }

  /**
    * Set BYE values when selected
    * @method setByeValues
    */
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

  /**
    * RESet BYE values when selected
    * @method resetByeValues
    */
  resetByeValues() {
    this.setState({
      t1Pts: '',
      t2Pts: '',
      selectRes: 'DEF',
      resultFormValid: false
    })
  }

  /**
    * Update games played onBlur
    * @method updatePlayedRes
    */
  updatePlayedRes = () => {
    this.setState({ teamGamePlayed: 1 });
  }

  /**
    * Update the DB on submit
    * @method updateResultsDB
    */
  updateResultsDB = () => {
    const formData = {
      rt1: this.state.t1Pts,
      res: this.state.selectRes,
      rt2: this.state.t2Pts,
      gmPlayed: this.state.teamGamePlayed,
      roundID: this.state.items.latestRound[0].roundID
    }

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
      alert(error);
    });
  }

  /**
    * Event Handler for input change on player stats form
    * @method handlePlayerInputChange
    * @param {obj} event - event that was triggered
    */
  handlePlayerInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const players = this.state.players;
    const pid = target.attributes.getNamedItem('data-pid').value -1;

    players[pid][name] = value;
    players[pid].played = 1; // update game played once text is entered in row

    this.setState({
      players,
    }, () => { this.validatePlayerField(name, value, players, pid) });
  }

  /**
    * Event Handler for checking DNP for a given player
    * @method handleCheckboxDNP
    * @param {obj} event - event that was triggered
    */
  handleCheckboxDNP = (event) =>  {
    console.log(event.target);
    const target = event.target;
    const value = target.checked;
    const pid = target.attributes.getNamedItem('data-pid').value;

    value ? this.setPlayerDNP(pid) : this.resetPlayerDNP(pid);
  }

  /**
    * Set DNP value for player when selected
    * @method setPlayerDNP
    */
  setPlayerDNP(pid) {
    const players = this.state.players;
    const myPid = pid -1;

    players[myPid]["formControlsTextPts" + pid] = 0;
    players[myPid]["formControlsTextFTA" + pid] = 0;
    players[myPid]["formControlsTextFTM" + pid] = 0;
    players[myPid]["formControlsText3pt" + pid] = 0;
    players[myPid]["formControlsTextFls" + pid] = 0;
    players[myPid].played = 0;
    players[myPid].dnp = true;
    players[myPid]["formControlsTextPts" + pid + "InValidClass"] = false;
    players[myPid]["formControlsTextFTA" + pid + "InValidClass"] = false;
    players[myPid]["formControlsTextFTM" + pid + "InValidClass"] = false;
    players[myPid]["formControlsText3pt" + pid + "InValidClass"] = false;
    players[myPid]["formControlsTextFls" + pid + "InValidClass"] = false;

    this.forceUpdate();
    this.validatePlayerForm();
  }

  /**
    * RESet DNP value for player when selected
    * @method resetPlayerDNP
    */
  resetPlayerDNP(pid) {
    const players = this.state.players;
    const myPid = pid -1;

    players[myPid]["formControlsTextPts" + pid] = '';
    players[myPid]["formControlsTextFTA" + pid] = '';
    players[myPid]["formControlsTextFTM" + pid] = '';
    players[myPid]["formControlsText3pt" + pid] = '';
    players[myPid]["formControlsTextFls" + pid] = '';
    players[myPid].played = 1;
    players[myPid].dnp = false;
    players[myPid]["formControlsTextPts" + pid + "InValidClass"] = true;
    players[myPid]["formControlsTextFTA" + pid + "InValidClass"] = true;
    players[myPid]["formControlsTextFTM" + pid + "InValidClass"] = true;
    players[myPid]["formControlsText3pt" + pid + "InValidClass"] = true;
    players[myPid]["formControlsTextFls" + pid + "InValidClass"] = true;

    this.forceUpdate();
    this.setState({playersFormValid: false});
  }

  /**
    * Apply error class if field has error
    * @method errorClassPlayers
    * @param {int} value - field to evaluate
    */
  errorClassPlayers(value) {
    return(!value ? '' : 'has-error');
  }

  /**
    * Validate fields for Player Stats Form
    * @method validatePlayerField
    * @param {string} fieldName - name of field to validate
    * @param {int} value - value input by user
    * @param {array} players - collection of players
    * @param {int} pid - player unique ID
    */
  validatePlayerField(fieldName, value, players, pid) {
    const invalid = (value.length > 0 && !/\D/.test(value)) ? false : true;
    players[pid][fieldName + "InValidClass"] = invalid;

    this.setState({
      players,
    }, this.validatePlayerForm);
  }

  /**
    * Validate entire form Player Stats
    * @method validatePlayerForm
    */
  validatePlayerForm() {  
    const noOfPlayers = this.state.items.players;
    const players = this.state.players;
    let currentInvalidTotal = 0;
    let validForm = false;

    // Loop through number of players returned in data, then by PID within that loop
    for(var i=0; i < noOfPlayers.length; i++) {
      for(var key in players[noOfPlayers[i].PID -1]) {
        if (players[noOfPlayers[i].PID -1].hasOwnProperty(key) && key.indexOf('form') !== -1 && key.indexOf('InValidClass') === -1 && players[noOfPlayers[i].PID -1]) {
          if(players[noOfPlayers[i].PID -1][key] === '') {
            // check if empty add to invalid total
            currentInvalidTotal++;
            break
          } else if (/\D/.test(players[noOfPlayers[i].PID -1][key])) {
            // check here for valid num, if not add to invalid total
            currentInvalidTotal++;
            break
          }
        }
      }
    }
    console.log(currentInvalidTotal);
    // When there are no invalid fields, user can submit
    validForm = (currentInvalidTotal === 0) ? true : false;
    this.setState({playersFormValid: validForm});
  }

  insertStatsDB = () => {
    const formData = {
      round: this.state.items.prevRound[0].round + 1,
      roundID: this.state.items.latestRound[0].roundID,
      seasonID: this.state.items.latestRound[0].seasonID,
      final: this.state.items.latestRound[0].final,
      comp: this.state.items.latestRound[0].comp, 
      players: this.state.players
    }

    console.log(JSON.stringify(formData));

    fetch('//thebsharps/services/insert-stats/', {
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
      alert(error);
    });
  }

  render() {
    const { error, isLoaded, items, t1Pts, t2Pts, byeIsChecked, resultOptions, selectRes, resultFormValid, players, playersFormValid} = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <Grid>
          <Row className="show-grid">
            <Col xs={12} md={12}>
              <div className="logo-container">
                  <a href="/" className="logo main">
                  <h4>Basketball club est. 2004</h4>
                  <h3><span className="text">The B</span><span className="icon"></span><span className="text last">Sharps</span></h3>
                </a>
              </div>
              <div className="hr clearfix"></div>
              <div className="crumbs clearfix">
                <ul>
                  <li className="title"><h1>The Team</h1></li>
                </ul>
              </div>
              <h3 className="table-title">Player Stats</h3>
              <Form onSubmit={this.insertStatsDB}>
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
                        <td>{items.latestRound[0].roundName} ({items.prevRound[0].round + 1})</td>
                        <td>{items.latestRound[0].roundID}</td>
                        <td>{item.PID}</td>
                        <td>{item.PName}</td>
                        <td className={this.errorClassPlayers(players[item.PID -1]["formControlsTextPts" + item.PID + "InValidClass"])}>
                           <FieldGroup
                              name={"formControlsTextPts" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextPts" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                              data-pid={item.PID}
                            />
                        </td>
                        <td className={this.errorClassPlayers(players[item.PID -1]["formControlsTextFTA" + item.PID + "InValidClass"])}>
                           <FieldGroup
                              name={"formControlsTextFTA" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextFTA" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                              data-pid={item.PID}
                            />
                        </td>
                        <td className={this.errorClassPlayers(players[item.PID -1]["formControlsTextFTM" + item.PID + "InValidClass"])}>
                           <FieldGroup
                              name={"formControlsTextFTM" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextFTM" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                              data-pid={item.PID}
                            />
                        </td>
                        <td className={this.errorClassPlayers(players[item.PID -1]["formControlsText3pt" + item.PID + "InValidClass"])}>
                           <FieldGroup
                              name={"formControlsText3pt" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsText3pt" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                              data-pid={item.PID}
                            />
                        </td>
                        <td className={this.errorClassPlayers(players[item.PID -1]["formControlsTextFls" + item.PID + "InValidClass"])}>
                           <FieldGroup
                              name={"formControlsTextFls" + item.PID}
                              type="text"
                              value={players[item.PID -1]["formControlsTextFls" + item.PID]}
                              disabled={players[item.PID -1].dnp}
                              onChange={this.handlePlayerInputChange}
                              data-pid={item.PID}
                            />
                        </td>
                        <td>{items.latestRound[0].seasonID}</td>
                        <td>{items.latestRound[0].final}</td>
                        <td>{items.latestRound[0].comp}</td>
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
              <h3 className="table-title">Results</h3>
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
                      <td>{items.latestRound[0].roundName} ({items.prevRound[0].round + 1})</td>
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
