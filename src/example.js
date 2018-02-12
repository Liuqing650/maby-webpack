import React, { Component } from 'react';
import Chart from './chart/index';
import mock from './mock/index';
export default class Example extends Component {
  render() {
    console.log('mock', mock);
    const dataInfo = mock('long');
    const ChartProps = {
      chartData: dataInfo.baseData,
      dataLength: dataInfo.dataLength
    };
    return (
      <div>
        <Chart {...ChartProps} />
      </div>
    );
  }
}