import { c as createLucideIcon, aF as clsx, r as reactExports, j as jsxRuntimeExports, g as useSettings, aG as TrendingDown, T as TriangleAlert, m as Badge, ao as CreditCard, s as Package, aH as Shield, o as Clock, q as ChartColumn, ad as Boxes, _ as resolveAvatar } from "./index-CqMtuUke.js";
import { u as useDataChangedRefresh } from "./useDataChangedRefresh-BQRADQai.js";
import { C as Card, c as CardContent } from "./card-B5B59TB7.js";
import { L as Label } from "./label-Cf1pW99b.js";
import { D as DatePicker } from "./DatePicker-Dr3PGhek.js";
import { K as KpiVisibility } from "./kpi-visibility-Cnq1TnVQ.js";
import { i as isNumber, f as adaptEventHandlers, s as svgPropertiesNoEvents, g as createSelector, p as pickAxisType, h as pickAxisId, j as itemAxisPredicate, k as selectBaseAxis, l as combineGraphicalItemsSettings, m as combineGraphicalItemsData, n as selectChartDataAndAlwaysIgnoreIndexes, o as combineDisplayedData, q as combineAppliedValues, r as getValueByDataKey, t as selectAllErrorBarSettings, u as selectChartDataSliceIgnoringIndexes, v as combineDomainOfAllAppliedNumericalValuesIncludingErrorValues, w as selectDomainDefinition, x as selectDomainFromUserPreference, y as selectChartLayout, z as combineNumericalDomain, D as selectStackOffsetType, E as combineAxisDomain, F as selectRenderableAxisSettings, G as selectRealScaleType, H as combineNiceTicks, I as combineAxisDomainWithNiceTicks, J as combineCheckedDomain, K as getTooltipNameProp, L as selectChartOffsetInternal, M as resolveDefaultProps, N as DefaultZIndexes, S as Sector, O as matchAppend, R as RegisterGraphicalItemId, P as SetPolarGraphicalItem, Q as get, T as interpolate, U as findAllByType, V as useAppSelector, W as SetPolarLegendPayload, Z as Layer, _ as ZIndexLayer, e as Cell, $ as SetTooltipEntrySettings, a0 as useAnimationCallbacks, a1 as usePolarChartLayout, a2 as AnimatedItems, a3 as PolarLabelContextProvider, a4 as mathSign, a5 as PolarLabelListContextProvider, a6 as selectActiveTooltipIndex, a7 as selectActiveTooltipDataKey, a8 as selectActiveTooltipGraphicalItemId, a9 as useMouseEnterItemDispatch, aa as useMouseLeaveItemDispatch, ab as useMouseClickItemDispatch, ac as DATA_ITEM_GRAPHICAL_ITEM_ID_ATTRIBUTE_NAME, ad as DATA_ITEM_INDEX_ATTRIBUTE_NAME, ae as adaptEventsOfChild, af as Shape, ag as LabelListFromLabelProp, ah as getMaxRadius, ai as getPercentValue, aj as polarToCartesian, ak as svgPropertiesNoEventsFromUnknown, al as Curve, am as getClassNameFromUnknown, an as Text, ao as isClipDot, ap as svgPropertiesAndEventsFromUnknown, aq as useActiveTooltipDataPoints, ar as isNullish, as as selectChartDataWithIndexesIfNotInPanoramaPosition3, at as selectChartBaseValue, au as selectAxisWithScale, av as selectXAxisIdFromGraphicalItemId, aw as selectYAxisIdFromGraphicalItemId, ax as selectTicksOfGraphicalItem, ay as getStackSeriesIdentifier, az as isCategoricalAxis, aA as getBandSizeOfAxis, aB as selectUnfilteredCartesianItems, aC as isNotNil, aD as selectStackGroups, aE as useId, aF as isWellBehavedNumber, aG as propsAreEqual, aH as matchByIndex, aI as useIsPanorama, aJ as SetLegendPayload, aK as SetCartesianGraphicalItem, aL as getNormalizedStackId, aM as noop, aN as useChartLayout, aO as useChartName, aP as useNeedsClip, aQ as usePlotArea, aR as GraphicalItemClipPath, aS as getCateCoordinateOfLine, aT as useAnimationStartSnapshot, aU as useCartesianChartLayout, aV as matchAnimationItems, aW as CartesianLabelListContextProvider, aX as svgPropertiesAndEvents, aY as isNan, aZ as useAppDispatch, a_ as updatePolarOptions, a$ as RechartsStoreProvider, b0 as ChartDataContextProvider, b1 as ReportMainChartProps, b2 as ReportEventSettings, b3 as ReportChartProps, b4 as CategoricalChart, b5 as initialEventSettingsState, b6 as arrayTooltipSearcher, b7 as CartesianChart, C as ChartContainer, b8 as Tooltip, c as ChartTooltipContent, b9 as ResponsiveContainer, a as CartesianGrid, X as XAxis, Y as YAxis, B as BarChart, d as Bar, A as Activity } from "./chart-BVBkvXun.js";
import { C as Calendar } from "./calendar-Ca68cJ6x.js";
import { T as TrendingUp } from "./trending-up-Co1HEDW7.js";
import { D as DollarSign } from "./dollar-sign-BqR9HoKF.js";
import { Z as Zap } from "./zap-D34YHcWw.js";
import { B as Banknote } from "./banknote-CcpJx6pJ.js";
import { A as ArrowRightLeft } from "./arrow-right-left-CqskM9kN.js";
import "./select-DbRJaTXm.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowUpRight = createLucideIcon("ArrowUpRight", [
  ["path", { d: "M7 7h10v10", key: "1tivn9" }],
  ["path", { d: "M7 17 17 7", key: "1vkiza" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ChartPie = createLucideIcon("ChartPie", [
  [
    "path",
    {
      d: "M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z",
      key: "pzmjnu"
    }
  ],
  ["path", { d: "M21.21 15.89A10 10 0 1 1 8 2.83", key: "k2fpak" }]
]);
function _extends$5() {
  return _extends$5 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$5.apply(null, arguments);
}
var Dot = (props) => {
  var cx = props.cx, cy = props.cy, r = props.r, className = props.className;
  var layerClass = clsx("recharts-dot", className);
  if (isNumber(cx) && isNumber(cy) && isNumber(r)) {
    return /* @__PURE__ */ reactExports.createElement("circle", _extends$5({}, svgPropertiesNoEvents(props), adaptEventHandlers(props), {
      className: layerClass,
      cx,
      cy,
      r
    }));
  }
  return null;
};
var selectUnfilteredPolarItems = (state) => state.graphicalItems.polarItems;
var selectAxisPredicate = createSelector([pickAxisType, pickAxisId], itemAxisPredicate);
var selectPolarItemsSettings = createSelector([selectUnfilteredPolarItems, selectBaseAxis, selectAxisPredicate], combineGraphicalItemsSettings);
var selectPolarGraphicalItemsData = createSelector([selectPolarItemsSettings], combineGraphicalItemsData);
var selectPolarDisplayedData = createSelector([selectPolarGraphicalItemsData, selectChartDataAndAlwaysIgnoreIndexes], combineDisplayedData);
var selectPolarAppliedValues = createSelector([selectPolarDisplayedData, selectBaseAxis, selectPolarItemsSettings], combineAppliedValues);
createSelector([selectPolarDisplayedData, selectBaseAxis, selectPolarItemsSettings], (data, axisSettings, items) => {
  if (items.length > 0) {
    return data.flatMap((entry) => {
      return items.flatMap((item) => {
        var _axisSettings$dataKey;
        var valueByDataKey = getValueByDataKey(entry, (_axisSettings$dataKey = axisSettings.dataKey) !== null && _axisSettings$dataKey !== void 0 ? _axisSettings$dataKey : item.dataKey);
        return {
          value: valueByDataKey,
          errorDomain: []
          // polar charts do not have error bars
        };
      });
    }).filter(Boolean);
  }
  if ((axisSettings === null || axisSettings === void 0 ? void 0 : axisSettings.dataKey) != null) {
    return data.map((item) => ({
      value: getValueByDataKey(item, axisSettings.dataKey),
      errorDomain: []
    }));
  }
  return data.map((entry) => ({
    value: entry,
    errorDomain: []
  }));
});
var unsupportedInPolarChart = () => void 0;
var selectDomainOfAllPolarAppliedNumericalValues = createSelector([selectPolarDisplayedData, selectBaseAxis, selectPolarItemsSettings, selectAllErrorBarSettings, pickAxisType, selectChartDataSliceIgnoringIndexes], combineDomainOfAllAppliedNumericalValuesIncludingErrorValues);
var selectPolarNumericalDomain = createSelector([selectBaseAxis, selectDomainDefinition, selectDomainFromUserPreference, unsupportedInPolarChart, selectDomainOfAllPolarAppliedNumericalValues, unsupportedInPolarChart, selectChartLayout, pickAxisType], combineNumericalDomain);
var selectPolarAxisDomain = createSelector([selectBaseAxis, selectChartLayout, selectPolarDisplayedData, selectPolarAppliedValues, selectStackOffsetType, pickAxisType, selectPolarNumericalDomain], combineAxisDomain);
var selectPolarNiceTicks = createSelector([selectPolarAxisDomain, selectRenderableAxisSettings, selectRealScaleType], combineNiceTicks);
var selectPolarAxisDomainIncludingNiceTicks = createSelector([selectBaseAxis, selectPolarAxisDomain, selectPolarNiceTicks, pickAxisType], combineAxisDomainWithNiceTicks);
createSelector([selectRealScaleType, selectPolarAxisDomainIncludingNiceTicks], combineCheckedDomain);
function ownKeys$6(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$6(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$6(Object(t), true).forEach(function(r2) {
      _defineProperty$6(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$6(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$6(e, r, t) {
  return (r = _toPropertyKey$6(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$6(t) {
  var i = _toPrimitive$6(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$6(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var pickId = (_state, id) => id;
var selectSynchronisedPieSettings = createSelector([selectUnfilteredPolarItems, pickId], (graphicalItems, id) => graphicalItems.filter((item) => item.type === "pie").find((item) => item.id === id));
var emptyArray = [];
var pickCells = (_state, _id, cells) => {
  if ((cells === null || cells === void 0 ? void 0 : cells.length) === 0) {
    return emptyArray;
  }
  return cells;
};
var selectDisplayedData = createSelector([selectChartDataAndAlwaysIgnoreIndexes, selectSynchronisedPieSettings, pickCells], (_ref, pieSettings, cells) => {
  var chartData = _ref.chartData;
  if (pieSettings == null) {
    return void 0;
  }
  var displayedData;
  if ((pieSettings === null || pieSettings === void 0 ? void 0 : pieSettings.data) != null && pieSettings.data.length > 0) {
    displayedData = pieSettings.data;
  } else {
    displayedData = chartData;
  }
  if ((!displayedData || !displayedData.length) && cells != null) {
    displayedData = cells.map((cell) => _objectSpread$6(_objectSpread$6({}, pieSettings.presentationProps), cell.props));
  }
  if (displayedData == null) {
    return void 0;
  }
  return displayedData;
});
var selectPieLegend = createSelector([selectDisplayedData, selectSynchronisedPieSettings, pickCells], (displayedData, pieSettings, cells) => {
  if (displayedData == null || pieSettings == null) {
    return void 0;
  }
  return displayedData.map((entry, i) => {
    var _cells$i;
    var name = getValueByDataKey(entry, pieSettings.nameKey, pieSettings.name);
    var color;
    if (cells !== null && cells !== void 0 && (_cells$i = cells[i]) !== null && _cells$i !== void 0 && (_cells$i = _cells$i.props) !== null && _cells$i !== void 0 && _cells$i.fill) {
      color = cells[i].props.fill;
    } else if (typeof entry === "object" && entry != null && "fill" in entry) {
      color = entry.fill;
    } else {
      color = pieSettings.fill;
    }
    return {
      value: getTooltipNameProp(name, pieSettings.dataKey),
      dataKey: pieSettings.dataKey,
      color,
      // @ts-expect-error Legend payload.payload says it wants objects but our data can be unknown
      payload: entry,
      type: pieSettings.legendType
    };
  });
});
var selectPieSectors = createSelector([selectDisplayedData, selectSynchronisedPieSettings, pickCells, selectChartOffsetInternal], (displayedData, pieSettings, cells, offset) => {
  if (pieSettings == null || displayedData == null) {
    return void 0;
  }
  return computePieSectors({
    offset,
    pieSettings,
    displayedData,
    cells
  });
});
var _excluded$4 = ["key"], _excluded2$2 = ["onMouseEnter", "onClick", "onMouseLeave"], _excluded3 = ["id"], _excluded4 = ["id"];
function _extends$4() {
  return _extends$4 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$4.apply(null, arguments);
}
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
function ownKeys$5(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$5(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$5(Object(t), true).forEach(function(r2) {
      _defineProperty$5(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$5(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$5(e, r, t) {
  return (r = _toPropertyKey$5(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$5(t) {
  var i = _toPrimitive$5(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$5(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var defaultPieSectorShape = Sector;
function SetPiePayloadLegend(props) {
  var cells = reactExports.useMemo(() => findAllByType(props.children, Cell), [props.children]);
  var legendPayload = useAppSelector((state) => selectPieLegend(state, props.id, cells));
  if (legendPayload == null) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(SetPolarLegendPayload, {
    legendPayload
  });
}
function getActiveShapeFill(activeShape) {
  if (activeShape == null || typeof activeShape === "boolean" || typeof activeShape === "function") {
    return void 0;
  }
  if (/* @__PURE__ */ reactExports.isValidElement(activeShape)) {
    var _activeShape$props;
    var _fill = (_activeShape$props = activeShape.props) === null || _activeShape$props === void 0 ? void 0 : _activeShape$props.fill;
    return typeof _fill === "string" ? _fill : void 0;
  }
  var fill = activeShape.fill;
  return typeof fill === "string" ? fill : void 0;
}
var SetPieTooltipEntrySettings = /* @__PURE__ */ reactExports.memo((_ref) => {
  var dataKey = _ref.dataKey, nameKey = _ref.nameKey, sectors = _ref.sectors, stroke = _ref.stroke, strokeWidth = _ref.strokeWidth, fill = _ref.fill, name = _ref.name, hide = _ref.hide, tooltipType = _ref.tooltipType, formatter = _ref.formatter, id = _ref.id, activeShape = _ref.activeShape;
  var activeShapeFill = getActiveShapeFill(activeShape);
  var tooltipDataDefinedOnItem = sectors.map((sector) => {
    var sectorTooltipPayload = sector.tooltipPayload;
    if (activeShapeFill == null || sectorTooltipPayload == null) {
      return sectorTooltipPayload;
    }
    return sectorTooltipPayload.map((item) => _objectSpread$5(_objectSpread$5({}, item), {}, {
      color: activeShapeFill,
      fill: activeShapeFill
    }));
  });
  var tooltipEntrySettings = {
    dataDefinedOnItem: tooltipDataDefinedOnItem,
    getPosition: (index) => {
      var _sectors$Number;
      return (_sectors$Number = sectors[Number(index)]) === null || _sectors$Number === void 0 ? void 0 : _sectors$Number.tooltipPosition;
    },
    settings: {
      stroke,
      strokeWidth,
      fill,
      dataKey,
      nameKey,
      name: getTooltipNameProp(name, dataKey),
      hide,
      type: tooltipType,
      color: fill,
      unit: "",
      // why doesn't Pie support unit?
      formatter,
      graphicalItemId: id
    }
  };
  return /* @__PURE__ */ reactExports.createElement(SetTooltipEntrySettings, {
    tooltipEntrySettings
  });
});
var getTextAnchor = (x, cx) => {
  if (x > cx) {
    return "start";
  }
  if (x < cx) {
    return "end";
  }
  return "middle";
};
var getOuterRadius = (dataPoint, outerRadius, maxPieRadius) => {
  if (typeof outerRadius === "function") {
    return getPercentValue(outerRadius(dataPoint), maxPieRadius, maxPieRadius * 0.8);
  }
  return getPercentValue(outerRadius, maxPieRadius, maxPieRadius * 0.8);
};
var parseCoordinateOfPie = (pieSettings, offset, dataPoint) => {
  var top = offset.top, left = offset.left, width = offset.width, height = offset.height;
  var maxPieRadius = getMaxRadius(width, height);
  var cx = left + getPercentValue(pieSettings.cx, width, width / 2);
  var cy = top + getPercentValue(pieSettings.cy, height, height / 2);
  var innerRadius = getPercentValue(pieSettings.innerRadius, maxPieRadius, 0);
  var outerRadius = getOuterRadius(dataPoint, pieSettings.outerRadius, maxPieRadius);
  var maxRadius = pieSettings.maxRadius || Math.sqrt(width * width + height * height) / 2;
  return {
    cx,
    cy,
    innerRadius,
    outerRadius,
    maxRadius
  };
};
var parseDeltaAngle = (startAngle, endAngle) => {
  var sign = mathSign(endAngle - startAngle);
  var deltaAngle = Math.min(Math.abs(endAngle - startAngle), 360);
  return sign * deltaAngle;
};
var renderLabelLineItem = (option, props) => {
  if (/* @__PURE__ */ reactExports.isValidElement(option)) {
    return /* @__PURE__ */ reactExports.cloneElement(option, props);
  }
  if (typeof option === "function") {
    return option(props);
  }
  var className = clsx("recharts-pie-label-line", typeof option !== "boolean" ? option.className : "");
  props.key;
  var otherProps = _objectWithoutProperties$4(props, _excluded$4);
  return /* @__PURE__ */ reactExports.createElement(Curve, _extends$4({}, otherProps, {
    type: "linear",
    className
  }));
};
var renderLabelItem = (option, props, value) => {
  if (/* @__PURE__ */ reactExports.isValidElement(option)) {
    return /* @__PURE__ */ reactExports.cloneElement(option, props);
  }
  var label = value;
  if (typeof option === "function") {
    label = option(props);
    if (/* @__PURE__ */ reactExports.isValidElement(label)) {
      return label;
    }
  }
  var className = clsx("recharts-pie-label-text", getClassNameFromUnknown(option));
  return /* @__PURE__ */ reactExports.createElement(Text, _extends$4({}, props, {
    alignmentBaseline: "middle",
    className
  }), label);
};
function PieLabels(_ref2) {
  var sectors = _ref2.sectors, props = _ref2.props, showLabels = _ref2.showLabels;
  var label = props.label, labelLine = props.labelLine, dataKey = props.dataKey;
  if (!showLabels || !label || !sectors) {
    return null;
  }
  var pieProps = svgPropertiesNoEvents(props);
  var customLabelProps = svgPropertiesNoEventsFromUnknown(label);
  var customLabelLineProps = svgPropertiesNoEventsFromUnknown(labelLine);
  var offsetRadius = typeof label === "object" && "offsetRadius" in label && typeof label.offsetRadius === "number" && label.offsetRadius || 20;
  var labels = sectors.map((entry, i) => {
    var midAngle = (entry.startAngle + entry.endAngle) / 2;
    var endPoint = polarToCartesian(entry.cx, entry.cy, entry.outerRadius + offsetRadius, midAngle);
    var labelProps = _objectSpread$5(_objectSpread$5(_objectSpread$5(_objectSpread$5({}, pieProps), entry), {}, {
      // @ts-expect-error customLabelProps is contributing unknown props
      stroke: "none"
    }, customLabelProps), {}, {
      index: i,
      textAnchor: getTextAnchor(endPoint.x, entry.cx)
    }, endPoint);
    var lineProps = _objectSpread$5(_objectSpread$5(_objectSpread$5(_objectSpread$5({}, pieProps), entry), {}, {
      // @ts-expect-error customLabelLineProps is contributing unknown props
      fill: "none",
      // @ts-expect-error customLabelLineProps is contributing unknown props
      stroke: entry.fill
    }, customLabelLineProps), {}, {
      index: i,
      points: [polarToCartesian(entry.cx, entry.cy, entry.outerRadius, midAngle), endPoint],
      key: "line"
    });
    return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
      zIndex: DefaultZIndexes.label,
      key: "label-".concat(entry.startAngle, "-").concat(entry.endAngle, "-").concat(entry.midAngle, "-").concat(i)
    }, /* @__PURE__ */ reactExports.createElement(Layer, null, labelLine && renderLabelLineItem(labelLine, lineProps), renderLabelItem(label, labelProps, getValueByDataKey(entry, dataKey))));
  });
  return /* @__PURE__ */ reactExports.createElement(Layer, {
    className: "recharts-pie-labels"
  }, labels);
}
function PieLabelList(_ref3) {
  var sectors = _ref3.sectors, props = _ref3.props, showLabels = _ref3.showLabels;
  var label = props.label;
  if (typeof label === "object" && label != null && "position" in label) {
    return /* @__PURE__ */ reactExports.createElement(LabelListFromLabelProp, {
      label
    });
  }
  return /* @__PURE__ */ reactExports.createElement(PieLabels, {
    sectors,
    props,
    showLabels
  });
}
function PieSectors(props) {
  var sectors = props.sectors, activeShape = props.activeShape, inactiveShapeProp = props.inactiveShape, allOtherPieProps = props.allOtherPieProps, shape = props.shape, id = props.id, animationElapsedTime = props.animationElapsedTime, isAnimating = props.isAnimating, isEntrance = props.isEntrance;
  var activeIndex = useAppSelector(selectActiveTooltipIndex);
  var activeDataKey = useAppSelector(selectActiveTooltipDataKey);
  var activeGraphicalItemId = useAppSelector(selectActiveTooltipGraphicalItemId);
  var onMouseEnterFromProps = allOtherPieProps.onMouseEnter, onItemClickFromProps = allOtherPieProps.onClick, onMouseLeaveFromProps = allOtherPieProps.onMouseLeave, restOfAllOtherProps = _objectWithoutProperties$4(allOtherPieProps, _excluded2$2);
  var onMouseEnterFromContext = useMouseEnterItemDispatch(onMouseEnterFromProps, allOtherPieProps.dataKey, id);
  var onMouseLeaveFromContext = useMouseLeaveItemDispatch(onMouseLeaveFromProps);
  var onClickFromContext = useMouseClickItemDispatch(onItemClickFromProps, allOtherPieProps.dataKey, id);
  if (sectors == null || sectors.length === 0) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, sectors.map((entry, i) => {
    if ((entry === null || entry === void 0 ? void 0 : entry.startAngle) === 0 && (entry === null || entry === void 0 ? void 0 : entry.endAngle) === 0 && sectors.length !== 1) return null;
    var graphicalItemMatches = activeGraphicalItemId == null || activeGraphicalItemId === id;
    var isActive = String(i) === activeIndex && (activeDataKey == null || allOtherPieProps.dataKey === activeDataKey) && graphicalItemMatches;
    var inactiveShape = activeIndex ? inactiveShapeProp : null;
    var sectorOptions = activeShape && isActive ? activeShape : inactiveShape;
    var sectorProps = _objectSpread$5(_objectSpread$5({}, entry), {}, {
      stroke: entry.stroke,
      tabIndex: -1,
      index: i,
      isActive,
      animationElapsedTime,
      isAnimating,
      isEntrance,
      [DATA_ITEM_INDEX_ATTRIBUTE_NAME]: i,
      [DATA_ITEM_GRAPHICAL_ITEM_ID_ATTRIBUTE_NAME]: id
    });
    return /* @__PURE__ */ reactExports.createElement(Layer, _extends$4({
      key: "sector-".concat(entry === null || entry === void 0 ? void 0 : entry.startAngle, "-").concat(entry === null || entry === void 0 ? void 0 : entry.endAngle, "-").concat(entry.midAngle, "-").concat(i),
      tabIndex: -1,
      className: "recharts-pie-sector"
    }, adaptEventsOfChild(restOfAllOtherProps, entry, i), {
      onMouseEnter: onMouseEnterFromContext(entry, i),
      onMouseLeave: onMouseLeaveFromContext(entry, i),
      onClick: onClickFromContext(entry, i)
    }), /* @__PURE__ */ reactExports.createElement(Shape, {
      option: sectorOptions !== null && sectorOptions !== void 0 ? sectorOptions : shape,
      DefaultShape: defaultPieSectorShape,
      shapeProps: sectorProps
    }));
  }));
}
function computePieSectors(_ref4) {
  var _pieSettings$paddingA;
  var pieSettings = _ref4.pieSettings, displayedData = _ref4.displayedData, cells = _ref4.cells, offset = _ref4.offset;
  var cornerRadius = pieSettings.cornerRadius, startAngle = pieSettings.startAngle, endAngle = pieSettings.endAngle, dataKey = pieSettings.dataKey, nameKey = pieSettings.nameKey, tooltipType = pieSettings.tooltipType;
  var minAngle = Math.abs(pieSettings.minAngle);
  var deltaAngle = parseDeltaAngle(startAngle, endAngle);
  var absDeltaAngle = Math.abs(deltaAngle);
  var paddingAngle = displayedData.length <= 1 ? 0 : (_pieSettings$paddingA = pieSettings.paddingAngle) !== null && _pieSettings$paddingA !== void 0 ? _pieSettings$paddingA : 0;
  var notZeroItemCount = displayedData.filter((entry) => getValueByDataKey(entry, dataKey, 0) !== 0).length;
  var totalPaddingAngle = (absDeltaAngle >= 360 ? notZeroItemCount : notZeroItemCount - 1) * paddingAngle;
  var sum = displayedData.reduce((result, entry) => {
    var val = getValueByDataKey(entry, dataKey, 0);
    return result + (isNumber(val) ? val : 0);
  }, 0);
  var needsMinAngleAdjustment = minAngle > 0 && sum > 0 && displayedData.some((entry) => {
    var val = getValueByDataKey(entry, dataKey, 0);
    var percent = (isNumber(val) ? val : 0) / sum;
    return val !== 0 && percent * absDeltaAngle < minAngle;
  });
  var effectiveMinAngle = needsMinAngleAdjustment ? minAngle : 0;
  var realTotalAngle = absDeltaAngle - notZeroItemCount * effectiveMinAngle - totalPaddingAngle;
  var sectors;
  if (sum > 0) {
    var prev;
    sectors = displayedData.map((entry, i) => {
      var val = getValueByDataKey(entry, dataKey, 0);
      var name = getValueByDataKey(entry, nameKey, i);
      var coordinate = parseCoordinateOfPie(pieSettings, offset, entry);
      var percent = (isNumber(val) ? val : 0) / sum;
      var tempStartAngle;
      var entryWithCellInfo = _objectSpread$5(_objectSpread$5({}, entry), cells && cells[i] && cells[i].props);
      var sectorColor = entryWithCellInfo != null && "fill" in entryWithCellInfo && typeof entryWithCellInfo.fill === "string" ? entryWithCellInfo.fill : pieSettings.fill;
      if (i) {
        tempStartAngle = prev.endAngle + mathSign(deltaAngle) * paddingAngle * (val !== 0 ? 1 : 0);
      } else {
        tempStartAngle = startAngle;
      }
      var tempEndAngle = tempStartAngle + mathSign(deltaAngle) * ((val !== 0 ? effectiveMinAngle : 0) + percent * realTotalAngle);
      var midAngle = (tempStartAngle + tempEndAngle) / 2;
      var middleRadius = (coordinate.innerRadius + coordinate.outerRadius) / 2;
      var tooltipPayload = [{
        name,
        value: val,
        payload: entryWithCellInfo,
        dataKey,
        type: tooltipType,
        color: sectorColor,
        fill: sectorColor,
        graphicalItemId: pieSettings.id
      }];
      var tooltipPosition = polarToCartesian(coordinate.cx, coordinate.cy, middleRadius, midAngle);
      prev = _objectSpread$5(_objectSpread$5(_objectSpread$5(_objectSpread$5({}, pieSettings.presentationProps), {}, {
        percent,
        cornerRadius: typeof cornerRadius === "string" ? parseFloat(cornerRadius) : cornerRadius,
        name,
        tooltipPayload,
        midAngle,
        middleRadius,
        tooltipPosition
      }, entryWithCellInfo), coordinate), {}, {
        value: val,
        dataKey,
        startAngle: tempStartAngle,
        endAngle: tempEndAngle,
        payload: entryWithCellInfo,
        paddingAngle: val !== 0 ? mathSign(deltaAngle) * paddingAngle : 0
      });
      return prev;
    });
  }
  return sectors;
}
function PieLabelListProvider(_ref5) {
  var showLabels = _ref5.showLabels, sectors = _ref5.sectors, children = _ref5.children;
  var labelListEntries = reactExports.useMemo(() => {
    if (!showLabels || !sectors) {
      return [];
    }
    return sectors.map((entry) => ({
      value: entry.value,
      payload: entry.payload,
      clockWise: false,
      parentViewBox: void 0,
      viewBox: {
        cx: entry.cx,
        cy: entry.cy,
        innerRadius: entry.innerRadius,
        outerRadius: entry.outerRadius,
        startAngle: entry.startAngle,
        endAngle: entry.endAngle,
        clockWise: false
      },
      fill: entry.fill
    }));
  }, [sectors, showLabels]);
  return /* @__PURE__ */ reactExports.createElement(PolarLabelListContextProvider, {
    value: showLabels ? labelListEntries : void 0
  }, children);
}
var defaultPieAnimateItems = (items, animationElapsedTime) => {
  if (items == null) return [];
  var stepData = [];
  var firstNonRemoved = items.find((item) => item.status !== "removed");
  var curAngle = firstNonRemoved ? firstNonRemoved.next.startAngle : 0;
  items.forEach((item, index) => {
    if (item.status === "removed") return;
    var paddingAngle = index > 0 ? get(item.next, "paddingAngle", 0) : 0;
    if (item.status === "matched") {
      var angle = interpolate(item.prev.endAngle - item.prev.startAngle, item.next.endAngle - item.next.startAngle, animationElapsedTime);
      var latest = _objectSpread$5(_objectSpread$5({}, item.next), {}, {
        startAngle: curAngle + paddingAngle,
        endAngle: curAngle + angle + paddingAngle
      });
      stepData.push(latest);
      curAngle = latest.endAngle;
    } else {
      var deltaAngle = interpolate(0, item.next.endAngle - item.next.startAngle, animationElapsedTime);
      var _latest = _objectSpread$5(_objectSpread$5({}, item.next), {}, {
        startAngle: curAngle + paddingAngle,
        endAngle: curAngle + deltaAngle + paddingAngle
      });
      stepData.push(_latest);
      curAngle = _latest.endAngle;
    }
  });
  return stepData;
};
function SectorsWithAnimation(_ref6) {
  var _firstSector$cx, _firstSector$cy, _firstSector$innerRad, _firstSector$outerRad;
  var props = _ref6.props, previousSectorsRef = _ref6.previousSectorsRef, id = _ref6.id;
  var sectors = props.sectors, activeShape = props.activeShape, inactiveShape = props.inactiveShape, animationInterpolateFn = props.animationInterpolateFn;
  var _useAnimationCallback = useAnimationCallbacks(props.onAnimationStart, props.onAnimationEnd), isAnimating = _useAnimationCallback.isAnimating, handleAnimationStart = _useAnimationCallback.handleAnimationStart, handleAnimationEnd = _useAnimationCallback.handleAnimationEnd;
  var layout = usePolarChartLayout();
  if (layout == null) return null;
  var firstSector = sectors[0];
  return /* @__PURE__ */ reactExports.createElement(PieLabelListProvider, {
    showLabels: !isAnimating,
    sectors
  }, /* @__PURE__ */ reactExports.createElement(AnimatedItems, {
    animationInput: props,
    animationIdPrefix: "recharts-pie-",
    items: sectors,
    previousItemsRef: previousSectorsRef,
    isAnimationActive: props.isAnimationActive,
    animationBegin: props.animationBegin,
    animationDuration: props.animationDuration,
    animationEasing: props.animationEasing,
    onAnimationStart: handleAnimationStart,
    onAnimationEnd: handleAnimationEnd,
    animationInterpolateFn,
    animationMatchBy: props.animationMatchBy,
    layout
  }, (stepData, animationElapsedTime, isEntrance) => /* @__PURE__ */ reactExports.createElement(Layer, null, /* @__PURE__ */ reactExports.createElement(PieSectors, {
    sectors: stepData,
    activeShape,
    inactiveShape,
    allOtherPieProps: props,
    shape: props.shape,
    id,
    animationElapsedTime,
    isAnimating: isAnimating || animationElapsedTime < 1,
    isEntrance
  }))), /* @__PURE__ */ reactExports.createElement(PieLabelList, {
    showLabels: !isAnimating,
    sectors,
    props
  }), /* @__PURE__ */ reactExports.createElement(PolarLabelContextProvider, {
    cx: (_firstSector$cx = firstSector === null || firstSector === void 0 ? void 0 : firstSector.cx) !== null && _firstSector$cx !== void 0 ? _firstSector$cx : 0,
    cy: (_firstSector$cy = firstSector === null || firstSector === void 0 ? void 0 : firstSector.cy) !== null && _firstSector$cy !== void 0 ? _firstSector$cy : 0,
    innerRadius: (_firstSector$innerRad = firstSector === null || firstSector === void 0 ? void 0 : firstSector.innerRadius) !== null && _firstSector$innerRad !== void 0 ? _firstSector$innerRad : 0,
    outerRadius: (_firstSector$outerRad = firstSector === null || firstSector === void 0 ? void 0 : firstSector.outerRadius) !== null && _firstSector$outerRad !== void 0 ? _firstSector$outerRad : 0,
    startAngle: props.startAngle,
    endAngle: props.endAngle,
    clockWise: false
  }, props.children));
}
var defaultPieProps = {
  animationBegin: 400,
  animationDuration: 1500,
  animationEasing: "ease",
  animationInterpolateFn: defaultPieAnimateItems,
  animationMatchBy: matchAppend,
  cx: "50%",
  cy: "50%",
  dataKey: "value",
  endAngle: 360,
  fill: "#808080",
  hide: false,
  innerRadius: 0,
  isAnimationActive: "auto",
  label: false,
  labelLine: true,
  legendType: "rect",
  minAngle: 0,
  nameKey: "name",
  outerRadius: "80%",
  paddingAngle: 0,
  rootTabIndex: 0,
  shape: defaultPieSectorShape,
  startAngle: 0,
  stroke: "#fff",
  zIndex: DefaultZIndexes.area
};
function PieImpl(props) {
  var id = props.id, propsWithoutId = _objectWithoutProperties$4(props, _excluded3);
  var hide = props.hide, className = props.className, rootTabIndex = props.rootTabIndex;
  var cells = reactExports.useMemo(() => findAllByType(props.children, Cell), [props.children]);
  var sectors = useAppSelector((state) => selectPieSectors(state, id, cells));
  var previousSectorsRef = reactExports.useRef(null);
  var layerClass = clsx("recharts-pie", className);
  if (hide || sectors == null) {
    previousSectorsRef.current = null;
    return /* @__PURE__ */ reactExports.createElement(Layer, {
      tabIndex: rootTabIndex,
      className: layerClass
    });
  }
  return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
    zIndex: props.zIndex
  }, /* @__PURE__ */ reactExports.createElement(SetPieTooltipEntrySettings, {
    dataKey: props.dataKey,
    nameKey: props.nameKey,
    sectors,
    stroke: props.stroke,
    strokeWidth: props.strokeWidth,
    fill: props.fill,
    name: props.name,
    hide: props.hide,
    tooltipType: props.tooltipType,
    formatter: props.formatter,
    id,
    activeShape: props.activeShape
  }), /* @__PURE__ */ reactExports.createElement(Layer, {
    tabIndex: rootTabIndex,
    className: layerClass
  }, /* @__PURE__ */ reactExports.createElement(SectorsWithAnimation, {
    props: _objectSpread$5(_objectSpread$5({}, propsWithoutId), {}, {
      sectors
    }),
    previousSectorsRef,
    id
  })));
}
function PieFn(outsideProps) {
  var props = resolveDefaultProps(outsideProps, defaultPieProps);
  var externalId = props.id, propsWithoutId = _objectWithoutProperties$4(props, _excluded4);
  var presentationProps = svgPropertiesNoEvents(propsWithoutId);
  return /* @__PURE__ */ reactExports.createElement(RegisterGraphicalItemId, {
    id: externalId,
    type: "pie"
  }, (id) => /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(SetPolarGraphicalItem, {
    type: "pie",
    id,
    data: propsWithoutId.data,
    dataKey: propsWithoutId.dataKey,
    hide: propsWithoutId.hide,
    angleAxisId: 0,
    radiusAxisId: 0,
    name: propsWithoutId.name,
    nameKey: propsWithoutId.nameKey,
    tooltipType: propsWithoutId.tooltipType,
    legendType: propsWithoutId.legendType,
    fill: propsWithoutId.fill,
    cx: propsWithoutId.cx,
    cy: propsWithoutId.cy,
    startAngle: propsWithoutId.startAngle,
    endAngle: propsWithoutId.endAngle,
    paddingAngle: propsWithoutId.paddingAngle,
    minAngle: propsWithoutId.minAngle,
    innerRadius: propsWithoutId.innerRadius,
    outerRadius: propsWithoutId.outerRadius,
    cornerRadius: propsWithoutId.cornerRadius,
    presentationProps,
    maxRadius: props.maxRadius
  }), /* @__PURE__ */ reactExports.createElement(SetPiePayloadLegend, _extends$4({}, propsWithoutId, {
    id
  })), /* @__PURE__ */ reactExports.createElement(PieImpl, _extends$4({}, propsWithoutId, {
    id
  }))));
}
var Pie = PieFn;
Pie.displayName = "Pie";
var _excluded$3 = ["points"];
function ownKeys$4(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$4(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$4(Object(t), true).forEach(function(r2) {
      _defineProperty$4(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$4(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$4(e, r, t) {
  return (r = _toPropertyKey$4(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$4(t) {
  var i = _toPrimitive$4(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$4(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _extends$3() {
  return _extends$3 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$3.apply(null, arguments);
}
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
function DotItem(_ref) {
  var option = _ref.option, dotProps = _ref.dotProps, className = _ref.className;
  if (/* @__PURE__ */ reactExports.isValidElement(option)) {
    return /* @__PURE__ */ reactExports.cloneElement(option, dotProps);
  }
  if (typeof option === "function") {
    return option(dotProps);
  }
  var finalClassName = clsx(className, typeof option !== "boolean" ? option.className : "");
  var _ref2 = dotProps !== null && dotProps !== void 0 ? dotProps : {};
  _ref2.points;
  var props = _objectWithoutProperties$3(_ref2, _excluded$3);
  return /* @__PURE__ */ reactExports.createElement(Dot, _extends$3({}, props, {
    className: finalClassName
  }));
}
function shouldRenderDots(points, dot) {
  if (points == null) {
    return false;
  }
  if (dot) {
    return true;
  }
  return points.length === 1;
}
function Dots(_ref3) {
  var points = _ref3.points, dot = _ref3.dot, className = _ref3.className, dotClassName = _ref3.dotClassName, dataKey = _ref3.dataKey, baseProps = _ref3.baseProps, needClip = _ref3.needClip, clipPathId = _ref3.clipPathId, _ref3$zIndex = _ref3.zIndex, zIndex = _ref3$zIndex === void 0 ? DefaultZIndexes.scatter : _ref3$zIndex;
  if (!shouldRenderDots(points, dot)) {
    return null;
  }
  var clipDot = isClipDot(dot);
  var customDotProps = svgPropertiesAndEventsFromUnknown(dot);
  var dots = points.map((entry, i) => {
    var _entry$x, _entry$y;
    var dotProps = _objectSpread$4(_objectSpread$4(_objectSpread$4({
      r: 3
    }, baseProps), customDotProps), {}, {
      index: i,
      cx: (_entry$x = entry.x) !== null && _entry$x !== void 0 ? _entry$x : void 0,
      cy: (_entry$y = entry.y) !== null && _entry$y !== void 0 ? _entry$y : void 0,
      dataKey,
      value: entry.value,
      payload: entry.payload,
      points
    });
    return /* @__PURE__ */ reactExports.createElement(DotItem, {
      key: "dot-".concat(i),
      option: dot,
      dotProps,
      className: dotClassName
    });
  });
  var layerProps = {};
  if (needClip && clipPathId != null) {
    layerProps.clipPath = "url(#clipPath-".concat(clipDot ? "" : "dots-").concat(clipPathId, ")");
  }
  return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
    zIndex
  }, /* @__PURE__ */ reactExports.createElement(Layer, _extends$3({
    className
  }, layerProps), dots));
}
function ownKeys$3(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$3(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$3(Object(t), true).forEach(function(r2) {
      _defineProperty$3(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$3(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$3(e, r, t) {
  return (r = _toPropertyKey$3(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e;
}
function _toPropertyKey$3(t) {
  var i = _toPrimitive$3(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive$3(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
var ActivePoint = (_ref) => {
  var point = _ref.point, childIndex = _ref.childIndex, mainColor = _ref.mainColor, activeDot = _ref.activeDot, dataKey = _ref.dataKey, clipPath = _ref.clipPath;
  if (activeDot === false || point.x == null || point.y == null) {
    return null;
  }
  var dotPropsTyped = {
    index: childIndex,
    dataKey,
    cx: point.x,
    cy: point.y,
    r: 4,
    fill: mainColor !== null && mainColor !== void 0 ? mainColor : "none",
    strokeWidth: 2,
    stroke: "#fff",
    payload: point.payload,
    value: point.value
  };
  var dotProps = _objectSpread$3(_objectSpread$3(_objectSpread$3({}, dotPropsTyped), svgPropertiesNoEventsFromUnknown(activeDot)), adaptEventHandlers(activeDot));
  var dot;
  if (/* @__PURE__ */ reactExports.isValidElement(activeDot)) {
    dot = /* @__PURE__ */ reactExports.cloneElement(activeDot, dotProps);
  } else if (typeof activeDot === "function") {
    dot = activeDot(dotProps);
  } else {
    dot = /* @__PURE__ */ reactExports.createElement(Dot, dotProps);
  }
  return /* @__PURE__ */ reactExports.createElement(Layer, {
    className: "recharts-active-dot",
    clipPath
  }, dot);
};
function ActivePoints(_ref2) {
  var points = _ref2.points, mainColor = _ref2.mainColor, activeDot = _ref2.activeDot, itemDataKey = _ref2.itemDataKey, clipPath = _ref2.clipPath, _ref2$zIndex = _ref2.zIndex, zIndex = _ref2$zIndex === void 0 ? DefaultZIndexes.activeDot : _ref2$zIndex;
  var activeTooltipIndex = useAppSelector(selectActiveTooltipIndex);
  var activeDataPoints = useActiveTooltipDataPoints();
  if (points == null || activeDataPoints == null) {
    return null;
  }
  var activePoint = points.find((p) => activeDataPoints.includes(p.payload));
  if (isNullish(activePoint)) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
    zIndex
  }, /* @__PURE__ */ reactExports.createElement(ActivePoint, {
    point: activePoint,
    childIndex: Number(activeTooltipIndex),
    mainColor,
    dataKey: itemDataKey,
    activeDot,
    clipPath
  }));
}
function getRadiusAndStrokeWidthFromDot(dot) {
  var props = svgPropertiesNoEventsFromUnknown(dot);
  var defaultR = 3;
  var defaultStrokeWidth = 2;
  if (props != null) {
    var r = props.r, strokeWidth = props.strokeWidth;
    var realR = Number(r);
    var realStrokeWidth = Number(strokeWidth);
    if (Number.isNaN(realR) || realR < 0) {
      realR = defaultR;
    }
    if (Number.isNaN(realStrokeWidth) || realStrokeWidth < 0) {
      realStrokeWidth = defaultStrokeWidth;
    }
    return {
      r: realR,
      strokeWidth: realStrokeWidth
    };
  }
  return {
    r: defaultR,
    strokeWidth: defaultStrokeWidth
  };
}
var selectXAxisWithScale = (state, graphicalItemId, isPanorama) => selectAxisWithScale(state, "xAxis", selectXAxisIdFromGraphicalItemId(state, graphicalItemId), isPanorama);
var selectXAxisTicks = (state, graphicalItemId, isPanorama) => selectTicksOfGraphicalItem(state, "xAxis", selectXAxisIdFromGraphicalItemId(state, graphicalItemId), isPanorama);
var selectYAxisWithScale = (state, graphicalItemId, isPanorama) => selectAxisWithScale(state, "yAxis", selectYAxisIdFromGraphicalItemId(state, graphicalItemId), isPanorama);
var selectYAxisTicks = (state, graphicalItemId, isPanorama) => selectTicksOfGraphicalItem(state, "yAxis", selectYAxisIdFromGraphicalItemId(state, graphicalItemId), isPanorama);
var selectBandSize = createSelector([selectChartLayout, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks], (layout, xAxis, yAxis, xAxisTicks, yAxisTicks) => {
  if (isCategoricalAxis(layout, "xAxis")) {
    return getBandSizeOfAxis(xAxis, xAxisTicks, false);
  }
  return getBandSizeOfAxis(yAxis, yAxisTicks, false);
});
var pickAreaId = (_state, id) => id;
var selectSynchronisedAreaSettings = createSelector([selectUnfilteredCartesianItems, pickAreaId], (graphicalItems, id) => graphicalItems.filter((item) => item.type === "area").find((item) => item.id === id));
var selectNumericalAxisType = (state) => {
  var layout = selectChartLayout(state);
  var isXAxisCategorical = isCategoricalAxis(layout, "xAxis");
  return isXAxisCategorical ? "yAxis" : "xAxis";
};
var selectNumericalAxisIdFromGraphicalItemId = (state, graphicalItemId) => {
  var axisType = selectNumericalAxisType(state);
  if (axisType === "yAxis") {
    return selectYAxisIdFromGraphicalItemId(state, graphicalItemId);
  }
  return selectXAxisIdFromGraphicalItemId(state, graphicalItemId);
};
var selectNumericalAxisStackGroups = (state, graphicalItemId, isPanorama) => selectStackGroups(state, selectNumericalAxisType(state), selectNumericalAxisIdFromGraphicalItemId(state, graphicalItemId), isPanorama);
var selectGraphicalItemStackedData = createSelector([selectSynchronisedAreaSettings, selectNumericalAxisStackGroups], (areaSettings, stackGroups) => {
  var _stackGroups$stackId;
  if (areaSettings == null || stackGroups == null) {
    return void 0;
  }
  var stackId = areaSettings.stackId;
  var stackSeriesIdentifier = getStackSeriesIdentifier(areaSettings);
  if (stackId == null || stackSeriesIdentifier == null) {
    return void 0;
  }
  var groups = (_stackGroups$stackId = stackGroups[stackId]) === null || _stackGroups$stackId === void 0 ? void 0 : _stackGroups$stackId.stackedData;
  var found = groups === null || groups === void 0 ? void 0 : groups.find((v) => v.key === stackSeriesIdentifier);
  if (found == null) {
    return void 0;
  }
  return found.map((item) => [item[0], item[1]]);
});
var selectStackDataKeys = createSelector([selectSynchronisedAreaSettings, selectNumericalAxisStackGroups], (areaSettings, stackGroups) => {
  if (areaSettings == null || areaSettings.stackId == null || stackGroups == null) {
    return void 0;
  }
  var group = stackGroups[areaSettings.stackId];
  if (group == null) {
    return void 0;
  }
  return group.graphicalItems.map((item) => item.dataKey).filter(isNotNil);
});
var selectArea = createSelector([selectChartLayout, selectXAxisWithScale, selectYAxisWithScale, selectXAxisTicks, selectYAxisTicks, selectGraphicalItemStackedData, selectChartDataWithIndexesIfNotInPanoramaPosition3, selectBandSize, selectSynchronisedAreaSettings, selectChartBaseValue, selectStackDataKeys], (layout, xAxis, yAxis, xAxisTicks, yAxisTicks, stackedData, _ref, bandSize, areaSettings, chartBaseValue, stackDataKeys) => {
  var chartData = _ref.chartData, dataStartIndex = _ref.dataStartIndex, dataEndIndex = _ref.dataEndIndex;
  if (areaSettings == null || layout !== "horizontal" && layout !== "vertical" || xAxis == null || yAxis == null || xAxisTicks == null || yAxisTicks == null || xAxisTicks.length === 0 || yAxisTicks.length === 0 || bandSize == null) {
    return void 0;
  }
  var data = areaSettings.data;
  var displayedData;
  if (data && data.length > 0) {
    displayedData = data;
  } else {
    displayedData = chartData === null || chartData === void 0 ? void 0 : chartData.slice(dataStartIndex, dataEndIndex + 1);
  }
  if (displayedData == null) {
    return void 0;
  }
  return computeArea({
    layout,
    xAxis,
    yAxis,
    xAxisTicks,
    yAxisTicks,
    dataStartIndex,
    areaSettings,
    stackedData,
    displayedData,
    chartBaseValue,
    bandSize,
    stackDataKeys
  });
});
var _excluded$2 = ["animationElapsedTime", "isAnimating", "isEntrance", "layout", "isRange", "stroke", "connectNulls"], _excluded2$1 = ["id", "baseLine"];
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
function HorizontalClipRect(_ref) {
  var _points$, _points;
  var alpha = _ref.alpha, baseLine = _ref.baseLine, points = _ref.points, strokeWidth = _ref.strokeWidth;
  var startX = (_points$ = points[0]) === null || _points$ === void 0 ? void 0 : _points$.x;
  var endX = (_points = points[points.length - 1]) === null || _points === void 0 ? void 0 : _points.x;
  if (!isWellBehavedNumber(startX) || !isWellBehavedNumber(endX)) {
    return null;
  }
  var width = alpha * Math.abs(startX - endX);
  var maxY = Math.max(...points.map((entry) => entry.y || 0));
  if (isNumber(baseLine)) {
    maxY = Math.max(baseLine, maxY);
  } else if (baseLine && Array.isArray(baseLine) && baseLine.length) {
    maxY = Math.max(...baseLine.map((entry) => entry.y || 0), maxY);
  }
  if (isNumber(maxY)) {
    return /* @__PURE__ */ reactExports.createElement("rect", {
      x: startX < endX ? startX : startX - width,
      y: 0,
      width,
      height: Math.floor(maxY + (strokeWidth ? parseInt("".concat(strokeWidth), 10) : 1))
    });
  }
  return null;
}
function VerticalClipRect(_ref2) {
  var _points$2, _points2;
  var alpha = _ref2.alpha, baseLine = _ref2.baseLine, points = _ref2.points, strokeWidth = _ref2.strokeWidth;
  var startY = (_points$2 = points[0]) === null || _points$2 === void 0 ? void 0 : _points$2.y;
  var endY = (_points2 = points[points.length - 1]) === null || _points2 === void 0 ? void 0 : _points2.y;
  if (!isWellBehavedNumber(startY) || !isWellBehavedNumber(endY)) {
    return null;
  }
  var height = alpha * Math.abs(startY - endY);
  var maxX = Math.max(...points.map((entry) => entry.x || 0));
  if (isNumber(baseLine)) {
    maxX = Math.max(baseLine, maxX);
  } else if (baseLine && Array.isArray(baseLine) && baseLine.length) {
    maxX = Math.max(...baseLine.map((entry) => entry.x || 0), maxX);
  }
  if (isNumber(maxX)) {
    return /* @__PURE__ */ reactExports.createElement("rect", {
      x: 0,
      y: startY < endY ? startY : startY - height,
      width: maxX + (strokeWidth ? parseInt("".concat(strokeWidth), 10) : 1),
      height: Math.floor(height)
    });
  }
  return null;
}
function RevealClipRect(_ref3) {
  var alpha = _ref3.alpha, layout = _ref3.layout, points = _ref3.points, baseLine = _ref3.baseLine, strokeWidth = _ref3.strokeWidth;
  if (layout === "vertical") {
    return /* @__PURE__ */ reactExports.createElement(VerticalClipRect, {
      alpha,
      points,
      baseLine,
      strokeWidth
    });
  }
  return /* @__PURE__ */ reactExports.createElement(HorizontalClipRect, {
    alpha,
    points,
    baseLine,
    strokeWidth
  });
}
function AreaRevealShape(props) {
  var _props$animationElaps = props.animationElapsedTime, animationElapsedTime = _props$animationElaps === void 0 ? 1 : _props$animationElaps, _props$isAnimating = props.isAnimating, isAnimating = _props$isAnimating === void 0 ? false : _props$isAnimating, _props$isEntrance = props.isEntrance, isEntrance = _props$isEntrance === void 0 ? false : _props$isEntrance, layoutProp = props.layout, isRange = props.isRange, stroke = props.stroke, connectNulls = props.connectNulls, restProps = _objectWithoutProperties$2(props, _excluded$2);
  var layout = layoutProp === "vertical" ? "vertical" : "horizontal";
  var finalConnectNulls = connectNulls !== null && connectNulls !== void 0 ? connectNulls : false;
  var clipId = useId();
  var id = restProps.id, baseLine = restProps.baseLine, propsWithoutIdBaseline = _objectWithoutProperties$2(restProps, _excluded2$1);
  var strokeSvgProps = svgPropertiesNoEvents(propsWithoutIdBaseline);
  var fillCurve = /* @__PURE__ */ reactExports.createElement(Curve, _extends$2({}, restProps, {
    id,
    baseLine,
    connectNulls: finalConnectNulls,
    stroke: "none",
    className: "recharts-area-area",
    layout
  }));
  var strokeCurve = stroke !== "none" && /* @__PURE__ */ reactExports.createElement(Curve, _extends$2({}, strokeSvgProps, {
    className: "recharts-area-curve",
    layout,
    type: restProps.type,
    connectNulls: finalConnectNulls,
    fill: "none",
    stroke,
    points: restProps.points
  }));
  var baselineCurve = stroke !== "none" && isRange && Array.isArray(baseLine) && /* @__PURE__ */ reactExports.createElement(Curve, _extends$2({}, strokeSvgProps, {
    className: "recharts-area-curve",
    layout,
    type: restProps.type,
    connectNulls: finalConnectNulls,
    fill: "none",
    stroke,
    points: baseLine
  }));
  if (isEntrance && (isAnimating || animationElapsedTime < 1)) {
    var _restProps$points;
    return /* @__PURE__ */ reactExports.createElement(Layer, null, /* @__PURE__ */ reactExports.createElement("defs", null, /* @__PURE__ */ reactExports.createElement("clipPath", {
      id: clipId
    }, /* @__PURE__ */ reactExports.createElement(RevealClipRect, {
      alpha: animationElapsedTime,
      points: (_restProps$points = restProps.points) !== null && _restProps$points !== void 0 ? _restProps$points : [],
      baseLine,
      layout,
      strokeWidth: restProps.strokeWidth
    }))), /* @__PURE__ */ reactExports.createElement(Layer, {
      clipPath: "url(#".concat(clipId, ")")
    }, fillCurve, strokeCurve, baselineCurve));
  }
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, fillCurve, strokeCurve, baselineCurve);
}
var _excluded$1 = ["id"], _excluded2 = ["activeDot", "animationBegin", "animationDuration", "animationEasing", "connectNulls", "dot", "fill", "fillOpacity", "hide", "isAnimationActive", "legendType", "stroke", "xAxisId", "yAxisId"];
function _extends$1() {
  return _extends$1 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$1.apply(null, arguments);
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
var defaultAreaAnimateItems = (items, animationElapsedTime) => {
  if (items == null) {
    return [];
  }
  if (animationElapsedTime === 1) {
    return items.flatMap((item) => item.status === "removed" ? [] : [item.next]);
  }
  return items.flatMap((item) => {
    if (item.status === "matched") {
      return [_objectSpread$2(_objectSpread$2({}, item.next), {}, {
        x: interpolate(item.prev.x, item.next.x, animationElapsedTime),
        y: interpolate(item.prev.y, item.next.y, animationElapsedTime)
      })];
    }
    if (item.status === "added") {
      return [item.next];
    }
    return [];
  });
};
var defaultAreaProps = {
  activeDot: true,
  animationBegin: 0,
  animationDuration: 1500,
  animationEasing: "ease",
  animationMatchBy: matchByIndex,
  animationInterpolateFn: defaultAreaAnimateItems,
  connectNulls: false,
  dot: false,
  fill: "#3182bd",
  fillOpacity: 0.6,
  hide: false,
  isAnimationActive: "auto",
  legendType: "line",
  stroke: "#3182bd",
  strokeWidth: 1,
  type: "linear",
  label: false,
  shape: AreaRevealShape,
  xAxisId: 0,
  yAxisId: 0,
  zIndex: DefaultZIndexes.area
};
function getLegendItemColor(stroke, fill) {
  return stroke && stroke !== "none" ? stroke : fill;
}
var computeLegendPayloadFromAreaData = (props) => {
  var dataKey = props.dataKey, name = props.name, stroke = props.stroke, fill = props.fill, legendType = props.legendType, hide = props.hide;
  return [{
    inactive: hide,
    dataKey,
    type: legendType,
    color: getLegendItemColor(stroke, fill),
    value: getTooltipNameProp(name, dataKey),
    payload: props
  }];
};
var SetAreaTooltipEntrySettings = /* @__PURE__ */ reactExports.memo((_ref) => {
  var dataKey = _ref.dataKey, data = _ref.data, stroke = _ref.stroke, strokeWidth = _ref.strokeWidth, fill = _ref.fill, name = _ref.name, hide = _ref.hide, unit = _ref.unit, formatter = _ref.formatter, tooltipType = _ref.tooltipType, id = _ref.id;
  var tooltipEntrySettings = {
    dataDefinedOnItem: data,
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
      color: getLegendItemColor(stroke, fill),
      unit,
      formatter,
      graphicalItemId: id
    }
  };
  return /* @__PURE__ */ reactExports.createElement(SetTooltipEntrySettings, {
    tooltipEntrySettings
  });
});
function AreaDotsWrapper(_ref2) {
  var clipPathId = _ref2.clipPathId, points = _ref2.points, props = _ref2.props;
  var needClip = props.needClip, dot = props.dot, dataKey = props.dataKey;
  var areaProps = svgPropertiesNoEvents(props);
  return /* @__PURE__ */ reactExports.createElement(Dots, {
    points,
    dot,
    className: "recharts-area-dots",
    dotClassName: "recharts-area-dot",
    dataKey,
    baseProps: areaProps,
    needClip,
    clipPathId
  });
}
function AreaLabelListProvider(_ref3) {
  var showLabels = _ref3.showLabels, children = _ref3.children, points = _ref3.points;
  var labelListEntries = points.map((point) => {
    var _point$x, _point$y;
    var viewBox = {
      x: (_point$x = point.x) !== null && _point$x !== void 0 ? _point$x : 0,
      y: (_point$y = point.y) !== null && _point$y !== void 0 ? _point$y : 0,
      width: 0,
      lowerWidth: 0,
      upperWidth: 0,
      height: 0
    };
    return _objectSpread$2(_objectSpread$2({}, viewBox), {}, {
      value: point.value,
      payload: point.payload,
      parentViewBox: void 0,
      viewBox,
      fill: void 0
    });
  });
  return /* @__PURE__ */ reactExports.createElement(CartesianLabelListContextProvider, {
    value: showLabels ? labelListEntries : void 0
  }, children);
}
function StaticArea(_ref4) {
  var points = _ref4.points, baseLine = _ref4.baseLine, needClip = _ref4.needClip, clipPathId = _ref4.clipPathId, props = _ref4.props, animationElapsedTime = _ref4.animationElapsedTime, isAnimating = _ref4.isAnimating, isEntrance = _ref4.isEntrance;
  var layout = props.layout, type = props.type, stroke = props.stroke, connectNulls = props.connectNulls, isRange = props.isRange, shape = props.shape;
  var id = props.id, propsWithoutId = _objectWithoutProperties$1(props, _excluded$1);
  var propsWithEvents = svgPropertiesAndEvents(propsWithoutId);
  var curveProps = _objectSpread$2(_objectSpread$2({}, propsWithEvents), {}, {
    id,
    points,
    connectNulls,
    type,
    baseLine,
    layout,
    stroke,
    isRange,
    animationElapsedTime,
    isAnimating,
    isEntrance
  });
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, (points === null || points === void 0 ? void 0 : points.length) > 1 && /* @__PURE__ */ reactExports.createElement(Layer, {
    clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : void 0
  }, /* @__PURE__ */ reactExports.createElement(Shape, {
    option: shape,
    DefaultShape: defaultAreaProps.shape,
    shapeProps: curveProps
  })), /* @__PURE__ */ reactExports.createElement(AreaDotsWrapper, {
    points,
    props: propsWithoutId,
    clipPathId
  }));
}
function interpolateScalarBaseLine(baseLine, prevBaseLine, animationElapsedTime) {
  if (isNumber(baseLine)) {
    var previousNumberBaseLine = isNumber(prevBaseLine) ? prevBaseLine : void 0;
    return interpolate(previousNumberBaseLine, baseLine, animationElapsedTime);
  }
  if (isNullish(baseLine) || isNan(baseLine)) {
    var _previousNumberBaseLine = isNumber(prevBaseLine) ? prevBaseLine : void 0;
    return interpolate(_previousNumberBaseLine, 0, animationElapsedTime);
  }
  return baseLine;
}
function AreaWithAnimation(_ref5) {
  var needClip = _ref5.needClip, clipPathId = _ref5.clipPathId, props = _ref5.props, previousPointsRef = _ref5.previousPointsRef, previousBaselineRef = _ref5.previousBaselineRef;
  var points = props.points, baseLine = props.baseLine, isAnimationActive = props.isAnimationActive, animationBegin = props.animationBegin, animationDuration = props.animationDuration, animationEasing = props.animationEasing, animationMatchBy = props.animationMatchBy, animationInterpolateFn = props.animationInterpolateFn;
  var animationInput = reactExports.useMemo(() => ({
    points,
    baseLine
  }), [points, baseLine]);
  var baseLineAnimationState = useAnimationStartSnapshot(animationInput, previousBaselineRef);
  var layout = useCartesianChartLayout();
  var _useAnimationCallback = useAnimationCallbacks(props.onAnimationStart, props.onAnimationEnd), isAnimating = _useAnimationCallback.isAnimating, handleAnimationStart = _useAnimationCallback.handleAnimationStart, handleAnimationEnd = _useAnimationCallback.handleAnimationEnd;
  var prevBaseLine = baseLineAnimationState.startValue;
  if (layout == null) {
    return null;
  }
  var baseLineAnimationItems;
  if (Array.isArray(baseLine) && Array.isArray(prevBaseLine)) {
    baseLineAnimationItems = matchAnimationItems(prevBaseLine, baseLine, animationMatchBy);
  } else if (Array.isArray(baseLine)) {
    baseLineAnimationItems = matchAnimationItems(null, baseLine, animationMatchBy);
  } else {
    baseLineAnimationItems = null;
  }
  return /* @__PURE__ */ reactExports.createElement(AnimatedItems, {
    animationInput,
    animationIdPrefix: "recharts-area-",
    items: points,
    previousItemsRef: previousPointsRef,
    isAnimationActive,
    animationBegin,
    animationDuration,
    animationEasing,
    onAnimationStart: handleAnimationStart,
    onAnimationEnd: handleAnimationEnd,
    animationInterpolateFn,
    animationMatchBy,
    layout
  }, (stepPoints, animationElapsedTime, isEntrance) => {
    var stepBaseLine;
    if (animationElapsedTime === 1) {
      stepBaseLine = baseLine;
    } else if (Array.isArray(baseLine)) {
      stepBaseLine = animationInterpolateFn(baseLineAnimationItems, animationElapsedTime, layout);
    } else {
      stepBaseLine = isEntrance ? baseLine : interpolateScalarBaseLine(baseLine, prevBaseLine, animationElapsedTime);
    }
    baseLineAnimationState.syncStepValue(stepBaseLine, animationElapsedTime);
    return /* @__PURE__ */ reactExports.createElement(AreaLabelListProvider, {
      showLabels: !isAnimating,
      points
    }, props.children, /* @__PURE__ */ reactExports.createElement(StaticArea, {
      points: stepPoints,
      baseLine: stepBaseLine,
      needClip,
      clipPathId,
      props,
      animationElapsedTime,
      isAnimating: isAnimating || animationElapsedTime < 1,
      isEntrance
    }), /* @__PURE__ */ reactExports.createElement(LabelListFromLabelProp, {
      label: props.label
    }));
  });
}
function RenderArea(_ref6) {
  var needClip = _ref6.needClip, clipPathId = _ref6.clipPathId, props = _ref6.props;
  var previousPointsRef = reactExports.useRef(null);
  var previousBaselineRef = reactExports.useRef();
  return /* @__PURE__ */ reactExports.createElement(AreaWithAnimation, {
    needClip,
    clipPathId,
    props,
    previousPointsRef,
    previousBaselineRef
  });
}
class AreaWithState extends reactExports.PureComponent {
  render() {
    var _this$props = this.props, hide = _this$props.hide, dot = _this$props.dot, points = _this$props.points, className = _this$props.className, top = _this$props.top, left = _this$props.left, needClip = _this$props.needClip, xAxisId = _this$props.xAxisId, yAxisId = _this$props.yAxisId, width = _this$props.width, height = _this$props.height, id = _this$props.id, baseLine = _this$props.baseLine, zIndex = _this$props.zIndex;
    if (hide) {
      return null;
    }
    var layerClass = clsx("recharts-area", className);
    var clipPathId = id;
    var _getRadiusAndStrokeWi = getRadiusAndStrokeWidthFromDot(dot), r = _getRadiusAndStrokeWi.r, strokeWidth = _getRadiusAndStrokeWi.strokeWidth;
    var clipDot = isClipDot(dot);
    var dotSize = r * 2 + strokeWidth;
    var activePointsClipPath = needClip ? "url(#clipPath-".concat(clipDot ? "" : "dots-").concat(clipPathId, ")") : void 0;
    return /* @__PURE__ */ reactExports.createElement(ZIndexLayer, {
      zIndex
    }, /* @__PURE__ */ reactExports.createElement(Layer, {
      className: layerClass
    }, needClip && /* @__PURE__ */ reactExports.createElement("defs", null, /* @__PURE__ */ reactExports.createElement(GraphicalItemClipPath, {
      clipPathId,
      xAxisId,
      yAxisId
    }), !clipDot && /* @__PURE__ */ reactExports.createElement("clipPath", {
      id: "clipPath-dots-".concat(clipPathId)
    }, /* @__PURE__ */ reactExports.createElement("rect", {
      x: left - dotSize / 2,
      y: top - dotSize / 2,
      width: width + dotSize,
      height: height + dotSize
    }))), /* @__PURE__ */ reactExports.createElement(RenderArea, {
      needClip,
      clipPathId,
      props: this.props
    })), /* @__PURE__ */ reactExports.createElement(ActivePoints, {
      points,
      mainColor: getLegendItemColor(this.props.stroke, this.props.fill),
      itemDataKey: this.props.dataKey,
      activeDot: this.props.activeDot,
      clipPath: activePointsClipPath
    }), this.props.isRange && Array.isArray(baseLine) && /* @__PURE__ */ reactExports.createElement(ActivePoints, {
      points: baseLine,
      mainColor: getLegendItemColor(this.props.stroke, this.props.fill),
      itemDataKey: this.props.dataKey,
      activeDot: this.props.activeDot,
      clipPath: activePointsClipPath
    }));
  }
}
function AreaImpl(props) {
  var _useAppSelector;
  var activeDot = props.activeDot, animationBegin = props.animationBegin, animationDuration = props.animationDuration, animationEasing = props.animationEasing, connectNulls = props.connectNulls, dot = props.dot, fill = props.fill, fillOpacity = props.fillOpacity, hide = props.hide, isAnimationActive = props.isAnimationActive, legendType = props.legendType, stroke = props.stroke, xAxisId = props.xAxisId, yAxisId = props.yAxisId, everythingElse = _objectWithoutProperties$1(props, _excluded2);
  var layout = useChartLayout();
  var chartName = useChartName();
  var _useNeedsClip = useNeedsClip(xAxisId, yAxisId), needClip = _useNeedsClip.needClip;
  var isPanorama = useIsPanorama();
  var _ref7 = (_useAppSelector = useAppSelector((state) => selectArea(state, props.id, isPanorama))) !== null && _useAppSelector !== void 0 ? _useAppSelector : {}, points = _ref7.points, isRange = _ref7.isRange, baseLine = _ref7.baseLine;
  var plotArea = usePlotArea();
  if (layout !== "horizontal" && layout !== "vertical" || plotArea == null) {
    return null;
  }
  if (chartName !== "AreaChart" && chartName !== "ComposedChart") {
    return null;
  }
  var height = plotArea.height, width = plotArea.width, left = plotArea.x, top = plotArea.y;
  if (!points || !points.length) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement(AreaWithState, _extends$1({}, everythingElse, {
    activeDot,
    animationBegin,
    animationDuration,
    animationEasing,
    baseLine,
    connectNulls,
    dot,
    fill,
    fillOpacity,
    height,
    hide,
    layout,
    isAnimationActive,
    isRange,
    legendType,
    needClip,
    points,
    stroke,
    width,
    left,
    top,
    xAxisId,
    yAxisId
  }));
}
var getBaseValue = (layout, chartBaseValue, itemBaseValue, xAxis, yAxis) => {
  var baseValue = itemBaseValue !== null && itemBaseValue !== void 0 ? itemBaseValue : chartBaseValue;
  if (isNumber(baseValue)) {
    return baseValue;
  }
  var numericAxis = layout === "horizontal" ? yAxis : xAxis;
  var domain = numericAxis.scale.domain();
  if (numericAxis.type === "number") {
    var domainMax = Math.max(domain[0], domain[1]);
    var domainMin = Math.min(domain[0], domain[1]);
    if (baseValue === "dataMin") {
      return domainMin;
    }
    if (baseValue === "dataMax") {
      return domainMax;
    }
    return domainMax < 0 ? domainMax : Math.max(Math.min(domain[0], domain[1]), 0);
  }
  if (baseValue === "dataMin") {
    return domain[0];
  }
  if (baseValue === "dataMax") {
    return domain[1];
  }
  return domain[0];
};
function computeArea(_ref8) {
  var _ref8$areaSettings = _ref8.areaSettings, connectNulls = _ref8$areaSettings.connectNulls, itemBaseValue = _ref8$areaSettings.baseValue, dataKey = _ref8$areaSettings.dataKey, stackedData = _ref8.stackedData, layout = _ref8.layout, chartBaseValue = _ref8.chartBaseValue, xAxis = _ref8.xAxis, yAxis = _ref8.yAxis, displayedData = _ref8.displayedData, dataStartIndex = _ref8.dataStartIndex, xAxisTicks = _ref8.xAxisTicks, yAxisTicks = _ref8.yAxisTicks, bandSize = _ref8.bandSize, stackDataKeys = _ref8.stackDataKeys;
  var hasStack = stackedData && stackedData.length;
  var baseValue = getBaseValue(layout, chartBaseValue, itemBaseValue, xAxis, yAxis);
  var isHorizontalLayout = layout === "horizontal";
  var isRange = false;
  var points = displayedData.map((entry, index) => {
    var _valueAsArray$, _valueAsArray, _xAxis$scale$map;
    var valueAsArray;
    if (hasStack) {
      valueAsArray = stackedData[dataStartIndex + index];
    } else {
      var _rawValue = getValueByDataKey(entry, dataKey);
      if (!Array.isArray(_rawValue)) {
        valueAsArray = [baseValue, _rawValue];
      } else {
        valueAsArray = _rawValue;
        isRange = true;
      }
    }
    var value1 = (_valueAsArray$ = (_valueAsArray = valueAsArray) === null || _valueAsArray === void 0 ? void 0 : _valueAsArray[1]) !== null && _valueAsArray$ !== void 0 ? _valueAsArray$ : null;
    var rawValue = getValueByDataKey(entry, dataKey);
    var wholeStackIsNull = hasStack && rawValue == null && stackDataKeys != null && stackDataKeys.length > 0 && stackDataKeys.every((key) => getValueByDataKey(entry, key) == null);
    var isBreakPoint = value1 == null || hasStack && !connectNulls && rawValue == null || wholeStackIsNull;
    if (isHorizontalLayout) {
      var _yAxis$scale$map;
      return {
        x: getCateCoordinateOfLine({
          axis: xAxis,
          ticks: xAxisTicks,
          bandSize,
          entry,
          index
        }),
        y: isBreakPoint ? null : (_yAxis$scale$map = yAxis.scale.map(value1)) !== null && _yAxis$scale$map !== void 0 ? _yAxis$scale$map : null,
        value: valueAsArray,
        payload: entry
      };
    }
    return {
      x: isBreakPoint ? null : (_xAxis$scale$map = xAxis.scale.map(value1)) !== null && _xAxis$scale$map !== void 0 ? _xAxis$scale$map : null,
      y: getCateCoordinateOfLine({
        axis: yAxis,
        ticks: yAxisTicks,
        bandSize,
        entry,
        index
      }),
      value: valueAsArray,
      payload: entry
    };
  });
  var baseLine;
  if (hasStack || isRange) {
    baseLine = points.map((entry) => {
      var _xAxis$scale$map2;
      var x = Array.isArray(entry.value) ? entry.value[0] : null;
      if (isHorizontalLayout) {
        var _yAxis$scale$map2;
        return {
          x: entry.x,
          y: x != null && entry.y != null ? (_yAxis$scale$map2 = yAxis.scale.map(x)) !== null && _yAxis$scale$map2 !== void 0 ? _yAxis$scale$map2 : null : null,
          payload: entry.payload
        };
      }
      return {
        x: x != null ? (_xAxis$scale$map2 = xAxis.scale.map(x)) !== null && _xAxis$scale$map2 !== void 0 ? _xAxis$scale$map2 : null : null,
        y: entry.y,
        payload: entry.payload
      };
    });
  } else {
    baseLine = isHorizontalLayout ? yAxis.scale.map(baseValue) : xAxis.scale.map(baseValue);
  }
  return {
    points,
    baseLine: baseLine !== null && baseLine !== void 0 ? baseLine : 0,
    isRange
  };
}
function AreaFn(outsideProps) {
  var props = resolveDefaultProps(outsideProps, defaultAreaProps);
  var isPanorama = useIsPanorama();
  return /* @__PURE__ */ reactExports.createElement(RegisterGraphicalItemId, {
    id: props.id,
    type: "area"
  }, (id) => /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(SetLegendPayload, {
    legendPayload: computeLegendPayloadFromAreaData(props)
  }), /* @__PURE__ */ reactExports.createElement(SetAreaTooltipEntrySettings, {
    dataKey: props.dataKey,
    data: props.data,
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
    type: "area",
    id,
    data: props.data,
    dataKey: props.dataKey,
    xAxisId: props.xAxisId,
    yAxisId: props.yAxisId,
    zAxisId: 0,
    stackId: getNormalizedStackId(props.stackId),
    hide: props.hide,
    barSize: void 0,
    baseValue: props.baseValue,
    isPanorama,
    connectNulls: props.connectNulls
  }), /* @__PURE__ */ reactExports.createElement(AreaImpl, _extends$1({}, props, {
    id
  }))));
}
var Area = /* @__PURE__ */ reactExports.memo(AreaFn, propsAreEqual);
Area.displayName = "Area";
function ReportPolarOptions(props) {
  var dispatch = useAppDispatch();
  reactExports.useEffect(() => {
    dispatch(updatePolarOptions(props));
  }, [dispatch, props]);
  return null;
}
var _excluded = ["layout"];
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
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
var defaultMargin = {
  top: 5,
  right: 5,
  bottom: 5,
  left: 5
};
var defaultPolarChartProps = _objectSpread$1({
  accessibilityLayer: true,
  stackOffset: "none",
  barCategoryGap: "10%",
  barGap: 4,
  margin: defaultMargin,
  reverseStackOrder: false,
  syncMethod: "index",
  layout: "radial",
  responsive: false,
  cx: "50%",
  cy: "50%",
  innerRadius: 0,
  outerRadius: "80%"
}, initialEventSettingsState);
var PolarChart = /* @__PURE__ */ reactExports.forwardRef(function PolarChart2(props, ref) {
  var _polarChartProps$id;
  var polarChartProps = resolveDefaultProps(props.categoricalChartProps, defaultPolarChartProps);
  var layout = polarChartProps.layout, otherCategoricalProps = _objectWithoutProperties(polarChartProps, _excluded);
  var chartName = props.chartName, defaultTooltipEventType = props.defaultTooltipEventType, validateTooltipEventTypes = props.validateTooltipEventTypes, tooltipPayloadSearcher = props.tooltipPayloadSearcher;
  var options = {
    chartName,
    defaultTooltipEventType,
    validateTooltipEventTypes,
    tooltipPayloadSearcher,
    eventEmitter: void 0
  };
  return /* @__PURE__ */ reactExports.createElement(RechartsStoreProvider, {
    preloadedState: {
      options
    },
    reduxStoreName: (_polarChartProps$id = polarChartProps.id) !== null && _polarChartProps$id !== void 0 ? _polarChartProps$id : chartName
  }, /* @__PURE__ */ reactExports.createElement(ChartDataContextProvider, {
    chartData: polarChartProps.data
  }), /* @__PURE__ */ reactExports.createElement(ReportMainChartProps, {
    layout,
    margin: polarChartProps.margin
  }), /* @__PURE__ */ reactExports.createElement(ReportEventSettings, {
    throttleDelay: polarChartProps.throttleDelay,
    throttledEvents: polarChartProps.throttledEvents
  }), /* @__PURE__ */ reactExports.createElement(ReportChartProps, {
    baseValue: void 0,
    accessibilityLayer: polarChartProps.accessibilityLayer,
    barCategoryGap: polarChartProps.barCategoryGap,
    maxBarSize: polarChartProps.maxBarSize,
    stackOffset: polarChartProps.stackOffset,
    barGap: polarChartProps.barGap,
    barSize: polarChartProps.barSize,
    syncId: polarChartProps.syncId,
    syncMethod: polarChartProps.syncMethod,
    className: polarChartProps.className,
    reverseStackOrder: polarChartProps.reverseStackOrder
  }), /* @__PURE__ */ reactExports.createElement(ReportPolarOptions, {
    cx: polarChartProps.cx,
    cy: polarChartProps.cy,
    startAngle: polarChartProps.startAngle,
    endAngle: polarChartProps.endAngle,
    innerRadius: polarChartProps.innerRadius,
    outerRadius: polarChartProps.outerRadius
  }), /* @__PURE__ */ reactExports.createElement(CategoricalChart, _extends({}, otherCategoricalProps, {
    ref
  })));
});
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
var allowedTooltipTypes$1 = ["item"];
var defaultPieChartProps = _objectSpread(_objectSpread({}, defaultPolarChartProps), {}, {
  layout: "centric",
  startAngle: 0,
  endAngle: 360
});
var PieChart = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  var propsWithDefaults = resolveDefaultProps(props, defaultPieChartProps);
  return /* @__PURE__ */ reactExports.createElement(PolarChart, {
    chartName: "PieChart",
    defaultTooltipEventType: "item",
    validateTooltipEventTypes: allowedTooltipTypes$1,
    tooltipPayloadSearcher: arrayTooltipSearcher,
    categoricalChartProps: propsWithDefaults,
    ref
  });
});
var allowedTooltipTypes = ["axis"];
var AreaChart = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  return /* @__PURE__ */ reactExports.createElement(CartesianChart, {
    chartName: "AreaChart",
    defaultTooltipEventType: "axis",
    validateTooltipEventTypes: allowedTooltipTypes,
    tooltipPayloadSearcher: arrayTooltipSearcher,
    categoricalChartProps: props,
    ref
  });
});
const COLORS = [
  "#a855f7",
  // purple-500
  "#3b82f6",
  // blue-500
  "#10b981",
  // emerald-500
  "#f43f5e",
  // rose-500
  "#f59e0b",
  // amber-500
  "#06b6d4",
  // cyan-500
  "#8b5cf6",
  // violet-500
  "#ec4899",
  // pink-500
  "#14b8a6",
  // teal-500
  "#f97316",
  // orange-500
  "#6366f1",
  // indigo-500
  "#84cc16"
  // lime-500
];
const CategorySalesChart = ({ data }) => {
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const chartData = data.map((item, index) => {
    const revenue = item.revenue || 0;
    const percentage = totalRevenue > 0 ? Math.round(revenue / totalRevenue * 100) : 0;
    return {
      name: item.name || "Uncategorized",
      revenue,
      percentage,
      fill: COLORS[index % COLORS.length]
    };
  }).filter((item) => item.revenue > 0);
  const chartConfig = chartData.reduce((acc, curr) => {
    acc[curr.name] = {
      label: curr.name,
      color: curr.fill
    };
    return acc;
  }, {});
  if (chartData.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-[350px] border border-border/50 rounded-[32px] bg-card shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-bold uppercase tracking-widest text-xs", children: "No category data available" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row gap-8 items-center bg-card border border-border/50 rounded-[32px] p-8 lg:p-12 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 w-full space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-3xl font-black tracking-tight text-foreground", children: "Sales by product category" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4", children: chartData.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full shrink-0 shadow-sm", style: { backgroundColor: item.fill } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold truncate text-foreground/80", children: item.name })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-black text-foreground ml-2 shrink-0", children: [
          item.percentage,
          "%"
        ] })
      ] }, item.name)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full md:w-[350px] h-[350px] shrink-0 relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "w-full h-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Pie,
        {
          data: chartData,
          dataKey: "revenue",
          nameKey: "name",
          cx: "50%",
          cy: "50%",
          innerRadius: 100,
          outerRadius: 150,
          strokeWidth: 0,
          paddingAngle: 3,
          cornerRadius: 8,
          children: chartData.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: entry.fill }, `cell-${index}`))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Tooltip,
        {
          content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, { hideIndicator: false }),
          cursor: false
        }
      )
    ] }) }) })
  ] });
};
const Analytics = () => {
  const { t, formatDate, formatTime, language, isModuleEnabled } = useSettings();
  const [period, setPeriod] = reactExports.useState("month");
  const [dateRange, setDateRange] = reactExports.useState({ start: "", end: "" });
  const [data, setData] = reactExports.useState(null);
  const [dashboardStats, setDashboardStats] = reactExports.useState(null);
  const [inventoryValue, setInventoryValue] = reactExports.useState(0);
  const [lowStockItems, setLowStockItems] = reactExports.useState([]);
  const [recentActivity, setRecentActivity] = reactExports.useState([]);
  const [rawSales, setRawSales] = reactExports.useState([]);
  const currentRange = reactExports.useMemo(() => {
    if (period === "custom") return dateRange;
    const now = /* @__PURE__ */ new Date();
    let end = now.toISOString().split("T")[0];
    let start = "";
    if (period === "today") {
      start = end;
    } else if (period === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split("T")[0];
    } else if (period === "month") {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split("T")[0];
    } else if (period === "year") {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split("T")[0];
    }
    return { start, end };
  }, [period, dateRange]);
  reactExports.useEffect(() => {
    if (period !== "custom" || dateRange.start && dateRange.end) {
      loadData();
    }
  }, [period]);
  useDataChangedRefresh(() => {
    loadData();
  });
  const loadData = async (customRange) => {
    const range = customRange || currentRange;
    try {
      const [anRes, dbRes, itemsRes, actRes, salesRes] = await Promise.allSettled([
        window.api.getAnalytics(period, range),
        window.api.getDashboardStats(),
        window.api.getItems({}),
        window.api.getRecentActivity(10, range),
        window.api.getSales({ startDate: range.start, endDate: range.end })
      ]);
      if (anRes.status === "fulfilled") {
        console.log("[Analytics] getAnalytics ok:", JSON.stringify({
          period,
          range,
          salesDataPoints: anRes.value?.salesData?.length ?? 0,
          salesData: anRes.value?.salesData
        }));
        setData(anRes.value);
      } else console.error("[Analytics] getAnalytics failed:", anRes.reason?.message || anRes.reason);
      setDashboardStats(dbRes.status === "fulfilled" ? dbRes.value : null);
      setRecentActivity(actRes.status === "fulfilled" ? actRes.value || [] : []);
      setRawSales(salesRes.status === "fulfilled" ? salesRes.value || [] : []);
      if (actRes.status === "rejected") console.error("getRecentActivity failed:", actRes.reason?.message || actRes.reason);
      if (salesRes.status === "rejected") console.error("getSales failed:", salesRes.reason?.message || salesRes.reason);
      if (itemsRes.status === "fulfilled" && itemsRes.value) {
        const items = itemsRes.value;
        const val = items.reduce(
          (s, i) => s + i.totalBaseQuantity * i.basePurchasePrice,
          0
        );
        setInventoryValue(val);
        const lowStock = items.filter((i) => i.totalBaseQuantity <= 10).sort((a, b) => a.totalBaseQuantity - b.totalBaseQuantity);
        setLowStockItems(lowStock);
      } else if (itemsRes.status === "rejected") {
        console.error("getItems failed:", itemsRes.reason?.message || itemsRes.reason);
      }
    } catch (e) {
      console.error(e.message || "Failed to load analytics");
    }
  };
  const chartData = reactExports.useMemo(() => {
    if (!data) return [];
    let name = (s) => {
      let n = s.date;
      try {
        const d = new Date(s.date);
        if (period === "year" && !dateRange.start) {
          n = d.toLocaleDateString(language, { month: "short" });
        } else if (period === "today") {
          n = d.toLocaleTimeString(language, {
            hour: "2-digit",
            minute: "2-digit"
          });
        } else {
          n = d.toLocaleDateString(language, {
            month: "short",
            day: "numeric"
          });
        }
      } catch (e) {
      }
      return n;
    };
    return data.salesData.map((s) => ({
      name: name(s),
      revenue: s.revenue,
      profit: s.profit
    }));
  }, [data, period, language, dateRange]);
  const salesDistribution = reactExports.useMemo(() => {
    if (!rawSales.length) return { title: "", subtitle: "", data: [], dataKey: "" };
    const range = currentRange;
    const start = range.start ? new Date(range.start) : null;
    const end = range.end ? new Date(range.end) : null;
    const daySpan = start && end ? Math.ceil((end.getTime() - start.getTime()) / 864e5) : 0;
    let granularity = "daily";
    if (period === "today") granularity = "hourly";
    else if (period === "week") granularity = "daily";
    else if (period === "month") granularity = "weekly";
    else if (period === "year") granularity = "monthly";
    else if (period === "custom") {
      if (daySpan <= 1) granularity = "hourly";
      else if (daySpan <= 14) granularity = "daily";
      else if (daySpan <= 60) granularity = "weekly";
      else granularity = "monthly";
    }
    if (granularity === "hourly") {
      const hourly = Array.from({ length: 24 }, (_, i) => ({ label: `${i.toString().padStart(2, "0")}:00`, revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const h = new Date(s.createdAt).getHours();
        hourly[h].revenue += s.totalPrice || 0;
        hourly[h].count += 1;
      });
      return { title: t("analytics.by_hour") || "Sales by Hour", subtitle: t("analytics.by_hour_desc") || "Peak revenue hours", data: hourly, dataKey: "label" };
    }
    if (granularity === "daily") {
      const dayNames = [t("analytics.day_sun"), t("analytics.day_mon"), t("analytics.day_tue"), t("analytics.day_wed"), t("analytics.day_thu"), t("analytics.day_fri"), t("analytics.day_sat")];
      const days = dayNames.map((n) => ({ label: n, revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const d = new Date(s.createdAt).getDay();
        days[d].revenue += s.totalPrice || 0;
        days[d].count += 1;
      });
      return { title: t("analytics.by_day") || "Sales by Day", subtitle: t("analytics.by_day_desc") || "Daily revenue pattern", data: days, dataKey: "label" };
    }
    if (granularity === "weekly") {
      const weeks = Array.from({ length: 5 }, (_, i) => ({ label: t("analytics.week_label", { number: i + 1 }), revenue: 0, count: 0 }));
      rawSales.forEach((s) => {
        const d = new Date(s.createdAt);
        const day = d.getDate();
        const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
        weeks[weekIdx].revenue += s.totalPrice || 0;
        weeks[weekIdx].count += 1;
      });
      return { title: t("analytics.by_week") || "Sales by Week", subtitle: t("analytics.by_week_desc") || "Weekly revenue pattern", data: weeks, dataKey: "label" };
    }
    const months = [t("common.month_jan"), t("common.month_feb"), t("common.month_mar"), t("common.month_apr"), t("common.month_may"), t("common.month_jun"), t("common.month_jul"), t("common.month_aug"), t("common.month_sep"), t("common.month_oct"), t("common.month_nov"), t("common.month_dec")];
    const monthly = months.map((n) => ({ label: n, revenue: 0, count: 0 }));
    rawSales.forEach((s) => {
      const m = new Date(s.createdAt).getMonth();
      monthly[m].revenue += s.totalPrice || 0;
      monthly[m].count += 1;
    });
    return { title: t("analytics.by_month") || "Sales by Month", subtitle: t("analytics.by_month_desc") || "Monthly revenue pattern", data: monthly, dataKey: "label" };
  }, [rawSales, period, currentRange, language]);
  const paymentMethodBreakdown = reactExports.useMemo(() => {
    if (!rawSales.length) return [];
    const groups = {};
    rawSales.forEach((sale) => {
      const method = (sale.paymentMethod || "cash").toLowerCase();
      groups[method] = (groups[method] || 0) + (sale.totalPrice || 0);
    });
    const total = Object.values(groups).reduce((s, v) => s + v, 0);
    return Object.entries(groups).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount,
      percentage: total > 0 ? amount / total * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);
  }, [rawSales]);
  const insights = reactExports.useMemo(() => {
    if (!data || !dashboardStats) return null;
    const todayRev = dashboardStats.todayRevenue || 0;
    const yestRev = dashboardStats.yesterdayRevenue || 0;
    let growth = 0;
    if (yestRev > 0) {
      growth = (todayRev - yestRev) / yestRev * 100;
    } else if (todayRev > 0) {
      growth = 100;
    }
    return {
      growth: (growth || 0).toFixed(1),
      isGrowthPositive: growth >= 0
    };
  }, [data, dashboardStats]);
  const handleCustomSearch = () => {
    if (dateRange.start && dateRange.end) {
      loadData(dateRange);
    }
  };
  const formattedRange = reactExports.useMemo(() => {
    if (!currentRange.start) return "";
    if (currentRange.start === currentRange.end)
      return formatDate(currentRange.start);
    return `${formatDate(currentRange.start)} - ${formatDate(currentRange.end)}`;
  }, [currentRange, formatDate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fade-in pb-24 relative min-h-screen bg-background text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 md:px-8 lg:px-12 max-w-[1800px] mx-auto flex flex-col gap-y-8 pt-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: t("tabs.analytics") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: t("analytics.subtitle") }),
        formattedRange && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-muted-foreground/30" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-primary uppercase tracking-wider", children: formattedRange })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl shadow-sm border-border bg-card text-card-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-3 flex flex-col lg:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex bg-muted p-1 rounded-xl w-fit border border-border", children: ["today", "week", "month", "year", "custom"].map(
          (p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setPeriod(p),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
              children: t(`analytics.${p}`)
            },
            p
          )
        ) }),
        period === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 bg-muted/50 p-2 rounded-xl border border-border animate-in fade-in slide-in-from-left-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "start",
                className: "text-xs font-bold uppercase text-muted-foreground",
                children: t("analytics.start_date")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DatePicker,
              {
                value: dateRange.start,
                onChange: (v) => setDateRange((prev) => ({ ...prev, start: v })),
                className: "w-auto bg-background border-none text-xs font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "end",
                className: "text-xs font-bold uppercase text-muted-foreground",
                children: t("analytics.end_date")
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DatePicker,
              {
                value: dateRange.end,
                onChange: (v) => setDateRange((prev) => ({ ...prev, end: v })),
                className: "w-auto bg-background border-none text-xs font-bold"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleCustomSearch,
              className: "self-end p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 14 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        insights && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold tracking-wider uppercase bg-muted text-foreground border border-border`,
            children: [
              insights.isGrowthPositive ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { size: 14 }),
              t("analytics.today_vs_yesterday"),
              ":",
              " ",
              Math.abs(Number(insights.growth)),
              "%",
              " ",
              insights.isGrowthPositive ? t("analytics.increase") : t("analytics.decrease")
            ]
          }
        ),
        lowStockItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold tracking-wider uppercase bg-muted text-foreground border border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { size: 14 }),
          t("analytics.low_on"),
          " ",
          lowStockItems.length,
          " ",
          t("analytics.products")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(KpiVisibility, { storageKey: "analytics-overview-kpis", children: (visible) => visible ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "text-xs font-bold uppercase tracking-widest",
              children: t(`analytics.${period}`)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1", children: t("common.sales") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground", children: [
          t("common.etb"),
          " ",
          (data?.summary?.totalRevenue || 0).toLocaleString()
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "text-xs font-bold uppercase tracking-widest",
              children: t(`analytics.${period}`)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1", children: t("common.profit") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground", children: [
          t("common.etb"),
          " ",
          (data?.summary?.totalProfit || 0).toLocaleString()
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col relative overflow-hidden group border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted rounded-xl text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "text-xs font-bold uppercase tracking-widest",
              children: t(`analytics.${period}`)
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1 relative z-10", children: t("analytics.net_today") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-2xl font-bold tracking-tight text-foreground relative z-10", children: [
          t("common.etb"),
          " ",
          (data?.summary?.netProfit || 0).toLocaleString()
        ] })
      ] }) })
    ] }) : null }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm border-border bg-gradient-to-t from-primary/5 to-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: t("analytics.payment_methods") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: paymentMethodBreakdown.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center text-center text-muted-foreground py-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { size: 24, className: "mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider", children: t("analytics.no_sales_data") })
      ] }) : paymentMethodBreakdown.map((pm, i) => {
        const isPredominant = i === 0 && pm.percentage > 50;
        const icon = pm.method === "Cash" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { size: 14 }) : pm.method === "Transfer" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { size: 14 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 14 });
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `p-1 rounded-lg ${isPredominant ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`,
                  children: icon
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `text-xs font-bold ${isPredominant ? "text-foreground" : "text-muted-foreground"}`,
                  children: pm.method
                }
              ),
              isPredominant && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase text-primary tracking-wider", children: t("analytics.most_used") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: `text-xs font-bold ${isPredominant ? "text-foreground" : ""}`,
                  children: [
                    t("common.etb"),
                    " ",
                    pm.amount.toLocaleString()
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-muted-foreground ml-2", children: [
                "(",
                pm.percentage.toFixed(1),
                "%)"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `h-full rounded-full transition-all duration-500 ${isPredominant ? "bg-primary" : "bg-muted-foreground/30"}`,
              style: { width: `${pm.percentage}%` }
            }
          ) })
        ] }, pm.method);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 md:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: t("analytics.sales_trend") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs uppercase font-bold tracking-wider", children: t("analytics.performance_over_time") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-muted-foreground/30" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold text-primary uppercase tracking-wider", children: formattedRange })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-foreground uppercase tracking-wider", children: t("common.sales") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-muted-foreground uppercase tracking-wider", children: t("common.profit") })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-[300px] w-full", children: chartData.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 32, className: "mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: t("analytics.no_chart_data") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1 opacity-60", children: t("analytics.no_trend") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", minHeight: 300, minWidth: 0, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        AreaChart,
        {
          data: chartData,
          margin: { top: 10, right: 10, left: -20, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "colorSales", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "stop",
                  {
                    offset: "5%",
                    stopColor: "var(--foreground)",
                    stopOpacity: 0.1
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "stop",
                  {
                    offset: "95%",
                    stopColor: "var(--foreground)",
                    stopOpacity: 0
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "linearGradient",
                {
                  id: "colorProfit",
                  x1: "0",
                  y1: "0",
                  x2: "0",
                  y2: "1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "stop",
                      {
                        offset: "5%",
                        stopColor: "var(--muted-foreground)",
                        stopOpacity: 0.15
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "stop",
                      {
                        offset: "95%",
                        stopColor: "var(--muted-foreground)",
                        stopOpacity: 0
                      }
                    )
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CartesianGrid,
              {
                strokeDasharray: "3 3",
                vertical: false,
                stroke: "var(--border)"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: "name",
                axisLine: false,
                tickLine: false,
                tick: {
                  fontSize: 9,
                  fill: "var(--muted-foreground)",
                  fontWeight: 700
                },
                dy: 10
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              YAxis,
              {
                axisLine: false,
                tickLine: false,
                tick: {
                  fontSize: 9,
                  fill: "var(--muted-foreground)",
                  fontWeight: 700
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                contentStyle: {
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                },
                itemStyle: {
                  color: "var(--foreground)",
                  fontSize: "12px",
                  fontWeight: 700
                },
                labelStyle: {
                  color: "var(--muted-foreground)",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: "6px"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Area,
              {
                type: "monotone",
                dataKey: "revenue",
                name: t("common.sales"),
                stroke: "var(--foreground)",
                fillOpacity: 1,
                fill: "url(#colorSales)",
                strokeWidth: 3
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Area,
              {
                type: "monotone",
                dataKey: "profit",
                name: t("common.profit"),
                stroke: "var(--muted-foreground)",
                fillOpacity: 1,
                fill: "url(#colorProfit)",
                strokeWidth: 2
              }
            )
          ]
        }
      ) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 md:p-8 flex flex-col h-full justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: t("analytics.debt_summary") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs uppercase font-bold tracking-wider mt-0.5", children: t("analytics.critical_metrics") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            isModuleEnabled("customers") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { size: 12, className: "text-foreground" }),
                t("analytics.customers_owe")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-3xl font-bold tracking-tight text-foreground", children: [
                t("common.etb"),
                " ",
                (dashboardStats?.activeDebts || 0).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px w-full bg-border" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TrendingDown,
                  {
                    size: 12,
                    className: "text-muted-foreground"
                  }
                ),
                t("analytics.you_owe")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-3xl font-bold tracking-tight text-muted-foreground", children: [
                t("common.etb"),
                " 0"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-4 bg-muted rounded-2xl border border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1", children: t("analytics.inventory_value") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base font-bold text-foreground", children: [
            t("common.etb"),
            " ",
            inventoryValue.toLocaleString()
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col h-full border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 flex flex-col h-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 20 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight uppercase tracking-wider text-foreground", children: t("analytics.inventory_status") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[300px]", children: lowStockItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { size: 24, className: "mb-2 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider", children: t("analytics.all_healthy") })
        ] }) : lowStockItems.slice(0, 15).map((item, i) => {
          const isOut = item.totalBaseQuantity <= 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: `w-1.5 h-1.5 rounded-full ${isOut ? "bg-foreground" : "bg-muted-foreground"}`
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate max-w-[150px] text-foreground", children: item.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
                      item.totalBaseQuantity,
                      " ",
                      t("analytics.left_in_stock")
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: `text-xs font-bold bg-muted text-foreground border-border`,
                    children: isOut ? t("analytics.out") : t("analytics.low")
                  }
                )
              ]
            },
            i
          );
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border bg-gradient-to-t from-primary/5 to-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 md:p-8 flex flex-col h-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: period === "today" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 20 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight text-foreground", children: salesDistribution.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs uppercase font-bold tracking-wider mt-0.5", children: salesDistribution.subtitle })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-h-[250px] w-full", children: salesDistribution.data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { size: 32, className: "mb-2 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest", children: t("analytics.no_chart_data") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", minHeight: 250, minWidth: 0, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        BarChart,
        {
          data: salesDistribution.data,
          margin: { top: 10, right: 10, left: -20, bottom: 0 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "colorDist", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "var(--primary)", stopOpacity: 0.9 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "var(--primary)", stopOpacity: 0.3 })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "var(--border)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: salesDistribution.dataKey,
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 700 },
                dy: 10,
                interval: salesDistribution.data.length > 12 ? 2 : 0
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              YAxis,
              {
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 700 }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                contentStyle: {
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                },
                itemStyle: { color: "var(--foreground)", fontSize: "12px", fontWeight: 700 },
                labelStyle: {
                  color: "var(--muted-foreground)",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: "6px"
                },
                formatter: (value) => [`${t("common.etb")} ${(value ?? 0).toLocaleString()}`, t("analytics.revenue")]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bar, { dataKey: "revenue", name: t("analytics.revenue"), fill: "url(#colorDist)", radius: [4, 4, 0, 0], maxBarSize: 30 })
          ]
        }
      ) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 flex flex-col h-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight uppercase tracking-wider text-foreground", children: t("analytics.top_products") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs font-bold", children: formattedRange })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[400px]", children: (data?.topItems || []).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { size: 24, className: "mb-2 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider", children: t("analytics.no_sales_data") })
        ] }) : (data?.topItems || []).slice(0, 8).map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 group", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors border border-border", children: [
            "#",
            i + 1
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate text-foreground", children: item.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
              item.totalQty,
              " ",
              t("analytics.units_sold")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-bold text-foreground", children: [
            t("common.etb"),
            " ",
            item.totalRevenue.toLocaleString()
          ] }) })
        ] }, i)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl shadow-sm flex flex-col border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-6 flex flex-col h-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-muted text-foreground rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight uppercase tracking-wider text-foreground", children: t("analytics.recent_activity") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs font-bold", children: formattedRange })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto space-y-0 pr-2 custom-scrollbar max-h-[400px]", children: recentActivity.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 24, className: "mb-2 opacity-20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider", children: t("analytics.no_activity") })
        ] }) : recentActivity.map((activity, i) => {
          const isSale = activity.type === "sale";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex gap-4 py-3 border-b border-border last:border-0",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative mt-0.5 h-fit", children: isSale && activity.itemImage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: activity.itemImage,
                      alt: activity.description || "Product",
                      className: "h-8 w-8 rounded-lg object-cover ring-1 ring-border"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 9 }) })
                ] }) : activity.userAvatar ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: resolveAvatar(activity.userAvatar),
                      alt: activity.userName || "User",
                      className: "h-8 w-8 rounded-full object-cover"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-border", children: isSale ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 9 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 9 }) })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-1.5 rounded-lg bg-muted text-foreground", children: isSale ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { size: 12 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { size: 12 }) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-0.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate max-w-[140px] capitalize text-foreground", children: t("dashboard." + activity.type) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "span",
                      {
                        className: `text-xs font-bold text-foreground`,
                        children: [
                          isSale ? "+" : "-",
                          t("common.etb"),
                          " ",
                          activity.amount.toLocaleString()
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground line-clamp-1", children: activity.description || activity.extra || t("analytics.system_update") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5", children: [
                    activity.userName && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: resolveAvatar(activity.userAvatar), alt: "", className: "h-4 w-4 rounded-full object-cover" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-bold", children: activity.userName })
                    ] }),
                    activity.userName ? " · " : "",
                    formatTime(activity.date),
                    " ",
                    "· ",
                    formatDate(activity.date)
                  ] })
                ] })
              ]
            },
            i
          );
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CategorySalesChart, { data: data?.categoryBreakdown || [] })
  ] }) });
};
export {
  Analytics as default
};
