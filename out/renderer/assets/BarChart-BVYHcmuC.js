import { r as reactExports, a as clsx } from "./index-BcwudWUj.js";
import { aa as useAppDispatch, ao as setActiveMouseOverItemIndex, ap as mouseLeaveItem, aq as setActiveClickItemIndex, ar as isStacked, as as isNullish, a4 as getPercentValue, at as isWellBehavedNumber, au as getStackSeriesIdentifier, av as Rectangle, T as isNumber, a1 as Shape, c as createSelector, A as selectChartOffsetInternal, aw as selectAxisViewBox, o as selectChartLayout, ax as selectChartDataWithIndexesIfNotInPanoramaPosition3, ay as selectXAxisIdFromGraphicalItemId, az as selectAxisWithScale, aA as selectYAxisIdFromGraphicalItemId, aB as selectTicksOfGraphicalItem, aC as getBandSizeOfAxis, aD as selectUnfilteredCartesianItems, aE as selectRootMaxBarSize, aF as selectBarGap, aG as selectBarCategoryGap, aH as selectStackGroups, aI as selectRootBarSize, aJ as selectCartesianAxisSize, aK as getNormalizedStackId, L as Layer, aL as propsAreEqual, B as resolveDefaultProps, D as DefaultZIndexes, C as matchAppend, aM as useIsPanorama, R as RegisterGraphicalItemId, aN as SetLegendPayload, aO as SetCartesianGraphicalItem, Z as ZIndexLayer, H as interpolate, z as getTooltipNameProp, M as SetTooltipEntrySettings, aP as noop, aQ as useNeedsClip, aR as useChartLayout, I as findAllByType, J as useAppSelector, h as getValueByDataKey, aS as GraphicalItemClipPath, aT as getBaseValueOfBar, aU as truncateByDomain, aV as getCateCoordinateOfBar, W as selectActiveTooltipIndex, a6 as svgPropertiesNoEventsFromUnknown, a0 as adaptEventsOfChild, N as useAnimationCallbacks, P as AnimatedItems, a2 as LabelListFromLabelProp, aW as CartesianLabelListContextProvider, E as svgPropertiesNoEvents, X as selectActiveTooltipDataKey, aX as isNan, U as mathSign, aY as axisPropsAreEqual, aZ as implicitYAxis, a_ as defaultCartesianAxisProps, a$ as useCartesianChartLayout, b0 as addYAxis, b1 as replaceYAxis, b2 as removeYAxis, b3 as selectYAxisSize, b4 as selectYAxisPosition, b5 as selectTicksOfAxis, b6 as selectYAxisSettingsNoDefaults, b7 as isLabelContentAFunction, b8 as updateYAxisWidth, b9 as CartesianAxis, ba as getAxisTypeBasedOnLayout, bb as CartesianChart, aj as arrayTooltipSearcher } from "./CartesianChart-CDIsnLQX.js";
var Cell = (_props) => null;
Cell.displayName = "Cell";
var useMouseEnterItemDispatch = (onMouseEnterFromProps, dataKey, graphicalItemId) => {
  var dispatch = useAppDispatch();
  return (data, index) => (event) => {
    onMouseEnterFromProps === null || onMouseEnterFromProps === void 0 || onMouseEnterFromProps(data, index, event);
    dispatch(setActiveMouseOverItemIndex({
      activeIndex: String(index),
      activeDataKey: dataKey,
      activeCoordinate: data.tooltipPosition,
      activeGraphicalItemId: graphicalItemId
    }));
  };
};
var useMouseLeaveItemDispatch = (onMouseLeaveFromProps) => {
  var dispatch = useAppDispatch();
  return (data, index) => (event) => {
    onMouseLeaveFromProps === null || onMouseLeaveFromProps === void 0 || onMouseLeaveFromProps(data, index, event);
    dispatch(mouseLeaveItem());
  };
};
var useMouseClickItemDispatch = (onMouseClickFromProps, dataKey, graphicalItemId) => {
  var dispatch = useAppDispatch();
  return (data, index) => (event) => {
    onMouseClickFromProps === null || onMouseClickFromProps === void 0 || onMouseClickFromProps(data, index, event);
    dispatch(setActiveClickItemIndex({
      activeIndex: String(index),
      activeDataKey: dataKey,
      activeCoordinate: data.tooltipPosition,
      activeGraphicalItemId: graphicalItemId
    }));
  };
};
function _slicedToArray$1(r, e) {
  return _arrayWithHoles$1(r) || _iterableToArrayLimit$1(r, e) || _unsupportedIterableToArray$1(r, e) || _nonIterableRest$1();
}
function _nonIterableRest$1() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$1(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray$1(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray$1(r, a) : void 0;
  }
}
function _arrayLikeToArray$1(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _iterableToArrayLimit$1(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$1(r) {
  if (Array.isArray(r)) return r;
}
var getBarSize = (globalSize, totalSize, selfSize) => {
  var barSize = selfSize !== null && selfSize !== void 0 ? selfSize : globalSize;
  if (isNullish(barSize)) {
    return void 0;
  }
  return getPercentValue(barSize, totalSize, 0);
};
var combineBarSizeList = (allBars, globalSize, totalSize) => {
  var initialValue = {};
  var stackedBars = allBars.filter(isStacked);
  var unstackedBars = allBars.filter((b) => b.stackId == null);
  var groupByStack = stackedBars.reduce((acc, bar) => {
    var s = acc[bar.stackId];
    if (s == null) {
      s = [];
    }
    s.push(bar);
    acc[bar.stackId] = s;
    return acc;
  }, initialValue);
  var stackedSizeList = Object.entries(groupByStack).map((_ref) => {
    var _bars$;
    var _ref2 = _slicedToArray$1(_ref, 2), stackId = _ref2[0], bars = _ref2[1];
    var dataKeys = bars.map((b) => b.dataKey);
    var barSize = getBarSize(globalSize, totalSize, (_bars$ = bars[0]) === null || _bars$ === void 0 ? void 0 : _bars$.barSize);
    return {
      stackId,
      dataKeys,
      barSize
    };
  });
  var unstackedSizeList = unstackedBars.map((b) => {
    var dataKeys = [b.dataKey].filter((dk) => dk != null);
    var barSize = getBarSize(globalSize, totalSize, b.barSize);
    return {
      stackId: void 0,
      dataKeys,
      barSize
    };
  });
  return [...stackedSizeList, ...unstackedSizeList];
};
function ownKeys$2(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$2(Object(t), true).forEach(function(r2) {
      _defineProperty$2(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$2(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$2(e, r, t) {
  return (r = _toPropertyKey$2(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$2(t) {
  var i = _toPrimitive$2(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$2(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function getBarPositions(barGap, barCategoryGap, bandSize, sizeList, maxBarSize) {
  var _sizeList$;
  var len = sizeList.length;
  if (len < 1) {
    return void 0;
  }
  var realBarGap = getPercentValue(barGap, bandSize, 0, true);
  var result;
  var initialValue = [];
  if (isWellBehavedNumber((_sizeList$ = sizeList[0]) === null || _sizeList$ === void 0 ? void 0 : _sizeList$.barSize)) {
    var useFull = false;
    var fullBarSize = bandSize / len;
    var sum = sizeList.reduce((res, entry) => res + (entry.barSize || 0), 0);
    sum += (len - 1) * realBarGap;
    if (sum >= bandSize) {
      sum -= (len - 1) * realBarGap;
      realBarGap = 0;
    }
    if (sum >= bandSize && fullBarSize > 0) {
      useFull = true;
      fullBarSize *= 0.9;
      sum = len * fullBarSize;
    }
    var offset = Math.round((bandSize - sum) / 2);
    var prev = {
      offset: offset - realBarGap,
      size: 0
    };
    result = sizeList.reduce((res, entry) => {
      var _entry$barSize;
      var newPosition = {
        stackId: entry.stackId,
        dataKeys: entry.dataKeys,
        position: {
          offset: prev.offset + prev.size + realBarGap,
          size: useFull ? fullBarSize : (_entry$barSize = entry.barSize) !== null && _entry$barSize !== void 0 ? _entry$barSize : 0
        }
      };
      var newRes = [...res, newPosition];
      prev = newPosition.position;
      return newRes;
    }, initialValue);
  } else {
    var _offset = getPercentValue(barCategoryGap, bandSize, 0, true);
    if (bandSize - 2 * _offset - (len - 1) * realBarGap <= 0) {
      realBarGap = 0;
    }
    var originalSize = (bandSize - 2 * _offset - (len - 1) * realBarGap) / len;
    if (originalSize > 1) {
      originalSize = Math.round(originalSize);
    }
    var size = isWellBehavedNumber(maxBarSize) ? Math.min(originalSize, maxBarSize) : originalSize;
    result = sizeList.reduce((res, entry, i) => [...res, {
      stackId: entry.stackId,
      dataKeys: entry.dataKeys,
      position: {
        offset: _offset + len * (originalSize - size) / 2 + (size + realBarGap) * i,
        size
      }
    }], initialValue);
  }
  return result;
}
var combineAllBarPositions = (sizeList, globalMaxBarSize, barGap, barCategoryGap, barBandSize, bandSize, childMaxBarSize) => {
  var maxBarSize = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
  var allBarPositions = getBarPositions(barGap, barCategoryGap, barBandSize !== bandSize ? barBandSize : bandSize, sizeList, maxBarSize);
  if (barBandSize !== bandSize && allBarPositions != null) {
    allBarPositions = allBarPositions.map((pos) => _objectSpread$2(_objectSpread$2({}, pos), {}, {
      position: _objectSpread$2(_objectSpread$2({}, pos.position), {}, {
        offset: pos.position.offset - barBandSize / 2
      })
    }));
  }
  return allBarPositions;
};
var combineStackedData = (stackGroups, barSettings) => {
  var stackSeriesIdentifier = getStackSeriesIdentifier(barSettings);
  if (!stackGroups || stackSeriesIdentifier == null || barSettings == null) {
    return void 0;
  }
  var stackId = barSettings.stackId;
  if (stackId == null) {
    return void 0;
  }
  var stackGroup = stackGroups[stackId];
  if (!stackGroup) {
    return void 0;
  }
  var stackedData = stackGroup.stackedData;
  if (!stackedData) {
    return void 0;
  }
  return stackedData.find((sd) => sd.key === stackSeriesIdentifier);
};
var combineBarPosition = (allBarPositions, barSettings) => {
  if (allBarPositions == null || barSettings == null) {
    return void 0;
  }
  var position = allBarPositions.find((p) => p.stackId === barSettings.stackId && barSettings.dataKey != null && p.dataKeys.includes(barSettings.dataKey));
  if (position == null) {
    return void 0;
  }
  return position.position;
};
function getZIndexFromUnknown(input, defaultZIndex) {
  if (input && typeof input === "object" && "zIndex" in input && typeof input.zIndex === "number" && isWellBehavedNumber(input.zIndex)) {
    return input.zIndex;
  }
  return defaultZIndex;
}
var _excluded$4 = ["children"];
function _objectWithoutProperties$4(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose$4(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose$4(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
var initialContextState = {
  data: [],
  xAxisId: "xAxis-0",
  yAxisId: "yAxis-0",
  dataPointFormatter: () => ({
    x: 0,
    y: 0,
    value: 0
  }),
  errorBarOffset: 0
};
var ErrorBarContext = /* @__PURE__ */ reactExports.createContext(initialContextState);
function SetErrorBarContext(props) {
  var children = props.children, rest = _objectWithoutProperties$4(props, _excluded$4);
  return /* @__PURE__ */ reactExports.createElement(ErrorBarContext.Provider, {
    value: rest
  }, children);
}
var prefix = "Invariant failed";
function invariant(condition, message) {
  {
    throw new Error(prefix);
  }
}
var _excluded$3 = ["option"];
function _objectWithoutProperties$3(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose$3(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose$3(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
var defaultBarShape = Rectangle;
function BarRectangle(_ref) {
  var option = _ref.option, shapeProps = _objectWithoutProperties$3(_ref, _excluded$3);
  return /* @__PURE__ */ reactExports.createElement(Shape, {
    option,
    DefaultShape: defaultBarShape,
    shapeProps,
    activeClassName: "recharts-active-bar",
    inActiveClassName: "recharts-inactive-bar"
  });
}
var minPointSizeCallback = function minPointSizeCallback2(minPointSize) {
  var defaultValue = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  return (value, index) => {
    if (isNumber(minPointSize)) return minPointSize;
    var isValueNumberOrNil = isNumber(value) || isNullish(value);
    if (isValueNumberOrNil) {
      return minPointSize(value, index);
    }
    !isValueNumberOrNil ? invariant() : void 0;
    return defaultValue;
  };
};
var pickIsPanorama = (_state, _id, isPanorama) => isPanorama;
var pickBarId = (_state, id) => id;
var selectSynchronisedBarSettings = createSelector([selectUnfilteredCartesianItems, pickBarId], (graphicalItems, id) => graphicalItems.filter((item) => item.type === "bar").find((item) => item.id === id));
var selectMaxBarSize = createSelector([selectSynchronisedBarSettings], (barSettings) => barSettings === null || barSettings === void 0 ? void 0 : barSettings.maxBarSize);
var pickCells = (_state, _id, _isPanorama, cells) => cells;
var selectAllVisibleBars = createSelector([selectChartLayout, selectUnfilteredCartesianItems, selectXAxisIdFromGraphicalItemId, selectYAxisIdFromGraphicalItemId, pickIsPanorama], (layout, allItems, xAxisId, yAxisId, isPanorama) => allItems.filter((i) => {
  if (layout === "horizontal") {
    return i.xAxisId === xAxisId;
  }
  return i.yAxisId === yAxisId;
}).filter((i) => i.isPanorama === isPanorama).filter((i) => i.hide === false).filter((i) => i.type === "bar"));
var selectBarStackGroups = (state, id, isPanorama) => {
  var layout = selectChartLayout(state);
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return void 0;
  }
  if (layout === "horizontal") {
    return selectStackGroups(state, "yAxis", yAxisId, isPanorama);
  }
  return selectStackGroups(state, "xAxis", xAxisId, isPanorama);
};
var selectBarCartesianAxisSize = (state, id) => {
  var layout = selectChartLayout(state);
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return void 0;
  }
  if (layout === "horizontal") {
    return selectCartesianAxisSize(state, "xAxis", xAxisId);
  }
  return selectCartesianAxisSize(state, "yAxis", yAxisId);
};
var selectBarSizeList = createSelector([selectAllVisibleBars, selectRootBarSize, selectBarCartesianAxisSize], combineBarSizeList);
var selectBarBandSize = (state, id, isPanorama) => {
  var _ref, _getBandSizeOfAxis;
  var barSettings = selectSynchronisedBarSettings(state, id);
  if (barSettings == null) {
    return 0;
  }
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return 0;
  }
  var layout = selectChartLayout(state);
  var globalMaxBarSize = selectRootMaxBarSize(state);
  var childMaxBarSize = barSettings.maxBarSize;
  var maxBarSize = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize;
  var axis, ticks;
  if (layout === "horizontal") {
    axis = selectAxisWithScale(state, "xAxis", xAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "xAxis", xAxisId, isPanorama);
  } else {
    axis = selectAxisWithScale(state, "yAxis", yAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "yAxis", yAxisId, isPanorama);
  }
  return (_ref = (_getBandSizeOfAxis = getBandSizeOfAxis(axis, ticks, true)) !== null && _getBandSizeOfAxis !== void 0 ? _getBandSizeOfAxis : maxBarSize) !== null && _ref !== void 0 ? _ref : 0;
};
var selectAxisBandSize = (state, id, isPanorama) => {
  var layout = selectChartLayout(state);
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null || yAxisId == null) {
    return void 0;
  }
  var axis, ticks;
  if (layout === "horizontal") {
    axis = selectAxisWithScale(state, "xAxis", xAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "xAxis", xAxisId, isPanorama);
  } else {
    axis = selectAxisWithScale(state, "yAxis", yAxisId, isPanorama);
    ticks = selectTicksOfGraphicalItem(state, "yAxis", yAxisId, isPanorama);
  }
  return getBandSizeOfAxis(axis, ticks);
};
var selectAllBarPositions = createSelector([selectBarSizeList, selectRootMaxBarSize, selectBarGap, selectBarCategoryGap, selectBarBandSize, selectAxisBandSize, selectMaxBarSize], combineAllBarPositions);
var selectXAxisWithScale = (state, id, isPanorama) => {
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null) {
    return void 0;
  }
  return selectAxisWithScale(state, "xAxis", xAxisId, isPanorama);
};
var selectYAxisWithScale = (state, id, isPanorama) => {
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (yAxisId == null) {
    return void 0;
  }
  return selectAxisWithScale(state, "yAxis", yAxisId, isPanorama);
};
var selectXAxisTicks = (state, id, isPanorama) => {
  var xAxisId = selectXAxisIdFromGraphicalItemId(state, id);
  if (xAxisId == null) {
    return void 0;
  }
  return selectTicksOfGraphicalItem(state, "xAxis", xAxisId, isPanorama);
};
var selectYAxisTicks = (state, id, isPanorama) => {
  var yAxisId = selectYAxisIdFromGraphicalItemId(state, id);
  if (yAxisId == null) {
    return void 0;
  }
  return selectTicksOfGraphicalItem(state, "yAxis", yAxisId, isPanorama);
};
var selectBarPosition = createSelector([selectAllBarPositions, selectSynchronisedBarSettings], combineBarPosition);
var selectStackedDataOfItem = createSelector([selectBarStackGroups, selectSynchronisedBarSettings], combineStackedData);
var selectBarRectangles = createSelector([selectChartOffsetInternal, selectAxisViewBox, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks, selectBarPosition, selectChartLayout, selectChartDataWithIndexesIfNotInPanoramaPosition3, selectAxisBandSize, selectStackedDataOfItem, selectSynchronisedBarSettings, pickCells], (offset, axisViewBox, xAxis, yAxis, xAxisTicks, yAxisTicks, pos, layout, _ref2, bandSize, stackedData, barSettings, cells) => {
  var chartData = _ref2.chartData, dataStartIndex = _ref2.dataStartIndex, dataEndIndex = _ref2.dataEndIndex;
  if (barSettings == null || pos == null || axisViewBox == null || layout !== "horizontal" && layout !== "vertical" || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || bandSize == null) {
    return void 0;
  }
  var data = barSettings.data;
  var displayedData;
  if (data != null && data.length > 0) {
    displayedData = data;
  } else {
    displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
  }
  if (displayedData == null) {
    return void 0;
  }
  return computeBarRectangles({
    layout,
    barSettings,
    pos,
    parentViewBox: axisViewBox,
    bandSize,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    stackedData,
    displayedData,
    offset,
    cells,
    dataStartIndex
  });
});
var _excluded$2 = ["index"];
function _extends$2() {
  return _extends$2 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$2.apply(null, arguments);
}
function _objectWithoutProperties$2(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose$2(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose$2(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
var BarStackContext = /* @__PURE__ */ reactExports.createContext(void 0);
var useStackId = (childStackId) => {
  var stackSettings = reactExports.useContext(BarStackContext);
  if (stackSettings != null) {
    return stackSettings.stackId;
  }
  if (childStackId == null) {
    return void 0;
  }
  return getNormalizedStackId(childStackId);
};
var getClipPathId = (stackId, index) => {
  return "recharts-bar-stack-clip-path-".concat(stackId, "-").concat(index);
};
var useBarStackClipPathUrl = (index) => {
  var barStackContext = reactExports.useContext(BarStackContext);
  if (barStackContext == null) {
    return void 0;
  }
  var stackId = barStackContext.stackId;
  return "url(#".concat(getClipPathId(stackId, index), ")");
};
var BarStackClipLayer = (_ref) => {
  var index = _ref.index, rest = _objectWithoutProperties$2(_ref, _excluded$2);
  var clipPathUrl = useBarStackClipPathUrl(index);
  return /* @__PURE__ */ reactExports.createElement(Layer, _extends$2({
    className: "recharts-bar-stack-layer",
    clipPath: clipPathUrl
  }, rest));
};
var _excluded$1 = ["onMouseEnter", "onMouseLeave", "onClick"], _excluded2$1 = ["value", "background", "tooltipPosition"], _excluded3$1 = ["id"], _excluded4 = ["onMouseEnter", "onClick", "onMouseLeave"];
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _extends$1() {
  return _extends$1 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$1.apply(null, arguments);
}
function ownKeys$1(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$1(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$1(Object(t), true).forEach(function(r2) {
      _defineProperty$1(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$1(e, r, t) {
  return (r = _toPropertyKey$1(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$1(t) {
  var i = _toPrimitive$1(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$1(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _objectWithoutProperties$1(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose$1(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose$1(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
var computeLegendPayloadFromBarData = (props) => {
  var dataKey = props.dataKey, name = props.name, fill = props.fill, legendType = props.legendType, hide = props.hide;
  return [{
    inactive: hide,
    dataKey,
    type: legendType,
    color: fill,
    value: getTooltipNameProp(name, dataKey),
    payload: props
  }];
};
var SetBarTooltipEntrySettings = /* @__PURE__ */ reactExports.memo((_ref) => {
  var dataKey = _ref.dataKey, stroke = _ref.stroke, strokeWidth = _ref.strokeWidth, fill = _ref.fill, name = _ref.name, hide = _ref.hide, unit = _ref.unit, formatter = _ref.formatter, tooltipType = _ref.tooltipType, id = _ref.id;
  var tooltipEntrySettings = {
    dataDefinedOnItem: void 0,
    getPosition: noop,
    settings: {
      stroke,
      strokeWidth,
      fill,
      dataKey,
      nameKey: void 0,
      name: getTooltipNameProp(name, dataKey),
      hide,
      type: tooltipType,
      color: fill,
      unit,
      formatter,
      graphicalItemId: id
    }
  };
  return /* @__PURE__ */ reactExports.createElement(SetTooltipEntrySettings, {
    tooltipEntrySettings
  });
});
function BarBackground(props) {
  var activeIndex = useAppSelector(selectActiveTooltipIndex);
  var data = props.data, dataKey = props.dataKey, backgroundFromProps = props.background, allOtherBarProps = props.allOtherBarProps;
  var onMouseEnterFromProps = allOtherBarProps.onMouseEnter, onMouseLeaveFromProps = allOtherBarProps.onMouseLeave, onItemClickFromProps = allOtherBarProps.onClick, restOfAllOtherProps = _objectWithoutProperties$1(allOtherBarProps, _excluded$1);
  var onMouseEnterFromContext = useMouseEnterItemDispatch(onMouseEnterFromProps, dataKey, allOtherBarProps.id);
  var onMouseLeaveFromContext = useMouseLeaveItemDispatch(onMouseLeaveFromProps);
  var onClickFromContext = useMouseClickItemDispatch(onItemClickFromProps, dataKey, allOtherBarProps.id);
  if (!backgroundFromProps || data == null) {
    return null;
  }
  var backgroundProps = svgPropertiesNoEventsFromUnknown(backgroundFromProps);
  return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
    zIndex: getZIndexFromUnknown(backgroundFromProps, DefaultZIndexes.barBackground)
  }, data.map((entry, i) => {
    entry.value;
    var backgroundFromDataEntry = entry.background;
    entry.tooltipPosition;
    var rest = _objectWithoutProperties$1(entry, _excluded2$1);
    if (!backgroundFromDataEntry) {
      return null;
    }
    var onMouseEnter = onMouseEnterFromContext(entry, entry.originalDataIndex);
    var onMouseLeave = onMouseLeaveFromContext(entry, entry.originalDataIndex);
    var onClick = onClickFromContext(entry, entry.originalDataIndex);
    var barRectangleProps = _objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1(_objectSpread$1({
      option: backgroundFromProps,
      isActive: String(entry.originalDataIndex) === activeIndex
    }, rest), {}, {
      // @ts-expect-error backgroundProps is contributing unknown props
      fill: "#eee"
    }, backgroundFromDataEntry), backgroundProps), adaptEventsOfChild(restOfAllOtherProps, entry, i)), {}, {
      onMouseEnter,
      onMouseLeave,
      onClick,
      dataKey,
      index: i,
      className: "recharts-bar-background-rectangle"
    });
    return /* @__PURE__ */ reactExports.createElement(BarRectangle, _extends$1({
      key: "background-bar-".concat(i)
    }, barRectangleProps));
  }));
}
function BarLabelListProvider(_ref2) {
  var showLabels = _ref2.showLabels, children = _ref2.children, rects = _ref2.rects;
  var labelListEntries = rects === null || rects === void 0 ? void 0 : rects.map((entry) => {
    var viewBox = {
      x: entry.x,
      y: entry.y,
      width: entry.width,
      lowerWidth: entry.width,
      upperWidth: entry.width,
      height: entry.height
    };
    return _objectSpread$1(_objectSpread$1({}, viewBox), {}, {
      value: entry.value,
      payload: entry.payload,
      parentViewBox: entry.parentViewBox,
      viewBox,
      fill: entry.fill
    });
  });
  return /* @__PURE__ */ reactExports.createElement(CartesianLabelListContextProvider, {
    value: showLabels ? labelListEntries : void 0
  }, children);
}
function BarRectangleWithActiveState(props) {
  var shape = props.shape, activeBar = props.activeBar, baseProps = props.baseProps, entry = props.entry, index = props.index, dataKey = props.dataKey;
  var activeIndex = useAppSelector(selectActiveTooltipIndex);
  var activeDataKey = useAppSelector(selectActiveTooltipDataKey);
  var isActive = activeBar && String(entry.originalDataIndex) === activeIndex && (activeDataKey == null || dataKey === activeDataKey);
  var isAnotherBarActive = activeIndex != null && (String(entry.originalDataIndex) !== activeIndex || activeDataKey != null && dataKey !== activeDataKey);
  var _useState = reactExports.useState(false), _useState2 = _slicedToArray(_useState, 2), stayInLayer = _useState2[0], setStayInLayer = _useState2[1];
  var _useState3 = reactExports.useState(false), _useState4 = _slicedToArray(_useState3, 2), hasMountedActive = _useState4[0], setHasMountedActive = _useState4[1];
  reactExports.useEffect(() => {
    var rafId;
    if (isActive) {
      setStayInLayer(true);
      rafId = requestAnimationFrame(() => {
        setHasMountedActive(true);
      });
    } else {
      setHasMountedActive(false);
      if (isAnotherBarActive) {
        setStayInLayer(false);
      }
    }
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isActive, isAnotherBarActive]);
  var handleTransitionEnd = reactExports.useCallback(() => {
    if (!isActive) {
      setStayInLayer(false);
    }
  }, [isActive]);
  var isVisuallyActive = isActive && hasMountedActive;
  var shouldRenderInLayer = isActive || stayInLayer;
  var option;
  if (isActive) {
    if (activeBar === true) {
      option = shape;
    } else {
      option = activeBar;
    }
  } else {
    option = shape;
  }
  var content = /* @__PURE__ */ reactExports.createElement(BarRectangle, _extends$1({}, baseProps, {
    name: String(baseProps.name)
  }, entry, {
    isActive: isVisuallyActive,
    option,
    index,
    dataKey,
    animationElapsedTime: props.animationElapsedTime,
    isAnimating: props.isAnimating,
    isEntrance: props.isEntrance,
    onTransitionEnd: handleTransitionEnd
  }));
  if (shouldRenderInLayer) {
    return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
      zIndex: DefaultZIndexes.activeBar
    }, /* @__PURE__ */ reactExports.createElement(BarStackClipLayer, {
      index: entry.originalDataIndex
    }, content));
  }
  return content;
}
function BarRectangleNeverActive(props) {
  var shape = props.shape, baseProps = props.baseProps, entry = props.entry, index = props.index, dataKey = props.dataKey;
  return /* @__PURE__ */ reactExports.createElement(BarRectangle, _extends$1({}, baseProps, {
    name: String(baseProps.name)
  }, entry, {
    isActive: false,
    option: shape,
    index,
    dataKey,
    animationElapsedTime: props.animationElapsedTime,
    isAnimating: props.isAnimating,
    isEntrance: props.isEntrance
  }));
}
function BarRectangles(_ref3) {
  var _svgPropertiesNoEvent;
  var data = _ref3.data, props = _ref3.props, animationElapsedTime = _ref3.animationElapsedTime, isAnimating = _ref3.isAnimating, isEntrance = _ref3.isEntrance;
  var _ref4 = (_svgPropertiesNoEvent = svgPropertiesNoEvents(props)) !== null && _svgPropertiesNoEvent !== void 0 ? _svgPropertiesNoEvent : {}, id = _ref4.id, baseProps = _objectWithoutProperties$1(_ref4, _excluded3$1);
  var shape = props.shape, dataKey = props.dataKey, activeBar = props.activeBar;
  var onMouseEnterFromProps = props.onMouseEnter, onItemClickFromProps = props.onClick, onMouseLeaveFromProps = props.onMouseLeave, restOfAllOtherProps = _objectWithoutProperties$1(props, _excluded4);
  var onMouseEnterFromContext = useMouseEnterItemDispatch(onMouseEnterFromProps, dataKey, id);
  var onMouseLeaveFromContext = useMouseLeaveItemDispatch(onMouseLeaveFromProps);
  var onClickFromContext = useMouseClickItemDispatch(onItemClickFromProps, dataKey, id);
  if (!data) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, data.map((entry, i) => {
    return /* @__PURE__ */ reactExports.createElement(BarStackClipLayer, _extends$1({
      index: entry.originalDataIndex,
      key: "rectangle-".concat(entry === null || entry === void 0 ? void 0 : entry.x, "-").concat(entry === null || entry === void 0 ? void 0 : entry.y, "-").concat(entry === null || entry === void 0 ? void 0 : entry.value, "-").concat(i),
      className: "recharts-bar-rectangle"
    }, adaptEventsOfChild(restOfAllOtherProps, entry, i), {
      onMouseEnter: onMouseEnterFromContext(entry, entry.originalDataIndex),
      onMouseLeave: onMouseLeaveFromContext(entry, entry.originalDataIndex),
      onClick: onClickFromContext(entry, entry.originalDataIndex)
    }), activeBar ? /* @__PURE__ */ reactExports.createElement(BarRectangleWithActiveState, {
      shape,
      activeBar,
      baseProps,
      entry,
      index: i,
      dataKey,
      animationElapsedTime,
      isAnimating,
      isEntrance
    }) : (
      /*
       * If the `activeBar` prop is falsy, then let's call the variant without hooks.
       * Using the `selectActiveTooltipIndex` selector is usually fast
       * but in charts with large-ish amount of data even the few nanoseconds add up to a noticeable jank.
       * If the activeBar is false then we don't need to know which index is active - because we won't use it anyway.
       * So let's just skip the hooks altogether. That way, React can skip rendering the component,
       * and can skip the tree reconciliation for its children too.
       * Because we can't call hooks conditionally, we need to have a separate component for that.
       */
      /* @__PURE__ */ reactExports.createElement(BarRectangleNeverActive, {
        shape,
        baseProps,
        entry,
        index: i,
        dataKey,
        animationElapsedTime,
        isAnimating,
        isEntrance
      })
    ));
  }));
}
var defaultBarAnimateItems = (items, animationElapsedTime, layout) => {
  if (items == null) return [];
  if (animationElapsedTime === 1) {
    return items.flatMap((item) => item.status === "removed" ? [] : [item.next]);
  }
  return items.flatMap((item) => {
    if (item.status === "removed") {
      if (layout === "horizontal") {
        return [_objectSpread$1(_objectSpread$1({}, item.prev), {}, {
          height: interpolate(item.prev.height, 0, animationElapsedTime),
          y: interpolate(item.prev.y, item.prev.y + item.prev.height, animationElapsedTime)
        })];
      }
      return [_objectSpread$1(_objectSpread$1({}, item.prev), {}, {
        width: interpolate(item.prev.width, 0, animationElapsedTime)
      })];
    }
    if (item.status === "matched") {
      return [_objectSpread$1(_objectSpread$1({}, item.next), {}, {
        x: interpolate(item.prev.x, item.next.x, animationElapsedTime),
        y: interpolate(item.prev.y, item.next.y, animationElapsedTime),
        width: interpolate(item.prev.width, item.next.width, animationElapsedTime),
        height: interpolate(item.prev.height, item.next.height, animationElapsedTime)
      })];
    }
    var next = item.next;
    if (layout === "horizontal") {
      return [_objectSpread$1(_objectSpread$1({}, next), {}, {
        height: interpolate(0, next.height, animationElapsedTime),
        y: interpolate(next.stackedBarStart, next.y, animationElapsedTime)
      })];
    }
    return [_objectSpread$1(_objectSpread$1({}, next), {}, {
      width: interpolate(0, next.width, animationElapsedTime),
      x: interpolate(next.stackedBarStart, next.x, animationElapsedTime)
    })];
  });
};
function RectanglesWithAnimation(_ref5) {
  var props = _ref5.props, previousRectanglesRef = _ref5.previousRectanglesRef;
  var data = props.data, isAnimationActive = props.isAnimationActive, animationBegin = props.animationBegin, animationDuration = props.animationDuration, animationEasing = props.animationEasing, animationInterpolateFn = props.animationInterpolateFn, layout = props.layout;
  var _useAnimationCallback = useAnimationCallbacks(props.onAnimationStart, props.onAnimationEnd), isAnimating = _useAnimationCallback.isAnimating, handleAnimationStart = _useAnimationCallback.handleAnimationStart, handleAnimationEnd = _useAnimationCallback.handleAnimationEnd;
  return /* @__PURE__ */ reactExports.createElement(BarLabelListProvider, {
    showLabels: !isAnimating,
    rects: data
  }, /* @__PURE__ */ reactExports.createElement(AnimatedItems, {
    animationInput: data,
    animationIdPrefix: "recharts-bar-",
    items: data,
    previousItemsRef: previousRectanglesRef,
    isAnimationActive,
    animationBegin,
    animationDuration,
    animationEasing,
    onAnimationStart: handleAnimationStart,
    onAnimationEnd: handleAnimationEnd,
    animationInterpolateFn,
    animationMatchBy: props.animationMatchBy,
    layout
  }, (stepData, animationElapsedTime, isEntrance) => /* @__PURE__ */ reactExports.createElement(Layer, null, /* @__PURE__ */ reactExports.createElement(BarRectangles, {
    props,
    data: stepData,
    animationElapsedTime,
    isAnimating: isAnimating || animationElapsedTime < 1,
    isEntrance
  }))), /* @__PURE__ */ reactExports.createElement(LabelListFromLabelProp, {
    label: props.label
  }), props.children);
}
function RenderRectangles(props) {
  var previousRectanglesRef = reactExports.useRef(null);
  return /* @__PURE__ */ reactExports.createElement(RectanglesWithAnimation, {
    previousRectanglesRef,
    props
  });
}
var defaultMinPointSize = 0;
var errorBarDataPointFormatter = (dataPoint, dataKey) => {
  var value = Array.isArray(dataPoint.value) ? dataPoint.value[1] : dataPoint.value;
  return {
    x: dataPoint.x,
    y: dataPoint.y,
    value,
    // getValueByDataKey does not validate the output type
    errorVal: getValueByDataKey(dataPoint, dataKey)
  };
};
class BarWithState extends reactExports.PureComponent {
  render() {
    var _this$props = this.props, hide = _this$props.hide, data = _this$props.data, dataKey = _this$props.dataKey, className = _this$props.className, xAxisId = _this$props.xAxisId, yAxisId = _this$props.yAxisId, needClip = _this$props.needClip, background = _this$props.background, id = _this$props.id;
    if (hide || data == null) {
      return null;
    }
    var layerClass = clsx("recharts-bar", className);
    var clipPathId = id;
    return /* @__PURE__ */ reactExports.createElement(Layer, {
      className: layerClass,
      id
    }, needClip && /* @__PURE__ */ reactExports.createElement("defs", null, /* @__PURE__ */ reactExports.createElement(GraphicalItemClipPath, {
      clipPathId,
      xAxisId,
      yAxisId
    })), /* @__PURE__ */ reactExports.createElement(Layer, {
      className: "recharts-bar-rectangles",
      clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : void 0
    }, /* @__PURE__ */ reactExports.createElement(BarBackground, {
      data,
      dataKey,
      background,
      allOtherBarProps: this.props
    }), /* @__PURE__ */ reactExports.createElement(RenderRectangles, this.props)));
  }
}
var defaultBarProps = {
  activeBar: false,
  animationBegin: 0,
  animationDuration: 400,
  animationEasing: "ease",
  animationInterpolateFn: defaultBarAnimateItems,
  animationMatchBy: matchAppend,
  background: false,
  hide: false,
  isAnimationActive: "auto",
  label: false,
  legendType: "rect",
  minPointSize: defaultMinPointSize,
  shape: defaultBarShape,
  xAxisId: 0,
  yAxisId: 0,
  zIndex: DefaultZIndexes.bar
};
function BarImpl(props) {
  var xAxisId = props.xAxisId, yAxisId = props.yAxisId, hide = props.hide, legendType = props.legendType, minPointSize = props.minPointSize, activeBar = props.activeBar, animationBegin = props.animationBegin, animationDuration = props.animationDuration, animationEasing = props.animationEasing, isAnimationActive = props.isAnimationActive;
  var _useNeedsClip = useNeedsClip(xAxisId, yAxisId), needClip = _useNeedsClip.needClip;
  var layout = useChartLayout();
  var isPanorama = useIsPanorama();
  var cells = findAllByType(props.children, Cell);
  var rects = useAppSelector((state) => selectBarRectangles(state, props.id, isPanorama, cells));
  if (layout !== "vertical" && layout !== "horizontal") {
    return null;
  }
  var errorBarOffset;
  var firstDataPoint = rects === null || rects === void 0 ? void 0 : rects[0];
  if (firstDataPoint == null || firstDataPoint.height == null || firstDataPoint.width == null) {
    errorBarOffset = 0;
  } else {
    errorBarOffset = layout === "vertical" ? firstDataPoint.height / 2 : firstDataPoint.width / 2;
  }
  return /* @__PURE__ */ reactExports.createElement(SetErrorBarContext, {
    xAxisId,
    yAxisId,
    data: rects,
    dataPointFormatter: errorBarDataPointFormatter,
    errorBarOffset
  }, /* @__PURE__ */ reactExports.createElement(BarWithState, _extends$1({}, props, {
    layout,
    needClip,
    data: rects,
    xAxisId,
    yAxisId,
    hide,
    legendType,
    minPointSize,
    activeBar,
    animationBegin,
    animationDuration,
    animationEasing,
    isAnimationActive
  })));
}
function computeBarRectangles(_ref6) {
  var layout = _ref6.layout, _ref6$barSettings = _ref6.barSettings, dataKey = _ref6$barSettings.dataKey, minPointSizeProp = _ref6$barSettings.minPointSize, hasCustomShape = _ref6$barSettings.hasCustomShape, pos = _ref6.pos, bandSize = _ref6.bandSize, xAxis = _ref6.xAxis, yAxis = _ref6.yAxis, xAxisTicks = _ref6.xAxisTicks, yAxisTicks = _ref6.yAxisTicks, stackedData = _ref6.stackedData, displayedData = _ref6.displayedData, offset = _ref6.offset, cells = _ref6.cells, parentViewBox = _ref6.parentViewBox, dataStartIndex = _ref6.dataStartIndex;
  var numericAxis = layout === "horizontal" ? yAxis : xAxis;
  var stackedDomain = stackedData ? numericAxis.scale.domain() : null;
  var baseValue = getBaseValueOfBar({
    numericAxis
  });
  var stackedBarStart = numericAxis.scale.map(baseValue);
  return displayedData.map((entry, index) => {
    var value, x, y, width, height, background;
    if (stackedData) {
      var untruncatedValue = stackedData[index + dataStartIndex];
      if (untruncatedValue == null) {
        return null;
      }
      value = truncateByDomain(untruncatedValue, stackedDomain);
    } else {
      value = getValueByDataKey(entry, dataKey);
      if (!Array.isArray(value)) {
        value = [baseValue, value];
      }
    }
    var minPointSize = minPointSizeCallback(minPointSizeProp, defaultMinPointSize)(value[1], index);
    if (layout === "horizontal") {
      var _ref7;
      var baseValueScale = yAxis.scale.map(value[0]);
      var currentValueScale = yAxis.scale.map(value[1]);
      if (baseValueScale == null || currentValueScale == null) {
        return null;
      }
      x = getCateCoordinateOfBar({
        axis: xAxis,
        ticks: xAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index
      });
      y = (_ref7 = currentValueScale !== null && currentValueScale !== void 0 ? currentValueScale : baseValueScale) !== null && _ref7 !== void 0 ? _ref7 : void 0;
      width = pos.size;
      var computedHeight = baseValueScale - currentValueScale;
      height = isNan(computedHeight) ? 0 : computedHeight;
      background = {
        x,
        y: offset.top,
        width,
        height: offset.height
      };
      if (Math.abs(minPointSize) > 0 && Math.abs(height) < Math.abs(minPointSize)) {
        var delta = mathSign(height || minPointSize) * (Math.abs(minPointSize) - Math.abs(height));
        y -= delta;
        height += delta;
      }
    } else {
      var _baseValueScale = xAxis.scale.map(value[0]);
      var _currentValueScale = xAxis.scale.map(value[1]);
      if (_baseValueScale == null || _currentValueScale == null) {
        return null;
      }
      x = _baseValueScale;
      y = getCateCoordinateOfBar({
        axis: yAxis,
        ticks: yAxisTicks,
        bandSize,
        offset: pos.offset,
        entry,
        index
      });
      width = _currentValueScale - _baseValueScale;
      height = pos.size;
      background = {
        x: offset.left,
        y,
        width: offset.width,
        height
      };
      if (Math.abs(minPointSize) > 0 && Math.abs(width) < Math.abs(minPointSize)) {
        var _delta = mathSign(width || minPointSize) * (Math.abs(minPointSize) - Math.abs(width));
        width += _delta;
      }
    }
    if (x == null || y == null || width == null || height == null || !hasCustomShape && (width === 0 || height === 0)) {
      return null;
    }
    var barRectangleItem = _objectSpread$1(_objectSpread$1({}, entry), {}, {
      stackedBarStart,
      x,
      y,
      width,
      height,
      value: stackedData ? value : value[1],
      payload: entry,
      background,
      tooltipPosition: {
        x: x + width / 2,
        y: y + height / 2
      },
      parentViewBox,
      originalDataIndex: index
    }, cells && cells[index] && cells[index].props);
    return barRectangleItem;
  }).filter(Boolean);
}
function BarFn(outsideProps) {
  var props = resolveDefaultProps(outsideProps, defaultBarProps);
  var stackId = useStackId(props.stackId);
  var isPanorama = useIsPanorama();
  return /* @__PURE__ */ reactExports.createElement(RegisterGraphicalItemId, {
    id: props.id,
    type: "bar"
  }, (id) => /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(SetLegendPayload, {
    legendPayload: computeLegendPayloadFromBarData(props)
  }), /* @__PURE__ */ reactExports.createElement(SetBarTooltipEntrySettings, {
    dataKey: props.dataKey,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth,
    fill: props.fill,
    name: props.name,
    hide: props.hide,
    unit: props.unit,
    formatter: props.formatter,
    tooltipType: props.tooltipType,
    id
  }), /* @__PURE__ */ reactExports.createElement(SetCartesianGraphicalItem, {
    type: "bar",
    id,
    data: void 0,
    xAxisId: props.xAxisId,
    yAxisId: props.yAxisId,
    zAxisId: 0,
    dataKey: props.dataKey,
    stackId,
    hide: props.hide,
    barSize: props.barSize,
    minPointSize: props.minPointSize,
    maxBarSize: props.maxBarSize,
    isPanorama,
    hasCustomShape: props.shape != null && props.shape !== defaultBarShape
  }), /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
    zIndex: props.zIndex
  }, /* @__PURE__ */ reactExports.createElement(BarImpl, _extends$1({}, props, {
    id
  })))));
}
var Bar = /* @__PURE__ */ reactExports.memo(BarFn, propsAreEqual);
Bar.displayName = "Bar";
var _excluded = ["type"], _excluded2 = ["dangerouslySetInnerHTML", "ticks", "scale"], _excluded3 = ["id", "scale"];
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o, r, i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function SetYAxisSettings(props) {
  var dispatch = useAppDispatch();
  var prevSettingsRef = reactExports.useRef(null);
  var layout = useCartesianChartLayout();
  var typeFromProps = props.type, restProps = _objectWithoutProperties(props, _excluded);
  var evaluatedType = getAxisTypeBasedOnLayout(layout, "yAxis", typeFromProps);
  var settings = reactExports.useMemo(() => {
    if (evaluatedType == null) {
      return void 0;
    }
    return _objectSpread(_objectSpread({}, restProps), {}, {
      type: evaluatedType
    });
  }, [evaluatedType, restProps]);
  reactExports.useLayoutEffect(() => {
    if (settings == null) {
      return;
    }
    if (prevSettingsRef.current === null) {
      dispatch(addYAxis(settings));
    } else if (prevSettingsRef.current !== settings) {
      dispatch(replaceYAxis({
        prev: prevSettingsRef.current,
        next: settings
      }));
    }
    prevSettingsRef.current = settings;
  }, [settings, dispatch]);
  reactExports.useLayoutEffect(() => {
    return () => {
      if (prevSettingsRef.current) {
        dispatch(removeYAxis(prevSettingsRef.current));
        prevSettingsRef.current = null;
      }
    };
  }, [dispatch]);
  return null;
}
function YAxisImpl(props) {
  var yAxisId = props.yAxisId, className = props.className, width = props.width, label = props.label;
  var cartesianAxisRef = reactExports.useRef(null);
  var labelRef = reactExports.useRef(null);
  var viewBox = useAppSelector(selectAxisViewBox);
  var isPanorama = useIsPanorama();
  var dispatch = useAppDispatch();
  var axisType = "yAxis";
  var axisSize = useAppSelector((state) => selectYAxisSize(state, yAxisId));
  var position = useAppSelector((state) => selectYAxisPosition(state, yAxisId));
  var cartesianTickItems = useAppSelector((state) => selectTicksOfAxis(state, axisType, yAxisId, isPanorama));
  var synchronizedSettings = useAppSelector((state) => selectYAxisSettingsNoDefaults(state, yAxisId));
  reactExports.useLayoutEffect(() => {
    if (width !== "auto" || !axisSize || isLabelContentAFunction(label) || /* @__PURE__ */ reactExports.isValidElement(label) || synchronizedSettings == null) {
      return;
    }
    var axisComponent = cartesianAxisRef.current;
    if (!axisComponent) {
      return;
    }
    var updatedYAxisWidth = axisComponent.getCalculatedWidth();
    if (Math.round(axisSize.width) !== Math.round(updatedYAxisWidth)) {
      dispatch(updateYAxisWidth({
        id: yAxisId,
        width: updatedYAxisWidth
      }));
    }
  }, [
    // The dependency on cartesianAxisRef.current is not needed because useLayoutEffect will run after every render.
    // The ref will be populated by then.
    // To re-run this effect when ticks change, we can depend on the ticks array from the store.
    cartesianTickItems,
    axisSize,
    dispatch,
    label,
    yAxisId,
    width,
    synchronizedSettings
  ]);
  if (axisSize == null || position == null || synchronizedSettings == null) {
    return null;
  }
  props.dangerouslySetInnerHTML;
  props.ticks;
  props.scale;
  var allOtherProps = _objectWithoutProperties(props, _excluded2);
  synchronizedSettings.id;
  synchronizedSettings.scale;
  var restSynchronizedSettings = _objectWithoutProperties(synchronizedSettings, _excluded3);
  return /* @__PURE__ */ reactExports.createElement(CartesianAxis, _extends({}, allOtherProps, restSynchronizedSettings, {
    ref: cartesianAxisRef,
    labelRef,
    x: position.x,
    y: position.y,
    tickTextProps: width === "auto" ? {
      width: void 0
    } : {
      width
    },
    width: axisSize.width,
    height: axisSize.height,
    className: clsx("recharts-".concat(axisType, " ").concat(axisType), className),
    viewBox,
    ticks: cartesianTickItems,
    axisType,
    axisId: yAxisId
  }));
}
var yAxisDefaultProps = {
  allowDataOverflow: implicitYAxis.allowDataOverflow,
  allowDecimals: implicitYAxis.allowDecimals,
  allowDuplicatedCategory: implicitYAxis.allowDuplicatedCategory,
  angle: implicitYAxis.angle,
  axisLine: defaultCartesianAxisProps.axisLine,
  hide: false,
  includeHidden: implicitYAxis.includeHidden,
  interval: implicitYAxis.interval,
  label: false,
  minTickGap: implicitYAxis.minTickGap,
  mirror: implicitYAxis.mirror,
  orientation: implicitYAxis.orientation,
  padding: implicitYAxis.padding,
  reversed: implicitYAxis.reversed,
  scale: implicitYAxis.scale,
  tick: implicitYAxis.tick,
  tickCount: implicitYAxis.tickCount,
  tickLine: defaultCartesianAxisProps.tickLine,
  tickSize: defaultCartesianAxisProps.tickSize,
  type: implicitYAxis.type,
  niceTicks: implicitYAxis.niceTicks,
  width: implicitYAxis.width,
  yAxisId: 0
};
var YAxisSettingsDispatcher = (outsideProps) => {
  var props = resolveDefaultProps(outsideProps, yAxisDefaultProps);
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(SetYAxisSettings, {
    interval: props.interval,
    id: props.yAxisId,
    scale: props.scale,
    type: props.type,
    domain: props.domain,
    allowDataOverflow: props.allowDataOverflow,
    dataKey: props.dataKey,
    allowDuplicatedCategory: props.allowDuplicatedCategory,
    allowDecimals: props.allowDecimals,
    tickCount: props.tickCount,
    padding: props.padding,
    includeHidden: props.includeHidden,
    reversed: props.reversed,
    ticks: props.ticks,
    width: props.width,
    orientation: props.orientation,
    mirror: props.mirror,
    hide: props.hide,
    unit: props.unit,
    name: props.name,
    angle: props.angle,
    minTickGap: props.minTickGap,
    tick: props.tick,
    tickFormatter: props.tickFormatter,
    niceTicks: props.niceTicks
  }), /* @__PURE__ */ reactExports.createElement(YAxisImpl, props));
};
var YAxis = /* @__PURE__ */ reactExports.memo(YAxisSettingsDispatcher, axisPropsAreEqual);
YAxis.displayName = "YAxis";
var allowedTooltipTypes = ["axis", "item"];
var BarChart = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  return /* @__PURE__ */ reactExports.createElement(CartesianChart, {
    chartName: "BarChart",
    defaultTooltipEventType: "axis",
    validateTooltipEventTypes: allowedTooltipTypes,
    tooltipPayloadSearcher: arrayTooltipSearcher,
    categoricalChartProps: props,
    ref
  });
});
export {
  BarChart as B,
  Cell as C,
  YAxis as Y,
  useMouseLeaveItemDispatch as a,
  useMouseClickItemDispatch as b,
  Bar as c,
  useMouseEnterItemDispatch as u
};
