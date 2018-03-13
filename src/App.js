import React, { Component } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';
import { Grid, Row, Col, PageHeader, Form, Table, Checkbox, FormGroup, ControlLabel, FormControl, HelpBlock, Image, Button} from 'react-bootstrap';

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
        {key:'1', val:'DEF', disp: 'WON'},
        {key:'2', val:'LST', disp: 'LOST'},
        {key:'3', val:'DRW', disp: 'DRAW'},
        {key:'4', val:'BYE', disp: 'BYE'},
      ],
      selectRes: 'WON',
      t1PtsValid: false,
      t2PtsValid: false,
      resultFormErrors: {t1Pts: '', t2Pts: ''},
      resultFormValid: false
    }

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
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

    if(name == "selectRes") {
      if(value == "BYE") {
        this.setState({
          byeIsChecked: true
        })
        this.setByeValues();
      } else {
        this.setState({
          byeIsChecked: false
        })
        this.resetByeValues();
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
        console.log(this[fieldName + "Valid"]);
        fieldValidationErrors[fieldName] = this[fieldName + "Valid"] ? '' : ' is invalid';
        break;
      default:
        break;
    }

    this.setState({[fieldName + "Valid"]: this[fieldName + "Valid"],
                  }, this.validateForm);
  }

  validateForm() {
    console.log("t1:" + this.state.t1PtsValid + "--- t2:" + this.state.t2PtsValid)
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

  setByeValues = () => {
    this.setState({
      t1Pts: 0,
      t2Pts: 0,
      selectRes: 'BYE',
      teamGamePlayed: 0,
      resultFormValid: true,
      resultFormErrors: {t1Pts: '', t2Pts: ''},
    })
  }

  resetByeValues = () => {
    this.setState({
      t1Pts: '',
      t2Pts: '',
      selectRes: 'WON',
      resultFormValid: false
    })
  }

  updatePlayedRes = () => {
    this.setState({ teamGamePlayed: 1 })
  }

  updateResultsDB = () => {
    const formData = {
      rt1: this.state.t1Pts,
      res: this.state.selectRes,
      rt2: this.state.t1Pts,
      gmPlayed: this.state.teamGamePlayed,
      roundID: this.state.items.latestRound[0].roundID
    }
  }

  render() {
    const { error, isLoaded, items, t1Pts, t2Pts, byeIsChecked, resultOptions, selectRes, resultFormValid, progByCheck} = this.state;
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
                          <FormControl componentClass="select" value={selectRes} name="selectRes" onChange={this.handleInputChange}>
                            {resultOptions.map(item => (
                              <option key={item.key} value={item.val}>{item.disp}</option>
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
                              id="formControlsTextPoints"
                              type="text"
                            />
                        </td>
                        <td>
                           <FieldGroup
                              id="formControlsTextFTA"
                              type="text"
                            />
                        </td>
                        <td>
                           <FieldGroup
                              id="formControlsTextFTM"
                              type="text"
                            />
                        </td>
                        <td>
                           <FieldGroup
                              id="formControlsText3pt"
                              type="text"
                            />
                        </td>
                        <td>
                           <FieldGroup
                              id="formControlsTextFouls"
                              type="text"
                            />
                        </td>
                        <td>{items.latestRound[0].seasonID}</td>
                        <td>{items.latestRound[0].final}</td>
                        <td>{items.latestRound[0].venue}</td>
                        <td>
                          <span>1</span>
                        </td>
                        <td>
                          <Checkbox id="checkDNP{item.PID}"></Checkbox>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Button type="submit">Submit Player Stats</Button>
              </Form>
              </Col>
            </Row>
        </Grid>
      );
    }
  }
}

export default App;
