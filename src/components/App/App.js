// TODO: Create wrapper component ConstrainedMetadataSelector: encapsulates
//  getOptionIsDisabled matching constraint to contexts; use it in
//  SpicyXXX
// TODO: Replace ModelSelector with SpicyModelSelector; allow constraints
// TODO: Replace NavigationSelector with SpicyModelSelector
// TODO: Create EmissionsScenarioSelector; allow constraints

import React, { Component } from 'react';
import { Grid, Row, Col, Button, Glyphicon } from 'react-bootstrap';
import memoize from 'memoize-one';
import { flow, takeWhile, map, reduce, assign, slice, concat, tap } from 'lodash/fp';
import _ from 'lodash';

import meta from '../../assets/meta'
import './App.css';
import VariableSelector from '../VariableSelector';
import ModelSelector from '../ModelSelector';
import EmissionsScenarioSelector from '../EmissionsScenarioSelector';


function stringify(obj) {
  return <pre>{JSON.stringify(obj, null, 2)}</pre>;
}


class App extends Component {
  state = {
    MEV: {
      model: 'MRI-CGCM3',
      emissions: null,
      variable: null,
    },
    VEM: {
      model: null,
      emissions: null,
      variable: {
        variable_id: "pr",
        variable_name: "Precipitation",
        multi_year_mean: true,
      },
    },
    any: {
      model: {
        model_id: 'CanESM2',
      },
      emissions: {
        experiment: 'historical, rcp45',
      },
      variable: {
        variable_id: "pr",
        variable_name: "Precipitation",
        multi_year_mean: true,
      },
    },
    selectorOrder: 'model emissions variable'.split(' '),
  };

  handleChangeSelection = (collection, item, value) =>
    this.setState(prevState => ({
      [collection]: { ...prevState[collection], [item]: value }
    }));

  MEVhandleChangeModel = this.handleChangeSelection.bind(this, 'MEV', 'model');
  MEVhandleChangeEmissions = this.handleChangeSelection.bind(this, 'MEV', 'emissions');
  MEVhandleChangeVariable = this.handleChangeSelection.bind(this, 'MEV', 'variable');

  MEVemissionsSelectorConstraint = memoize(({ model: model_id }) => ({ model_id }));
  MEVvariableSelectorConstraint = memoize(
    ({ model: model_id, emissions: experiment }) => ({ model_id, experiment })
  );

  VEMhandleChangeModel = this.handleChangeSelection.bind(this, 'VEM', 'model');
  VEMhandleChangeEmissions = this.handleChangeSelection.bind(this, 'VEM', 'emissions');
  VEMhandleChangeVariable = this.handleChangeSelection.bind(this, 'VEM', 'variable');

  VEMemissionsSelectorConstraint = memoize(({ variable }) => variable);
  VEMmodelSelectorConstraint = memoize(
    ({ variable, emissions: experiment }) => ({ ...variable, experiment })
  );

  anyHandleChangeModel = (value) =>
    this.setState(prevState => ({
      any: { ...prevState.any, model: { model_id: value } }
    }));
  anyHandleChangeEmissions = (value) =>
    this.setState(prevState => ({
      any: { ...prevState.any, emissions: { experiment: value } }
    }));
  anyHandleChangeVariable = (value) =>
    this.setState(prevState => ({
      any: { ...prevState.any, variable: value }
    }));

  extend = reduce((result, value) => assign(result, value), {});

  anySelectorConstraint =
    (thisSelector, selectorOrder, state) => flow(
      tap(selectorOrder => console.log('anySelectorConstraint: selectorOrder', selectorOrder, thisSelector)),
      takeWhile(selector => selector !== thisSelector),
      tap(selectors => console.log('anySelectorConstraint: selectors', selectors)),
      map(selector => state[selector]),
      tap(states => console.log('anySelectorConstraint: states', states)),
      this.extend,
      tap(constraint => console.log('anySelectorConstraint: constraint', constraint)),
    )(selectorOrder)
  ;

  anySelector = sel => {
    switch (sel) {
      case 'model': return (
        <Col lg={3}>
          <ModelSelector
            meta={meta}
            constraint={this.anySelectorConstraint('model', this.state.selectorOrder, this.state.any)}
            value={this.state.any.model.model_id}
            onChange={this.anyHandleChangeModel}
          />
        </Col>
      );
      case 'emissions': return (
        <Col lg={3}>
          <EmissionsScenarioSelector
            meta={meta}
            constraint={this.anySelectorConstraint('emissions', this.state.selectorOrder, this.state.any)}
            value={this.state.any.emissions.experiment}
            onChange={this.anyHandleChangeEmissions}
          />
        </Col>
      );
      case 'variable': return (
        <Col lg={3}>
          <VariableSelector
            meta={meta}
            constraint={this.anySelectorConstraint('variable', this.state.selectorOrder, this.state.any)}
            value={this.state.any.variable}
            onChange={this.anyHandleChangeVariable}
          />
        </Col>
      );
      default: return 'Idiot';
    }
  };

  moveSelectorOrderDown = index => this.setState(prevState => {
    const prevOrder = prevState.selectorOrder;
    return {
      selectorOrder: _.concat(
        slice(0, index, prevOrder),
        prevOrder[index+1],
        prevOrder[index],
        slice(index+2, undefined, prevOrder),
      )};
  });

  render() {
    console.log('App.render')
    return (
      <Grid fluid>
        <Row>
          <Col lg={3}>
            Model -> Emissions -> Variable
          </Col>
          <Col lg={3}>
            <ModelSelector
              meta={meta}
              value={this.state.MEV.model}
              onChange={this.MEVhandleChangeModel}
            />
          </Col>
          <Col lg={3}>
            <EmissionsScenarioSelector
              meta={meta}
              constraint={this.MEVemissionsSelectorConstraint(this.state.MEV)}
              value={this.state.MEV.emissions}
              onChange={this.MEVhandleChangeEmissions}
            />
          </Col>
          <Col lg={3}>
            <VariableSelector
              meta={meta}
              constraint={this.MEVvariableSelectorConstraint(this.state.MEV)}
              value={this.state.MEV.variable}
              onChange={this.MEVhandleChangeVariable}
            />
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
          </Col>
          <Col lg={3}>
            {stringify(this.state.MEV.model)}
          </Col>
          <Col lg={3}>
            {stringify(this.state.MEV.emissions)}
          </Col>
          <Col lg={3}>
            {stringify(this.state.MEV.variable)}
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
            Variable -> Emissions -> Model
          </Col>
          <Col lg={3}>
            <VariableSelector
              meta={meta}
              value={this.state.VEM.variable}
              onChange={this.VEMhandleChangeVariable}
            />
          </Col>
          <Col lg={3}>
            <EmissionsScenarioSelector
              meta={meta}
              constraint={this.VEMemissionsSelectorConstraint(this.state.VEM)}
              value={this.state.VEM.emissions}
              onChange={this.VEMhandleChangeEmissions}
            />
          </Col>
          <Col lg={3}>
            <ModelSelector
              meta={meta}
              constraint={this.VEMmodelSelectorConstraint(this.state.VEM)}
              value={this.state.VEM.model}
              onChange={this.VEMhandleChangeModel}
            />
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
          </Col>
          <Col lg={3}>
            {stringify(this.state.VEM.variable)}
          </Col>
          <Col lg={3}>
            {stringify(this.state.VEM.emissions)}
          </Col>
          <Col lg={3}>
            {stringify(this.state.VEM.model)}
          </Col>
        </Row>

        <Row>
          <Col lg={3}>
          </Col>
          {
            this.state.selectorOrder.map((sel, index) => (
            <Col lg={3}>
              {
                index > 0 &&
                <Button
                  bsSize={'xsmall'}
                  onClick={this.moveSelectorOrderDown.bind(this, index-1)}
                >
                  <Glyphicon glyph={'arrow-left'}/>
                </Button>
              }
              {` ${sel} `}
              {
                index < 2 &&
                <Button
                  bsSize={'xsmall'}
                  onClick={this.moveSelectorOrderDown.bind(this, index)}
                >
                  <Glyphicon glyph={'arrow-right'}/>
                </Button>
              }
            </Col>
            ))

          }
        </Row>
        <Row>
          <Col lg={3}>
          </Col>
          {map(sel => this.anySelector(sel))(this.state.selectorOrder)}
        </Row>

        <Row>
          <Col lg={3}>
          </Col>
          {
            map(sel => (
              <Col lg={3}>
                {stringify(this.state.any[sel])}
              </Col>
            ))(this.state.selectorOrder)
          }
        </Row>

      </Grid>
    );
  }
}

export default App;
