import React, { Component, PropTypes } from 'react';
import G6 from '@antv/g6';
import SideTool from './tool';
import styles from './index.less';
// import Tooltip from 'components/lib/Tooltip';
// import LinkModule from 'components/common/jumps/nameAndIconLinkModule';
const Global = G6.Global;
const Util = G6.Util;
function generateUniqueId(isDeep) {
  return isDeep ? `rc-g6-1` : `rc-g6-0`;
}
// 设置全局节点样式
Global.nodeStyle = {
  stroke: '#222',
  fill: '#fff',
  lineWidth: 1,
  radius: 0,
  fillOpacity: 0.10
};

G6.registerNode('treeNode', {
  draw(cfg, group) {
    const cfgx = cfg.x;
    const cfgy = cfg.y;
    const model = cfg.model;
    const backRect = group.addShape('rect', {
      attrs: {
        stroke: '#979797',
        fill: cfg.color
      }
    });
    const detailGroup = group.addGroup();
    const labelConfig = {
      exist: model.treeInfo ? true : false,
      line: model.treeInfo && model.treeInfo.line ? model.treeInfo.line : 0,
      text: model.treeInfo && model.treeInfo.text ? model.treeInfo.text : '',
    };
    const modifyPading = (label, boxWidth) => { // 只有1行详情的文字居中显示
      const fontSize = 12;
      if (label.line === 1) {
        const textLength = `${label.text}`.length;
        return (boxWidth - textLength * fontSize) / 2;
      }
      return 0;
    };
    const margin = 10;
    const padding = 6;
    let title;
    let titleBox;
    let detailBox;
    let width;
    let height;
    title = group.addShape('text', {
      attrs: {
        x: cfgx,
        y: cfgy,
        text: model.treename,
        fill: '#212121',
        fontSize: 12,
        fontWeight: 700,
        textBaseline: 'top',
        textAlign: 'center'
      }
    });
    titleBox = title.getBBox();
    const detailPadding = modifyPading(labelConfig, titleBox.width);
    detailGroup.addShape('text', {
      attrs: {
        x: cfgx + margin + detailPadding,
        y: cfgy + margin,
        text: labelConfig.text,
        fontSize: 12,
        fill: '#212121',
        textBaseline: 'top',
        textAlign: 'left'
      }
    });

    detailBox = detailGroup.getBBox();
    const maxwidth = titleBox.width > detailBox.width ? titleBox.width : detailBox.width;
    width = maxwidth + 3 * margin + 2 * padding;
    height = detailBox.height + 2 * padding + titleBox.height;

    title.translate(0, -height / 2 + padding);
    detailGroup.translate(-width / 2 + padding, -height / 2 + titleBox.height + padding);
    backRect.attr({
      x: cfgx - width / 2,
      y: cfgy - height / 2,
      width: width,
      height: height + (labelConfig.exist ? 10 : 0),
      fill: cfg.color
    });
    return backRect;
  }
});
G6.registerEdge('treeEdge', {
  afterDraw(cfg, group, keyShape) {
    const points = cfg.points;
    const model = cfg.target.getModel();
    const end = points[points.length - 1];
    const center = keyShape.getPoint(0.5);
    const before = keyShape.getPoint(0.6);
    let lineWidth = keyShape.attr('lineWidth');
    if (lineWidth < 20) {
      lineWidth = 20;
    }
    const pointsConfig = {
      none: [],
      reverse: [
        [lineWidth / 4, lineWidth / 4],
        [-lineWidth / 4, 0],
        [lineWidth / 4, -lineWidth / 4]
      ],
      syntropy: [
        [-lineWidth / 4, lineWidth / 4],
        [lineWidth / 4, 0],
        [-lineWidth / 4, -lineWidth / 4]
      ]
    };
    const arrowPoints = pointsConfig[model.arrow];
    // 关于自身坐标系构造一个形，作为箭头
    const arrow = group.addShape('polyline', {
      attrs: {
        points: arrowPoints,
        stroke: '#979797'
      },
      class: 'arrow'
    });
    Util.arrowTo(arrow, before.x, before.y, center.x, center.y, end.x, end.y);
  }
}, 'smooth');
class Chart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: {},
      downloadStatus: 'download', // download | loading | error
      url: '',
      ratio: 0.1,
      zoomScale: 0.1, // 初始缩放比例,
    };
    // id生成函数
    this.graphId = generateUniqueId();
    this.graph = null;
    this.graphContainer = null;
    this.deepGraphId = generateUniqueId(true);
    this.deepGraph = null; // 用作下载
    this.deepGraphContainer = null;
    this.center = { x: 480, y: 300 };
    this.position = { x: 0, y: 0 };
    // 初始根节点的 Dom 位置
    this.initRoot = { x: 0, y: 0 };
    // 平移后根节点的 Dom 位置
    this.root = { x: 0, y: 0 };
    // 拖拽点
    this.drag = {
      start: {
        x: 0,
        y: 0
      },
      end: {
        x: 0,
        y: 0
      }
    };
    this.nodeStyle = {
      lineWidth: 1
    };
  }

  componentDidMount() {
    this.initTree(this.props);
  }
  componentDidUpdate(newProps) {
    if (newProps !== this.props) {
      if (this.graph) {
        this.graph.destroy();
      }
      this.initTree(this.props);
    }
  }
  /**
   * G6 事件函数
   * 1. 鼠标左击击事件 onLeftClick
   * 2. 鼠标右击事件 onNodeClick
   * 3. 光标移入事件 onMouseEnter
   * 4. 光标移出事件 onMouseLever
   * 5. 光标滚动事件 onMouseWheel
   * 6. 开始拖拽事件 onDragstart
   * 7. 拖拽结束事件 onDragend
   * 8. 图片下载按钮事件 download
   */
  onLeftClick = (node) => {
    // 点击画布任意节点居中
    this.position = { x: node.x, y: node.y };
    this.caclulationCenter(node);
  }
  onNodeClick = (node) => {
    // Tooltip.remove();
    // const { item, itemType, domEvent } = node;
    // if (item && item._attrs && itemType === 'node') {
    //   const { model } = item._attrs;
    //   domEvent.preventDefault();
    //   if (model.dataType === 1) {
    //     Tooltip.show({
    //       pageX: domEvent.pageX,
    //       pageY: domEvent.pageY,
    //       component: (
    //         <LinkModule
    //           exclude={model.root ? ['report'] : []}
    //           companyName={model.treename}
    //           linkType="open"
    //           mode="vertical"
    //           cbFunc={Tooltip.remove} />
    //       ),
    //     });
    //   }
    // }
  }
  onMouseEnter = (even) => {
    if (even.itemType !== 'node') {
      return;
    }
    const { model } = even.item._attrs;
    const element = this.graph.get('el');
    if (model.dataType === 1) {
      element.style.cursor = 'pointer';
    }
    // this.graph.refresh();
  }
  onMouseLever = (even) => {
    if (even.itemType !== 'node') {
      return;
    }
    const element = this.graph.get('el');
    element.style.cursor = 'move';
  }
  onMouseWheel = (event, isFirefox) => {
    const scale = this.graph.getScale();
    if (!isFirefox) {
      const handleScale = Math.round(parseFloat(scale) * 100) / 100;
      this.setState({
        ratio: this.checkNum(handleScale)
      });
    } else { // 处理火狐浏览器
      const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
      const zoom = delta > 0 ? 'add' : 'sub';
      this.focus(zoom);
    }
  }
  onDragstart = (node) => {
    // 获取拖拽前该点的位置
    this.drag.start = {
      x: node.domX,
      y: node.domY
    };
  }
  onDragend = (node) => {
    /**
     * 获取拖拽后该点的位置
     * 用于计算出该点拖拽后移动的位置，继而得出根节点的位置
     */
    this.drag.end = {
      x: node.domX,
      y: node.domY
    };
    const start = this.drag.start;
    const end = this.drag.end;
    const move = {
      x: end.x - start.x,
      y: end.y - start.y
    };
    const root = this.root;
    this.root = {
      x: root.x + move.x,
      y: root.y + move.y,
    };
  }
  download = () => {
    this.setState({
      downloadLoading: true
    });
    if (this.deepGraph) {
      this.deepGraph.destroy();
    }
    // 分析放大倍数
    const { dataLength } = this.props;
    this.checkDownload(dataLength, 80, true);
    // console.log('dataLength------>', dataLength);
    if (dataLength <= 80) {
      const zoomScale = dataLength >= 80 ? 0.223 : 0.6 - (2 / (10 - dataLength / 10));
      const zoom = dataLength > 10 ? Math.round(parseFloat(dataLength * zoomScale) * 100) / 100 : 3;
      this.createDeepTree(this.props, 10, dataLength);
      // this.graph.autoZoom(); // 可视图层缩放到适应屏幕
      const saveName = this.findRootInfo('treename');
      setTimeout(() => {
        this.downloadImage(saveName ? saveName : '');
      }, zoom > 3 ? zoom * 500 : 300);
    }
  };
  /**
   * 初始化图形
   * initTree 初始化可视图形（显示）
   * @param {*Obejct} props 数据
   *
   * createDeepTree 创建一个下载图形（隐藏）
   * @param {*Obejct} props 数据
   * @param {*number} zoom  放大系数
   */
  initTree(props) {
    const graph = new G6.Tree({
      id: this.graphId,
      fitView: 'autoZoom',
      ...props
    });
    graph.tooltip(false);
    this.graphContainer = graph.get('graphContainer');
    graph.addBehaviour('default', ['dragCanvas']);
    graph.source(props.data);
    graph.node().shape('treeNode');
    graph.edge().shape('treeEdge');
    graph.edge().tooltip((data) => {
      const allData = [this.graph.save().source];
      const node = this.findNodeDataById(allData, data.target);
      return [['路径标识', node.treename]];
    });
    graph.node().tooltip((obj) => {
      return [
        ['简要信息', obj.treename]
      ];
    });
    this.graph = graph;
    this.graph.render();
    this.graph.on('contextmenu', this.onNodeClick);
    this.graph.on('click', this.onLeftClick);
    this.graph.on('itemmouseenter', this.onMouseEnter);
    this.graph.on('itemmouseleave', this.onMouseLever);
    this.graph.on('mousewheel', this.onMouseWheel);
    this.graph.on('dragstart', this.onDragstart);
    this.graph.on('dragend', this.onDragend);
    if (/Firefox/i.test(navigator.userAgent)) {
      this.graphContainer.addEventListener('DOMMouseScroll', (event) => {
        this.onMouseWheel(event, true);
      });
    }
    // 拿到根节点的位置
    this.initRoot = this.graph.converPoint(0, 0);
    this.root = Object.assign({}, this.initRoot);

    // Tooltip.remove();
    this.checkDownload(this.props.dataLength, 80);
  }
  createDeepTree = (props, zoom, dataLength) => {
    const width = dataLength * 300;
    const deepGraph = new G6.Tree({
      id: this.deepGraphId,
      fitView: 'autoZoom',
      ...props,
      width: width,
      height: props.height + zoom * dataLength * 10
    });
    deepGraph.source(props.data);
    deepGraph.node().shape('treeNode');
    deepGraph.node().label((data) => {
      return {
        text: data.treename,
        nodeInfo: data,
      };
    }).style(this.nodeStyle);
    deepGraph.edge().shape('treeEdge');
    this.deepGraph = deepGraph;
    this.deepGraph.render();
  }
  /**
   * 缩放图形、下载图片
   * focus 缩放比例
   * zoom 放大|缩小
   * downloadImage 图形转换下载
   */
  focus = (zoom) => {
    let scale = this.graph.getScale();
    if (zoom === 'add' && scale >= 0 && scale <= 9.8) {
      scale = Math.round(parseFloat(scale + 0.2) * 100) / 100;
    }
    if (zoom === 'sub' && scale <= 10 && scale >= 0) {
      scale = Math.round(parseFloat(scale - 0.2) * 100) / 100;
    }
    scale = this.checkNum(scale, 0, 9.9);
    this.zoom(scale, this.graph);
    this.setState({
      ratio: scale
    });
  }
  zoom = (ratio, graph) => {
    // const zoom = {
    //   x: 0,
    //   y: 0
    // };
    const matrix = new G6.Matrix.Matrix3();
    // matrix.translate(-zoom.x, -zoom.y);
    matrix.scale(ratio, ratio);
    matrix.translate(this.root.x, this.root.y);
    // matrix.translate(zoom.x, zoom.y);

    graph.updateMatrix(matrix);
    graph.refresh();
  }
  downloadImage = (filename) => {
    const canvasArr = this.deepGraph.get('graphContainer').getElementsByTagName('canvas');
    const { height, width } = canvasArr[0];
    // 设置图形层背景颜色，合并为一个canvas
    canvasArr[0].style.backgroundColor = '#fff';
    canvasArr[1].style.backgroundColor = 'transparent';
    canvasArr[0].getContext('2d').drawImage(canvasArr[1], 0, 0);
    // 创建新画布，矩形填充整个画布，再次合并所有画布
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(canvasArr[0], 0, 0);
    console.log(filename);
    // 创建并下载图片
    const dataURL = canvas.toDataURL('image/jpeg');
    const link = document.createElement('a');
    const saveName = `${filename}-股权结构图.jpeg`;
    link.download = saveName;
    link.href = dataURL.replace('image/jpeg', 'image/octet-stream');
    if (/Firefox/i.test(navigator.userAgent)) {
      const evt = document.createEvent('MouseEvents');
      evt.initEvent('click', true, true);
      link.dispatchEvent(evt);
    } else {
      link.click();
    }
    this.checkDownload(this.props.dataLength, 80); // 重置下载图标
  }
  /**
   * 工具区
   * 1. 根据id查找节点 findNodeDataById
   * 2. 查找根信息 findRootInfo
   * 3. 获取角度 angle
   * 4. 检测边缘数字 checkNum
   * 5. 检测是否可以下载 checkDownload
   */

  findNodeDataById = (nodeData, nodeId) => {
    let output = {};
    let stop = false;
    const loop = (data) => {
      if (!stop) {
        data.map((item) => {
          if (item.id === nodeId) {
            output = item;
            stop = true;
          }
          if (!stop && item.children) {
            loop(item.children);
          }
        });
      }
    };
    loop(nodeData);
    return output;
  };
  findRootInfo = (attr) => {
    const allData = this.graph.save().source;
    if (allData.root) {
      return attr ? allData[attr] : allData;
    }
    console.log('没有数据');
    return null;
  }
  angle = (start, end) => {
    const diffX = end.x - start.x;
    const diffY = end.y - start.y;
    return 360 * Math.atan(diffY / diffX) / (2 * Math.PI);
  }
  checkNum = (num, min = 0, max = 9.6) => {
    if (num <= min) {
      return 0.1;
    }
    if (num >= max) {
      return 10;
    }
    return num;
  }
  checkDownload = (length, max, loading = false) => {
    let status = length > max ? 'error' : 'download';
    if (loading) {
      status = length > max ? 'error' : 'loading';
    }
    this.setState({
      downloadStatus: status
    });
  };
  caclulationCenter = (node) => {
    /**
     * G6 平移测试
     * 1. 初始根节点DOM this.initRoot
     * 2. 移动的根节点DOM this.root, 初始于根节点相等
     * 3. 设置画布的中点 this.center
     * 4. 获取节点的 DOM 节点 node
     * 6. 计算出移动位置 move
     */
    const move = {
      x: this.center.x - node.domX,
      y: this.center.y - node.domY,
    };
    const moveRoot = {
      x: this.root.x + move.x,
      y: this.root.y + move.y,
    };
    this.root = moveRoot;
  }
  resetTool = () => {
    // Tooltip.remove();
  }

  render() {
    const { ratio, downloadStatus } = this.state;
    const self = this;
    const sideToolProps = {
      download: downloadStatus,
      scale: Math.round(ratio * 10),
      onClick(even) {
        switch (even) {
          case 'download':
            self.download();
            break;
          case 'add':
            self.focus('add');
            break;
          case 'sub':
            self.focus('sub');
            break;
          default:
            break;
        }
      }
    };
    return (
      <div className={styles.chartWrap} onBlur={this.resetTool}>
        <SideTool {...sideToolProps} />
        <div id={this.graphId} className={styles.chart}></div>
        <div id={this.deepGraphId} style={{ display: 'none' }}></div>
      </div>
    );
  }
}

export default Chart;
