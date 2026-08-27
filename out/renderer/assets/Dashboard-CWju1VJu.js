import { c as createLucideIcon, r as reactExports, a as clsx, u as useNotifications, b as useSettings, d as useNavigate, j as jsxRuntimeExports, B as Bell, e as Button, E as ExternalLink, X, C as CircleCheck, I as Info, f as CircleAlert, T as TriangleAlert, S as Sparkles, g as Badge, R as RefreshCw, L as LoaderCircle, h as Clock, i as Truck, U as Users, k as ChartColumn, P as PiggyBank, l as TrendingDown, m as Package, A as ArrowRight, n as useAuth, t as toEthiopianDate, o as getEthiopianMonthName, p as motion, q as RotateCcw, M as Modal, s as ShoppingBag, v as Receipt, w as getEthiopianDayName } from "./index-fMHJoXSU.js";
import { S as SectionCards } from "./section-cards-Bqgbso3Z.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent, d as CardDescription, e as CardAction } from "./card-MDpMDtbv.js";
import { A as Alert, a as AlertDescription, L as Lightbulb } from "./alert-D3sWeBgq.js";
import { Z as Zap } from "./zap-Bd36I3YH.js";
import { D as DollarSign } from "./dollar-sign-BDVWqeK-.js";
import { C as CalendarDays } from "./calendar-days-DVudZlmz.js";
import { C as Cell, u as useMouseEnterItemDispatch, a as useMouseLeaveItemDispatch, b as useMouseClickItemDispatch, A as Activity, B as BarChart, Y as YAxis, c as Bar } from "./BarChart-DfWA8j-6.js";
import { T as TrendingUp } from "./trending-up-_Lu774B_.js";
import { C as ChartContainer, a as ChartTooltipContent, T as ToggleGroup, b as ToggleGroupItem, c as ChartTooltip } from "./toggle-group-zBMeyqp0.js";
import { c as createSelector, p as pickAxisType, a as pickAxisId, i as itemAxisPredicate, s as selectBaseAxis, b as combineGraphicalItemsSettings, d as combineGraphicalItemsData, e as selectChartDataAndAlwaysIgnoreIndexes, f as combineDisplayedData, g as combineAppliedValues, h as getValueByDataKey, j as selectAllErrorBarSettings, k as selectChartDataSliceIgnoringIndexes, l as combineDomainOfAllAppliedNumericalValuesIncludingErrorValues, m as selectDomainDefinition, n as selectDomainFromUserPreference, o as selectChartLayout, q as combineNumericalDomain, r as selectStackOffsetType, t as combineAxisDomain, u as selectRenderableAxisSettings, v as selectRealScaleType, w as combineNiceTicks, x as combineAxisDomainWithNiceTicks, y as combineCheckedDomain, z as getTooltipNameProp, A as selectChartOffsetInternal, B as resolveDefaultProps, D as DefaultZIndexes, S as Sector, C as matchAppend, E as svgPropertiesNoEvents, R as RegisterGraphicalItemId, F as SetPolarGraphicalItem, G as get, H as interpolate, I as findAllByType, J as useAppSelector, K as SetPolarLegendPayload, L as Layer, Z as ZIndexLayer, M as SetTooltipEntrySettings, N as useAnimationCallbacks, O as usePolarChartLayout, P as AnimatedItems, Q as PolarLabelContextProvider, T as isNumber, U as mathSign, V as PolarLabelListContextProvider, W as selectActiveTooltipIndex, X as selectActiveTooltipDataKey, Y as selectActiveTooltipGraphicalItemId, _ as DATA_ITEM_GRAPHICAL_ITEM_ID_ATTRIBUTE_NAME, $ as DATA_ITEM_INDEX_ATTRIBUTE_NAME, a0 as adaptEventsOfChild, a1 as Shape, a2 as LabelListFromLabelProp, a3 as getMaxRadius, a4 as getPercentValue, a5 as polarToCartesian, a6 as svgPropertiesNoEventsFromUnknown, a7 as Curve, a8 as getClassNameFromUnknown, a9 as Text, aa as useAppDispatch, ab as updatePolarOptions, ac as RechartsStoreProvider, ad as ChartDataContextProvider, ae as ReportMainChartProps, af as ReportEventSettings, ag as ReportChartProps, ah as CategoricalChart, ai as initialEventSettingsState, aj as arrayTooltipSearcher, ak as Tooltip, al as CartesianGrid, am as XAxis } from "./CartesianChart-En-wnclD.js";
import { D as DataTable } from "./data-table-CASLwt9b.js";
import { B as Ban } from "./ban-C-pwfnLX.js";
import "./label-Ci33H1TS.js";
import "./select-n7mzR4VO.js";
import "./table-fDX-_jQy.js";
import "./tabs-fXD-jcqv.js";
import "./plus-DnJWnBIF.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowLeftRight = createLucideIcon("ArrowLeftRight", [
  ["path", { d: "M8 3 4 7l4 4", key: "9rb6wj" }],
  ["path", { d: "M4 7h16", key: "6tx8e3" }],
  ["path", { d: "m16 21 4-4-4-4", key: "siv7j2" }],
  ["path", { d: "M20 17H4", key: "h6l3hr" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CalendarRange = createLucideIcon("CalendarRange", [
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M17 14h-6", key: "bkmgh3" }],
  ["path", { d: "M13 18H7", key: "bb0bb7" }],
  ["path", { d: "M7 14h.01", key: "1qa3f1" }],
  ["path", { d: "M17 18h.01", key: "1bdyru" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const SlidersVertical = createLucideIcon("SlidersVertical", [
  ["line", { x1: "4", x2: "4", y1: "21", y2: "14", key: "1p332r" }],
  ["line", { x1: "4", x2: "4", y1: "10", y2: "3", key: "gb41h5" }],
  ["line", { x1: "12", x2: "12", y1: "21", y2: "12", key: "hf2csr" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "3", key: "1kfi7u" }],
  ["line", { x1: "20", x2: "20", y1: "21", y2: "16", key: "1lhrwl" }],
  ["line", { x1: "20", x2: "20", y1: "12", y2: "3", key: "16vvfq" }],
  ["line", { x1: "2", x2: "6", y1: "14", y2: "14", key: "1uebub" }],
  ["line", { x1: "10", x2: "14", y1: "8", y2: "8", key: "1yglbp" }],
  ["line", { x1: "18", x2: "22", y1: "16", y2: "16", key: "1jxqpz" }]
]);
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
    displayedData = cells.map((cell) => _objectSpread$3(_objectSpread$3({}, pieSettings.presentationProps), cell.props));
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
var _excluded$1 = ["key"], _excluded2 = ["onMouseEnter", "onClick", "onMouseLeave"], _excluded3 = ["id"], _excluded4 = ["id"];
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
    return sectorTooltipPayload.map((item) => _objectSpread$2(_objectSpread$2({}, item), {}, {
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
  var otherProps = _objectWithoutProperties$1(props, _excluded$1);
  return /* @__PURE__ */ reactExports.createElement(Curve, _extends$1({}, otherProps, {
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
  return /* @__PURE__ */ reactExports.createElement(Text, _extends$1({}, props, {
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
    var labelProps = _objectSpread$2(_objectSpread$2(_objectSpread$2(_objectSpread$2({}, pieProps), entry), {}, {
      // @ts-expect-error customLabelProps is contributing unknown props
      stroke: "none"
    }, customLabelProps), {}, {
      index: i,
      textAnchor: getTextAnchor(endPoint.x, entry.cx)
    }, endPoint);
    var lineProps = _objectSpread$2(_objectSpread$2(_objectSpread$2(_objectSpread$2({}, pieProps), entry), {}, {
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
  var onMouseEnterFromProps = allOtherPieProps.onMouseEnter, onItemClickFromProps = allOtherPieProps.onClick, onMouseLeaveFromProps = allOtherPieProps.onMouseLeave, restOfAllOtherProps = _objectWithoutProperties$1(allOtherPieProps, _excluded2);
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
    var sectorProps = _objectSpread$2(_objectSpread$2({}, entry), {}, {
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
    return /* @__PURE__ */ reactExports.createElement(Layer, _extends$1({
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
      var entryWithCellInfo = _objectSpread$2(_objectSpread$2({}, entry), cells && cells[i] && cells[i].props);
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
      prev = _objectSpread$2(_objectSpread$2(_objectSpread$2(_objectSpread$2({}, pieSettings.presentationProps), {}, {
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
      var latest = _objectSpread$2(_objectSpread$2({}, item.next), {}, {
        startAngle: curAngle + paddingAngle,
        endAngle: curAngle + angle + paddingAngle
      });
      stepData.push(latest);
      curAngle = latest.endAngle;
    } else {
      var deltaAngle = interpolate(0, item.next.endAngle - item.next.startAngle, animationElapsedTime);
      var _latest = _objectSpread$2(_objectSpread$2({}, item.next), {}, {
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
  var id = props.id, propsWithoutId = _objectWithoutProperties$1(props, _excluded3);
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
    props: _objectSpread$2(_objectSpread$2({}, propsWithoutId), {}, {
      sectors
    }),
    previousSectorsRef,
    id
  })));
}
function PieFn(outsideProps) {
  var props = resolveDefaultProps(outsideProps, defaultPieProps);
  var externalId = props.id, propsWithoutId = _objectWithoutProperties$1(props, _excluded4);
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
  }), /* @__PURE__ */ reactExports.createElement(SetPiePayloadLegend, _extends$1({}, propsWithoutId, {
    id
  })), /* @__PURE__ */ reactExports.createElement(PieImpl, _extends$1({}, propsWithoutId, {
    id
  }))));
}
var Pie = PieFn;
Pie.displayName = "Pie";
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
var allowedTooltipTypes = ["item"];
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
    validateTooltipEventTypes: allowedTooltipTypes,
    tooltipPayloadSearcher: arrayTooltipSearcher,
    categoricalChartProps: propsWithDefaults,
    ref
  });
});
const SEVERITY_STYLES = {
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-amber-600" }) },
  error: { bg: "bg-red-500/10", border: "border-red-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-5 w-5 text-red-600" }) },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-5 w-5 text-blue-600" }) },
  success: { bg: "bg-green-500/10", border: "border-green-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-green-600" }) }
};
const DashboardAlerts = ({ maxItems = 6, showHeader = true }) => {
  const { dashboardAlerts, dismissAlert } = useNotifications();
  const { t } = useSettings();
  const navigate = useNavigate();
  if (dashboardAlerts.length === 0) return null;
  const visible = dashboardAlerts.slice(0, maxItems);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "@container/card", children: [
    showHeader && /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
      t("notifications.alerts_title"),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground ml-2", children: [
        dashboardAlerts.length,
        " ",
        t("notifications.alerts_active")
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-2", children: visible.map((a) => {
      const style = SEVERITY_STYLES[a.type] || SEVERITY_STYLES.info;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 mt-0.5", children: style.icon }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: a.title }),
                a.count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-background/60", children: a.count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: a.message }),
              a.actionUrl && a.actionLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => navigate(a.actionUrl),
                  className: "h-6 mt-2 text-xs",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3 mr-1" }),
                    a.actionLabel
                  ]
                }
              )
            ] }),
            a.dismissible && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => dismissAlert(a.id),
                className: "h-6 w-6 flex-shrink-0",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
              }
            )
          ]
        },
        a.id
      );
    }) })
  ] });
};
const INSIGHT_CONFIG = {
  low_stock: { icon: Package, gradient: "from-amber-500/20 to-amber-600/10" },
  out_of_stock: { icon: TriangleAlert, gradient: "from-red-500/20 to-red-600/10" },
  best_sellers: { icon: TrendingUp, gradient: "from-green-500/20 to-green-600/10" },
  top_profit: { icon: DollarSign, gradient: "from-emerald-500/20 to-emerald-600/10" },
  slow_moving: { icon: Activity, gradient: "from-orange-500/20 to-orange-600/10" },
  overstocked: { icon: Package, gradient: "from-blue-500/20 to-blue-600/10" },
  expense_increase: { icon: TrendingDown, gradient: "from-red-500/20 to-red-600/10" },
  budget_overrun: { icon: PiggyBank, gradient: "from-rose-500/20 to-rose-600/10" },
  sales_decline: { icon: ChartColumn, gradient: "from-red-500/20 to-red-600/10" },
  top_customers: { icon: Users, gradient: "from-purple-500/20 to-purple-600/10" },
  supplier_performance: { icon: Truck, gradient: "from-orange-500/20 to-orange-600/10" },
  daily_summary: { icon: Clock, gradient: "from-sky-500/20 to-sky-600/10" },
  weekly_summary: { icon: CalendarDays, gradient: "from-indigo-500/20 to-indigo-600/10" },
  monthly_summary: { icon: CalendarRange, gradient: "from-violet-500/20 to-violet-600/10" },
  profit_suggestion: { icon: Lightbulb, gradient: "from-yellow-500/20 to-yellow-600/10" },
  cash_flow: { icon: DollarSign, gradient: "from-teal-500/20 to-teal-600/10" },
  seasonal_trend: { icon: Zap, gradient: "from-cyan-500/20 to-cyan-600/10" }
};
const SEVERITY_BADGE = {
  critical: { variant: "destructive", labelKey: "business_assistant.severity_critical" },
  warning: { variant: "default", labelKey: "business_assistant.severity_warning" },
  success: { variant: "secondary", labelKey: "business_assistant.severity_insight" },
  info: { variant: "outline", labelKey: "business_assistant.severity_info" }
};
function BusinessAssistant() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [insights, setInsights] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api?.getBusinessInsights() || [];
      setInsights(data);
    } catch (e) {
      setError(e.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadInsights();
  }, []);
  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-2 border-primary/10 shadow-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm", children: t("business_assistant.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-black uppercase tracking-widest", children: t("business_assistant.subtitle") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        criticalCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs px-1.5 h-5", children: t("business_assistant.critical_count", "{count} critical").replace("{count}", String(criticalCount)) }),
        warningCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", className: "text-xs px-1.5 h-5 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30", children: t("business_assistant.alerts_count", "{count} alerts").replace("{count}", String(warningCount)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: loadInsights, disabled: loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${loading ? "animate-spin" : ""}` }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-muted-foreground" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadInsights, className: "mt-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3 w-3 mr-1" }),
        " ",
        t("business_assistant.retry")
      ] })
    ] }) : insights.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-10 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-8 w-8 mb-3 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: t("business_assistant.no_insights") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: t("business_assistant.no_insights_desc") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: insights.map((insight, idx) => {
      const cfg = INSIGHT_CONFIG[insight.type] || { icon: Sparkles, gradient: "from-primary/10 to-primary/5" };
      const badge = SEVERITY_BADGE[insight.severity] || SEVERITY_BADGE.info;
      const Icon = cfg.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `group relative p-4 rounded-xl border bg-gradient-to-br ${cfg.gradient} hover:shadow-md transition-all cursor-pointer`,
          onClick: () => {
            if (insight.action?.route) {
              navigate(insight.action.route);
            }
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-background/80 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-foreground" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold truncate", children: insight.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: badge.variant, className: "text-xs h-4 px-1 shrink-0", children: t(badge.labelKey) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: insight.message }),
              insight.action && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity", children: [
                insight.action.label,
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
              ] })
            ] })
          ] })
        },
        idx
      );
    }) }) })
  ] });
}
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
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.28, 0, 0.22, 1]
    }
  }
};
const Dashboard = () => {
  const { t, formatDate, calendarType, language } = useSettings();
  const { currentAdmin } = useAuth();
  const [stats, setStats] = reactExports.useState(null);
  const [analytics, setAnalytics] = reactExports.useState(null);
  const [recentActivity, setRecentActivity] = reactExports.useState([]);
  const [selectedActivity, setSelectedActivity] = reactExports.useState(null);
  const [showActivityDetail, setShowActivityDetail] = reactExports.useState(false);
  const [empStats, setEmpStats] = reactExports.useState(null);
  const [supplierStats, setSupplierStats] = reactExports.useState(null);
  const [supplierUnpaidOrders, setSupplierUnpaidOrders] = reactExports.useState([]);
  const [supplierPaymentAlerts, setSupplierPaymentAlerts] = reactExports.useState([]);
  const [supplierLowStock, setSupplierLowStock] = reactExports.useState([]);
  const [reversalStats, setReversalStats] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [revPeriod, setRevPeriod] = reactExports.useState("week");
  const greeting = reactExports.useMemo(() => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    if (hour < 12) return "good_morning";
    if (hour < 17) return "good_afternoon";
    return "good_evening";
  }, []);
  reactExports.useEffect(() => {
    loadData();
  }, []);
  reactExports.useEffect(() => {
    window.api?.getAnalytics(revPeriod === "week" ? "month" : revPeriod).then((data) => setAnalytics(data || { salesData: [] }));
  }, [revPeriod]);
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statData, anData, activity, employees, suppliers, unpaidOrders, paymentAlerts, lowStock, revStats] = await Promise.all([
        window.api?.getDashboardStats() || Promise.resolve({}),
        window.api?.getAnalytics("month") || Promise.resolve({ salesData: [], topItems: [] }),
        window.api?.getRecentActivity(5) || Promise.resolve([]),
        window.api?.getEmployeeStats() || Promise.resolve(null),
        window.api?.getSupplierDashboardStats() || Promise.resolve(null),
        window.api?.getSupplierUnpaidOrders() || Promise.resolve([]),
        window.api?.getSupplierPaymentDueAlerts() || Promise.resolve([]),
        window.api?.getSupplierLowStock() || Promise.resolve([]),
        window.api?.getReversalStats() || Promise.resolve(null)
      ]);
      setStats(statData);
      setAnalytics(anData);
      setRecentActivity(activity);
      setEmpStats(employees);
      setSupplierStats(suppliers);
      setSupplierUnpaidOrders(unpaidOrders);
      setSupplierPaymentAlerts(paymentAlerts);
      setSupplierLowStock(lowStock);
      setReversalStats(revStats);
    } catch (e) {
      setError(e.message || t("dashboard.load_error"));
    } finally {
      setLoading(false);
    }
  };
  const revenueChartData = reactExports.useMemo(() => {
    if (!analytics?.salesData) return [];
    const salesData = analytics.salesData;
    if (revPeriod === "week") {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const sun = new Date(now);
      sun.setDate(now.getDate() - now.getDay());
      sun.setHours(0, 0, 0, 0);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sun);
        d.setDate(sun.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const sale = salesData.find((s) => s.date === dateStr);
        let label;
        if (calendarType === "ethiopian") {
          label = getEthiopianDayName(i, language);
        } else {
          const loc = language === "am" ? "am-ET" : language === "om" ? "om-ET" : language === "ti" ? "ti-ET" : "en-US";
          label = d.toLocaleDateString(loc, { weekday: "short" });
        }
        days.push({ label, revenue: sale?.revenue || 0, isToday: dateStr === todayStr });
      }
      return days;
    }
    if (revPeriod === "month") {
      const now = /* @__PURE__ */ new Date();
      const todayStr = now.toISOString().split("T")[0];
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const weeks = [];
      let ws = new Date(first);
      let wn = 1;
      while (ws <= last && wn <= 5) {
        const we = new Date(ws);
        we.setDate(ws.getDate() + 6);
        if (we > last) we.setTime(last.getTime());
        let rev = 0;
        salesData.forEach((s) => {
          const sd = new Date(s.date);
          if (sd >= ws && sd <= we) rev += s.revenue;
        });
        const weStr = we.toISOString().split("T")[0];
        const wsStr = ws.toISOString().split("T")[0];
        weeks.push({ label: `${t("analytics.week")} ${wn}`, revenue: rev, isToday: todayStr >= wsStr && todayStr <= weStr });
        ws = new Date(we);
        ws.setDate(ws.getDate() + 1);
        wn++;
      }
      return weeks;
    }
    if (calendarType === "ethiopian") {
      const ethNow = toEthiopianDate(/* @__PURE__ */ new Date());
      const months = [];
      for (let m = 1; m <= 13; m++) {
        let rev = 0;
        salesData.forEach((s) => {
          const eth = toEthiopianDate(new Date(s.date));
          if (eth.month === m) rev += s.revenue;
        });
        months.push({ label: getEthiopianMonthName(m - 1, language), revenue: rev, isToday: m === ethNow.month });
      }
      return months;
    } else {
      const now = /* @__PURE__ */ new Date();
      const curMonth = now.getMonth();
      const loc = language === "am" ? "am-ET" : language === "om" ? "om-ET" : language === "ti" ? "ti-ET" : "en-US";
      const months = [];
      for (let m = 0; m < 12; m++) {
        const md = new Date(now.getFullYear(), m, 1);
        let rev = 0;
        salesData.forEach((s) => {
          const sd = new Date(s.date);
          if (sd.getMonth() === m && sd.getFullYear() === now.getFullYear()) rev += s.revenue;
        });
        months.push({ label: md.toLocaleDateString(loc, { month: "short" }), revenue: rev, isToday: m === curMonth });
      }
      return months;
    }
  }, [analytics, revPeriod, calendarType, language]);
  const chartConfig = {
    revenue: { label: t("sales.revenue"), color: "var(--primary)" }
  };
  const kpiCards = reactExports.useMemo(() => [
    {
      title: t("sales.revenue"),
      value: `${t("common.etb")} ${(stats?.todayRevenue || 0).toLocaleString()}`,
      trend: stats?.yesterdayRevenue > 0 ? `${((Number(stats.todayRevenue || 0) - Number(stats.yesterdayRevenue || 0)) / Number(stats.yesterdayRevenue || 0) * 100).toFixed(1)}%` : "0%",
      trendType: Number(stats?.todayRevenue || 0) >= Number(stats?.yesterdayRevenue || 0) ? "up" : "down",
      footerTitle: t("dashboard.today_revenue"),
      footerSub: `${t("dashboard.yesterday")}: ${t("common.etb")} ${(stats?.yesterdayRevenue || 0).toLocaleString()}`
    },
    {
      title: t("sales.profit"),
      value: `${t("common.etb")} ${(stats?.todayProfit || 0).toLocaleString()}`,
      trend: stats?.yesterdayProfit > 0 ? `${((Number(stats.todayProfit || 0) - Number(stats.yesterdayProfit || 0)) / Number(stats.yesterdayProfit || 0) * 100).toFixed(1)}%` : "0%",
      trendType: Number(stats?.todayProfit || 0) >= Number(stats?.yesterdayProfit || 0) ? "up" : "down",
      footerTitle: t("dashboard.gross_profit"),
      footerSub: `${t("dashboard.yesterday")}: ${t("common.etb")} ${(stats?.yesterdayProfit || 0).toLocaleString()}`
    },
    {
      title: t("sales.transactions"),
      value: (stats?.todaySales || 0).toLocaleString(),
      trend: stats?.yesterdaySales > 0 ? `${((Number(stats.todaySales || 0) - Number(stats.yesterdaySales || 0)) / Number(stats.yesterdaySales || 0) * 100).toFixed(1)}%` : "0%",
      trendType: Number(stats?.todaySales || 0) >= Number(stats?.yesterdaySales || 0) ? "up" : "down",
      footerTitle: t("dashboard.units_sold"),
      footerSub: `${t("dashboard.yesterday")}: ${stats?.yesterdaySales || 0}`
    },
    {
      title: t("inventory.low"),
      value: stats?.lowStock || 0,
      trend: stats?.lowStock > 5 ? t("dashboard.trend_high") : t("dashboard.trend_normal"),
      trendType: stats?.lowStock > 5 ? "up" : "down",
      footerTitle: t("dashboard.low_stock"),
      footerSub: t("inventory.refill_needed")
    }
  ], [stats]);
  const columns = [
    {
      accessorKey: "description",
      header: t("common.description"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "font-medium text-sm hover:text-primary transition-colors text-left cursor-pointer",
          onClick: () => {
            setSelectedActivity(row.original);
            setShowActivityDetail(true);
          },
          children: row.original.description
        }
      )
    },
    {
      accessorKey: "type",
      header: t("common.category"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "cursor-pointer", onClick: () => {
        setSelectedActivity(row.original);
        setShowActivityDetail(true);
      }, children: t(`dashboard.${row.original.type.toLowerCase()}`) })
    },
    {
      accessorKey: "amount",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.amount") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right font-medium tabular-nums cursor-pointer", onClick: () => {
        setSelectedActivity(row.original);
        setShowActivityDetail(true);
      }, children: [
        t("common.etb"),
        " ",
        row.original.amount.toLocaleString()
      ] })
    },
    {
      accessorKey: "extra",
      header: t("common.details"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/70 cursor-pointer", onClick: () => {
        setSelectedActivity(row.original);
        setShowActivityDetail(true);
      }, children: row.original.extra || t("dashboard.system_entry") })
    },
    {
      accessorKey: "date",
      header: t("common.date"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs tabular-nums cursor-pointer", onClick: () => {
        setSelectedActivity(row.original);
        setShowActivityDetail(true);
      }, children: formatDate(new Date(row.original.date), { month: "short", day: "numeric" }) })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    motion.div,
    {
      className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6",
      variants: containerVariants,
      initial: "hidden",
      animate: "visible",
      children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadData, className: "mt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
          " ",
          t("common.retry")
        ] })
      ] }) : !stats ? /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { variants: itemVariants, className: "flex flex-col items-center justify-center py-20 text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-12 w-12 mb-4 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-medium", children: t("common.no_data") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl md:text-2xl font-semibold tracking-tight", children: [
              t(`dashboard.${greeting}`),
              ", ",
              currentAdmin?.name?.split(" ")[0] || "Admin"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground/70 mt-0.5", children: t("dashboard.welcome") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex items-center gap-2 text-xs text-muted-foreground/60", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium tabular-nums", children: formatDate(/* @__PURE__ */ new Date(), { weekday: "long", month: "long", day: "numeric", year: "numeric" }) })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardAlerts, {}) }),
        empStats && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-tutorial-section": "employee-stats", className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
          { label: t("dashboard.total_employees"), value: empStats.total || 0, color: "text-foreground" },
          { label: t("common.active"), value: empStats.active || 0, color: "text-emerald-600" },
          { label: t("dashboard.online_now"), value: empStats.online || 0, color: "text-primary" },
          { label: t("dashboard.clocked_in"), value: empStats.clockedIn || 0, color: "text-amber-600" },
          { label: t("common.pending"), value: empStats.pendingApprovals || 0, color: "text-destructive" }
        ].map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/40 bg-card/50 p-4 space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground/70", children: item.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-2xl font-semibold tracking-tight tabular-nums ${item.color}`, children: item.value })
        ] }, idx)) }) }),
        reversalStats && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { "data-tutorial-section": "reversals", variants: itemVariants, className: "px-4 lg:px-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeftRight, { className: "h-3.5 w-3.5" }),
            " ",
            t("reports.reversals")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3", children: [
            { label: t("reports.voided_sales"), value: reversalStats.voidedSales || 0, icon: Ban },
            { label: t("dashboard.reversed_payments"), value: reversalStats.reversedPayments || 0, icon: RotateCcw },
            { label: t("dashboard.reversed_adjustments"), value: reversalStats.reversedAdjustments || 0, icon: RotateCcw }
          ].map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/40 bg-card/50 p-3.5 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "h-3 w-3" }),
              " ",
              item.label
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-semibold tracking-tight tabular-nums", children: item.value })
          ] }, idx)) })
        ] }),
        supplierStats && /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { "data-tutorial-section": "suppliers", variants: itemVariants, className: "px-4 lg:px-6 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-3.5 w-3.5" }),
              t("suppliers.title")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => window.location.hash = "/suppliers", className: "text-xs", children: [
              t("common.view_all"),
              " →"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", children: [
            { label: t("suppliers.kpi_total"), value: supplierStats.totalSuppliers || 0 },
            { label: t("suppliers.kpi_active"), value: supplierStats.activeSuppliers || 0, color: "text-emerald-600" },
            { label: t("suppliers.kpi_outstanding"), value: `${t("common.etb")} ${(supplierStats.outstandingBalance || 0).toLocaleString()}`, color: "text-destructive", small: true },
            { label: t("suppliers.kpi_month"), value: `${t("common.etb")} ${(supplierStats.monthPurchases || 0).toLocaleString()}`, small: true },
            { label: t("suppliers.kpi_top"), value: supplierStats.topSupplier?.supplierName || "-", small: true },
            { label: t("suppliers.kpi_recent"), value: (supplierStats.recent || []).length }
          ].map((item, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/40 bg-card/50 p-3.5 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium uppercase tracking-wider text-muted-foreground/70", children: item.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `${item.small ? "text-sm" : "text-xl"} font-semibold tracking-tight tabular-nums ${item.color || ""} truncate`, children: item.value })
          ] }, idx)) }),
          supplierUnpaidOrders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-tutorial-section": "unpaid-supplier-orders", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-destructive" }),
              t("dashboard.unpaid_supplier_orders", { count: supplierUnpaidOrders.length })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("suppliers.col_supplier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("reports.header_order_num") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("common.balance") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("common.due") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: supplierUnpaidOrders.slice(0, 5).map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/20 hover:bg-muted/10 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs font-medium", children: o.supplierName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs font-mono text-muted-foreground", children: o.purchaseNumber || `#${o.id}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2.5 text-right text-xs text-destructive font-semibold tabular-nums", children: [
                  t("common.etb"),
                  " ",
                  o.remainingBalance.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs text-muted-foreground", children: o.dueDate ? formatDate(o.dueDate) : "-" })
              ] }, o.id)) })
            ] }) }) })
          ] }),
          supplierPaymentAlerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-500" }),
              t("dashboard.payment_due_alerts")
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("suppliers.col_supplier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("reports.header_order_num") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("common.amount") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("dashboard.due_in") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: supplierPaymentAlerts.slice(0, 5).map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/20 hover:bg-muted/10 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs font-medium", children: a.supplierName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs font-mono text-muted-foreground", children: a.purchaseNumber || `#${a.id}` }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2.5 text-right text-xs text-amber-600 font-semibold tabular-nums", children: [
                  t("common.etb"),
                  " ",
                  a.remainingBalance.toLocaleString()
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-right text-xs", children: a.daysUntilDue !== null && a.daysUntilDue !== void 0 ? a.daysUntilDue <= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-xs", children: t("common.overdue") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-600 font-semibold tabular-nums", children: [
                  a.daysUntilDue,
                  " ",
                  t("common.days")
                ] }) : "-" })
              ] }, a.id)) })
            ] }) }) })
          ] }),
          supplierLowStock.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-amber-500" }),
              t("dashboard.low_stock_supplier")
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("inventory.product") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("suppliers.col_supplier") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("common.stock") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70", children: t("common.category") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: supplierLowStock.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/20 hover:bg-muted/10 transition-colors", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs font-medium", children: p.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs text-muted-foreground", children: p.supplierName }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2.5 text-right text-xs text-destructive font-semibold tabular-nums", children: [
                  p.totalBaseQuantity,
                  " ",
                  p.baseUnit
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2.5 text-xs text-muted-foreground/70", children: p.categoryName || "-" })
              ] }, p.id)) })
            ] }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { "data-tutorial-section": "business-assistant", variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BusinessAssistant, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-tutorial-section": "revenue-chart", className: "@container/card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("dashboard.revenue_intelligence") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden @[540px]/card:block", children: t("dashboard.performance_analysis") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "@[540px]/card:hidden", children: t("dashboard.performance_analysis") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardAction, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              ToggleGroup,
              {
                type: "single",
                value: revPeriod,
                onValueChange: (v) => v && setRevPeriod(v),
                className: "*:data-[slot=toggle-group-item]:px-4!",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "week", children: t("analytics.week") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "month", children: t("analytics.month") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleGroupItem, { value: "year", children: t("analytics.year") })
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-2 pt-4 sm:px-6 sm:pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartContainer, { config: chartConfig, className: "aspect-auto h-[250px] w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: revenueChartData, barGap: 4, barCategoryGap: "20%", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3", stroke: "var(--border)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              XAxis,
              {
                dataKey: "label",
                tickLine: false,
                axisLine: false,
                tickMargin: 8,
                className: "text-xs"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              YAxis,
              {
                tickLine: false,
                axisLine: false,
                tickFormatter: (v) => (v ?? 0) >= 1e3 ? `${((v ?? 0) / 1e3).toFixed(0)}k` : `${v ?? 0}`,
                width: 40,
                className: "text-xs"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ChartTooltip,
              {
                cursor: { fill: "var(--muted)", opacity: 0.3 },
                content: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartTooltipContent, { indicator: "dot" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Bar,
              {
                dataKey: "revenue",
                radius: [8, 8, 0, 0],
                maxBarSize: 48,
                children: revenueChartData.map((entry, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Cell,
                  {
                    fill: entry.isToday ? "var(--primary)" : "var(--primary)",
                    opacity: entry.isToday ? 1 : 0.3
                  },
                  idx
                ))
              }
            )
          ] }) }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { "data-tutorial-section": "category-sales", variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CategorySalesChart, { data: analytics?.categoryBreakdown || [] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { "data-tutorial-section": "recent-activity", variants: itemVariants, className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DataTable,
          {
            columns,
            data: recentActivity,
            title: t("dashboard.recent_activity"),
            addLabel: t("sales.new_btn"),
            onAddClick: () => {
            }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showActivityDetail, onClose: () => setShowActivityDetail(false), title: t("common.details"), size: "md", children: selectedActivity && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          motion.div,
          {
            className: "space-y-6",
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3 },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl bg-muted/30 border border-border/40 flex items-center gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: selectedActivity.type === "sale" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-6 w-6 text-primary" }) : selectedActivity.type === "expense" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-6 w-6 text-destructive" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { className: "h-6 w-6 text-amber-500" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-base", children: selectedActivity.description }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "mt-1 capitalize", children: selectedActivity.type })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-border/30 bg-card/50", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1", children: t("common.amount") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-semibold tabular-nums text-primary", children: [
                    t("common.etb"),
                    " ",
                    selectedActivity.amount.toLocaleString()
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-border/30 bg-card/50", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1", children: t("common.date") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-semibold", children: formatDate(new Date(selectedActivity.date), { weekday: "long", month: "long", day: "numeric", year: "numeric" }) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-border/30 bg-card/50 col-span-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1", children: t("common.details") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: selectedActivity.extra || t("dashboard.system_entry") })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowActivityDetail(false), className: "w-full h-10 font-semibold", children: t("inventory.close_specs") })
            ]
          }
        ) })
      ] })
    }
  );
};
export {
  Dashboard as default
};
