import React from 'react';
import nomal from './nomal.json';
import long from './long.json';
let mockInfo = {
  baseData: {},
  dataLength: 0
};
const mockData = (MODEL) => {
  const config = {
    'long': long,
    'nomal': nomal,
  }
  const jsonData = config[MODEL];
  let baseData = {};
  const structureMapping = (data) => {
    const mapInfo = {
      companyName: data.companyName ? data.companyName : '--', // 企业名称
      frname: data.frName ? `${data.frName}(法人代表)` : '--', // 华人代表
      entinvList: data.entinvItemList && data.entinvItemList.length > 0 ? data.entinvItemList : false, // 企业对外投资
      shareList: data.shareHolderList && data.shareHolderList.length > 0 ? data.shareHolderList : false, // 股东
      frinvList: data.frinvList && data.frinvList.length > 0 ? data.frinvList : false, // 法人对外投资
      frPositionList: data.frPositionList && data.frPositionList.length > 0 ? data.frPositionList : false, // 法人在外任职
    };
    let frInfo = {
      treename: mapInfo.frname,
      color: '#E5E5E5',
      dataType: 2, // 数据类型： 公司为1， 人名为2
      arrow: 'none', // 箭头函数: {none: 无箭头, syntropy: 同向箭头, reverse: 反向箭头}
      children: []
    };
    const config = {
      'date': '出资日期',
      'invest': '投资',
      'ratio': '占比',
    };
    // 获取label数据
    const handleLabel = (itemData, isFr = false) => {
      const output = {};
      const temp = {};
      output.isFr = isFr;
      output.line = isFr ? 1 : 2;
      if (isFr) {
        output.text = '担任法人';
        return output;
      }
      const modifyNumber = (value, unit = '万元') => {
        return isNaN(Number(value)) || Number(value).toFixed(2) === '0.00' ? '--' : Number(value).toFixed(2) + unit;
      };
      temp.date = itemData.conDate ? itemData.conDate : '--';
      temp.invest = itemData.subConam ? modifyNumber(itemData.subConam) : '--';
      temp.ratio = itemData.fundedRatio ? itemData.fundedRatio : '--';
      output.text = `${config.invest}${temp.invest}(${config.ratio}: ${temp.ratio})\n${config.date}: ${temp.date}`;
      return output;
    };
    /**
     * 检验公司名称
     * @param {*String} query 待测字符串
     * @param {*Number} minLen 最小长度
     * @return true | false
     */
    const checkCompanyName = (query, minLen = 6) => {
      if (!query) {
        return false;
      }
      const length = `${query}`.length;
      const cond0 = Boolean(length < minLen); // 字符串长度 < minLen
      const cond1 = !Boolean(/[^a-zA-Z]/.test(query)); // 全英文
      const cond2 = Boolean(`${query.replace(/[^0-9]+/g, '')}`.length >= length * 0.6); // 数字占比 >= 0.6;
      const cond3 = Boolean(/[~!@#$%\^&\*\-_=+<>,;:、。?/\\|～＠＃￥％＾＆＊＿＝＋＜＞，．。；：？／＼｜]/.test(query)); // 包含特殊字符
      const cond4 = Boolean(query.match(/[\(（]?\d{1,2}[\.\)）\u2E80-\u9FFF\s]/)); // 数字在前面的错误情况
      const cond5 = Boolean(query.match(/[\u2E80-\u9FFF]+[\da-zA-Z]?[\d]$/)); // 数字在最后的错误情况
      return !(cond0 || cond1 || cond2 || cond3 || cond4 || cond5);
    };

    /**
     * 获取股东数据
     * @param {*Array} arrData 数据源
     * @param {*String} keys 取值键
     * @param {*Number} status 数据存入： baseData为1， frInfo为2
     * @param {*Boolean} isFr 是否为法人： true | false
     * @param {*Number} dataType 数据类型： 公司为1， 人名为2
     * @param {*String} arrow 箭头函数: {none: 无箭头, syntropy: 同向箭头, reverse: 反向箭头}
     */
    const handleData = (arrData, keys, status = 1, isFr = false, dataType = 1, arrow = 'syntropy') => {
      arrData.map((item) => {
        let type = dataType;
        if (dataType === 2 && checkCompanyName(item[keys])) {
          --type;
        }
        item.treename = item[keys];
        item.treeInfo = handleLabel(item, isFr);
        item.treeKey = keys;
        item.color = '#FFFFFF';
        item.dataType = type;
        item.arrow = arrow;
        if (status === 1) {
          baseData.children.push(item);
        } else {
          frInfo.children.push(item);
        }
      });
    };
    // 获取法人信息
    if (mapInfo.frinvList) { // 法人对外投资
      handleData(mapInfo.frinvList, 'entName', 2, false, 1, 'syntropy');
    }
    if (mapInfo.frPositionList) { // 法人在外任职
      handleData(mapInfo.frPositionList, 'entName', 2, true, 1, 'syntropy');
    }

    // 存入数据
    baseData.id = 'root';
    baseData.treename = mapInfo.companyName;
    baseData.dataType = 1;
    baseData.arrow = 'none';
    baseData.color = '#E5E5E5';
    baseData.children = [];
    baseData.children.push(frInfo);
    // 股东数据
    if (mapInfo.entinvList) { // 企业对外投资
      handleData(mapInfo.entinvList, 'entName', 1, false, 1, 'syntropy');
    }
    if (mapInfo.shareList) { // 股东
      handleData(mapInfo.shareList, 'shareholderName', 1, false, 2, 'reverse');
    }
    mockInfo.dataLength = Math.round(baseData.children.length / 2) + frInfo.children.length;
  }
  structureMapping(jsonData);
  mockInfo.baseData = baseData;
  console.log(mockInfo.baseData);
  return mockInfo;
}
export default mockData;
