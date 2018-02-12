import React from 'react';
import TreeChart from './tree';

const Chart = ({
  chartData,
  dataLength
}) => {
  const treeChartProps = {
    data: chartData,
    dataLength: dataLength,
    height: 600,
    fitViewPadding: 30,
    layoutCfg: {
      direction: 'V',
      getHGap: () => {
        return 35;
      },
      getVGap: () => {
        let height = 80;
        if (dataLength > 80) {
          height = dataLength * 2;
        }
        return height;
      }
    },
    grid: null
  };
  return (
    <div>
      <TreeChart {...treeChartProps} />
    </div>
  );
};
export default Chart;
