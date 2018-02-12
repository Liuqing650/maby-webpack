import React from 'react';
import styles from './index.less';
console.log('styles------>', styles);
const SideTool = ({
  download = 'download',
  scale,
  onClick,
}) => {
  const handleClick = (even) => {
    onClick(even);
  };
  return (
    <div className={styles.toolWrap}>
      <div className={`clearfix ${styles.box}`}>
        <div className={styles.zoomContent}>
          <p onClick={() => handleClick('add')}><button>放大</button></p>
          <p className={styles.zoomText}>{`${scale}%`}</p>
          <p onClick={() => handleClick('sub')}><button>缩小</button></p>
        </div>
        <div className={styles.toolBtn} onClick={() => handleClick(download)}><button>下载</button></div>
      </div>
    </div>
  );
};
export default SideTool;
