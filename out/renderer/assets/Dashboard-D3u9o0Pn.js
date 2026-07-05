import { c as createLucideIcon, r as reactExports, a as clsx, u as useNotifications, b as useSettings, d as useNavigate, j as jsxRuntimeExports, B as Bell, e as Button, E as ExternalLink, X, C as CircleCheck, I as Info, f as CircleAlert, T as TriangleAlert, t as toast, g as Badge, h as Trash2, i as ChartColumn, k as cn, l as cva, m as useAuth, n as toEthiopianDate, o as getEthiopianMonthName, L as LoaderCircle, R as RefreshCw, p as Clock, q as Truck, P as Package, M as Modal, S as ShoppingBag, s as Receipt, v as getEthiopianDayName } from "./index-DPdLjKpV.js";
import { S as SectionCards } from "./section-cards-CXQ8xP9s.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent, d as CardDescription, e as CardAction } from "./card-C6dz2yia.js";
import { C as Cell, u as useMouseEnterItemDispatch, a as useMouseLeaveItemDispatch, b as useMouseClickItemDispatch, S as Shape, Z as Zap, A as Activity, B as BarChart, Y as YAxis, c as Bar } from "./BarChart-DV-dj94o.js";
import { D as Database } from "./database-Cd8INK0U.js";
import { C as ChartContainer, a as ChartTooltipContent, T as ToggleGroup, b as ToggleGroupItem, c as ChartTooltip } from "./toggle-group-BIdxIQms.js";
import { c as createSelector, p as pickAxisType, a as pickAxisId, i as itemAxisPredicate, s as selectBaseAxis, b as combineGraphicalItemsSettings, d as combineGraphicalItemsData, e as selectChartDataAndAlwaysIgnoreIndexes, f as combineDisplayedData, g as combineAppliedValues, h as getValueByDataKey, j as selectAllErrorBarSettings, k as selectChartDataSliceIgnoringIndexes, l as combineDomainOfAllAppliedNumericalValuesIncludingErrorValues, m as selectDomainDefinition, n as selectDomainFromUserPreference, o as selectChartLayout, q as combineNumericalDomain, r as selectStackOffsetType, t as combineAxisDomain, u as selectRenderableAxisSettings, v as selectRealScaleType, w as combineNiceTicks, x as combineAxisDomainWithNiceTicks, y as combineCheckedDomain, z as getTooltipNameProp, A as selectChartOffsetInternal, B as resolveDefaultProps, D as DefaultZIndexes, C as svgPropertiesNoEvents, R as RegisterGraphicalItemId, S as SetPolarGraphicalItem, E as findAllByType, F as useAppSelector, G as SetPolarLegendPayload, L as Layer, Z as ZIndexLayer, H as SetTooltipEntrySettings, I as useAnimationId, J as JavascriptAnimate, K as get, M as interpolate, N as isNumber, O as mathSign, P as PolarLabelListContextProvider, Q as selectActiveTooltipIndex, T as selectActiveTooltipDataKey, U as selectActiveTooltipGraphicalItemId, V as DATA_ITEM_GRAPHICAL_ITEM_ID_ATTRIBUTE_NAME, W as DATA_ITEM_INDEX_ATTRIBUTE_NAME, X as adaptEventsOfChild, Y as LabelListFromLabelProp, _ as getMaxRadius, $ as getPercentValue, a0 as polarToCartesian, a1 as svgPropertiesNoEventsFromUnknown, a2 as Curve, a3 as getClassNameFromUnknown, a4 as Text, a5 as useAppDispatch, a6 as updatePolarOptions, a7 as RechartsStoreProvider, a8 as ChartDataContextProvider, a9 as ReportMainChartProps, aa as ReportEventSettings, ab as ReportChartProps, ac as CategoricalChart, ad as initialEventSettingsState, ae as arrayTooltipSearcher, af as Tooltip, ag as CartesianGrid, ah as XAxis } from "./CartesianChart-WCLUkmH4.js";
import { D as DataTable } from "./data-table-3pkaF_Iq.js";
import { B as Ban } from "./ban-BcaS5OQd.js";
import { R as RotateCcw } from "./rotate-ccw-CS_AOsI-.js";
import { D as DollarSign } from "./dollar-sign-BWuFOZLW.js";
import "./label-CSHlh50h.js";
import "./select-DhYsHDwr.js";
import "./table-CNxhYHek.js";
import "./tabs-BqQnFl_p.js";
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
  var {
    chartData
  } = _ref;
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
  var {
    fill
  } = activeShape;
  return typeof fill === "string" ? fill : void 0;
}
var SetPieTooltipEntrySettings = /* @__PURE__ */ reactExports.memo((_ref) => {
  var {
    dataKey,
    nameKey,
    sectors,
    stroke,
    strokeWidth,
    fill,
    name,
    hide,
    tooltipType,
    id,
    activeShape
  } = _ref;
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
  var {
    top,
    left,
    width,
    height
  } = offset;
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
  var {
    key
  } = props, otherProps = _objectWithoutProperties$1(props, _excluded$1);
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
  var {
    sectors,
    props,
    showLabels
  } = _ref2;
  var {
    label,
    labelLine,
    dataKey
  } = props;
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
  var {
    sectors,
    props,
    showLabels
  } = _ref3;
  var {
    label
  } = props;
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
  var {
    sectors,
    activeShape,
    inactiveShape: inactiveShapeProp,
    allOtherPieProps,
    shape,
    id
  } = props;
  var activeIndex = useAppSelector(selectActiveTooltipIndex);
  var activeDataKey = useAppSelector(selectActiveTooltipDataKey);
  var activeGraphicalItemId = useAppSelector(selectActiveTooltipGraphicalItemId);
  var {
    onMouseEnter: onMouseEnterFromProps,
    onClick: onItemClickFromProps,
    onMouseLeave: onMouseLeaveFromProps
  } = allOtherPieProps, restOfAllOtherProps = _objectWithoutProperties$1(allOtherPieProps, _excluded2);
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
    }), /* @__PURE__ */ reactExports.createElement(Shape, _extends$1({
      option: shape !== null && shape !== void 0 ? shape : sectorOptions,
      index: i,
      shapeType: "sector",
      isActive
    }, sectorProps)));
  }));
}
function computePieSectors(_ref4) {
  var _pieSettings$paddingA;
  var {
    pieSettings,
    displayedData,
    cells,
    offset
  } = _ref4;
  var {
    cornerRadius,
    startAngle,
    endAngle,
    dataKey,
    nameKey,
    tooltipType
  } = pieSettings;
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
  var {
    showLabels,
    sectors,
    children
  } = _ref5;
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
function SectorsWithAnimation(_ref6) {
  var {
    props,
    previousSectorsRef,
    id
  } = _ref6;
  var {
    sectors,
    isAnimationActive,
    animationBegin,
    animationDuration,
    animationEasing,
    activeShape,
    inactiveShape,
    onAnimationStart,
    onAnimationEnd
  } = props;
  var animationId = useAnimationId(props, "recharts-pie-");
  var prevSectors = previousSectorsRef.current;
  var [isAnimating, setIsAnimating] = reactExports.useState(false);
  var handleAnimationEnd = reactExports.useCallback(() => {
    if (typeof onAnimationEnd === "function") {
      onAnimationEnd();
    }
    setIsAnimating(false);
  }, [onAnimationEnd]);
  var handleAnimationStart = reactExports.useCallback(() => {
    if (typeof onAnimationStart === "function") {
      onAnimationStart();
    }
    setIsAnimating(true);
  }, [onAnimationStart]);
  return /* @__PURE__ */ reactExports.createElement(PieLabelListProvider, {
    showLabels: !isAnimating,
    sectors
  }, /* @__PURE__ */ reactExports.createElement(JavascriptAnimate, {
    animationId,
    begin: animationBegin,
    duration: animationDuration,
    isActive: isAnimationActive,
    easing: animationEasing,
    onAnimationStart: handleAnimationStart,
    onAnimationEnd: handleAnimationEnd,
    key: animationId
  }, (t) => {
    var _first$startAngle;
    var stepData = [];
    var first = sectors && sectors[0];
    var curAngle = (_first$startAngle = first === null || first === void 0 ? void 0 : first.startAngle) !== null && _first$startAngle !== void 0 ? _first$startAngle : 0;
    sectors === null || sectors === void 0 || sectors.forEach((entry, index) => {
      var prev = prevSectors && prevSectors[index];
      var paddingAngle = index > 0 ? get(entry, "paddingAngle", 0) : 0;
      if (prev) {
        var angle = interpolate(prev.endAngle - prev.startAngle, entry.endAngle - entry.startAngle, t);
        var latest = _objectSpread$2(_objectSpread$2({}, entry), {}, {
          startAngle: curAngle + paddingAngle,
          endAngle: curAngle + angle + paddingAngle
        });
        stepData.push(latest);
        curAngle = latest.endAngle;
      } else {
        var {
          endAngle,
          startAngle
        } = entry;
        var deltaAngle = interpolate(0, endAngle - startAngle, t);
        var _latest = _objectSpread$2(_objectSpread$2({}, entry), {}, {
          startAngle: curAngle + paddingAngle,
          endAngle: curAngle + deltaAngle + paddingAngle
        });
        stepData.push(_latest);
        curAngle = _latest.endAngle;
      }
    });
    previousSectorsRef.current = stepData;
    return /* @__PURE__ */ reactExports.createElement(Layer, null, /* @__PURE__ */ reactExports.createElement(PieSectors, {
      sectors: stepData,
      activeShape,
      inactiveShape,
      allOtherPieProps: props,
      shape: props.shape,
      id
    }));
  }), /* @__PURE__ */ reactExports.createElement(PieLabelList, {
    showLabels: !isAnimating,
    sectors,
    props
  }), props.children);
}
var defaultPieProps = {
  animationBegin: 400,
  animationDuration: 1500,
  animationEasing: "ease",
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
  startAngle: 0,
  stroke: "#fff",
  zIndex: DefaultZIndexes.area
};
function PieImpl(props) {
  var {
    id
  } = props, propsWithoutId = _objectWithoutProperties$1(props, _excluded3);
  var {
    hide,
    className,
    rootTabIndex
  } = props;
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
  var {
    id: externalId
  } = props, propsWithoutId = _objectWithoutProperties$1(props, _excluded4);
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
  var {
    layout
  } = polarChartProps, otherCategoricalProps = _objectWithoutProperties(polarChartProps, _excluded);
  var {
    chartName,
    defaultTooltipEventType,
    validateTooltipEventTypes,
    tooltipPayloadSearcher
  } = props;
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
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2", children: [
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
                a.count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-background/60", children: a.count })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: a.message }),
              a.actionUrl && a.actionLabel && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  variant: "outline",
                  size: "sm",
                  onClick: () => navigate(a.actionUrl),
                  className: "h-6 mt-2 text-[10px]",
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
const PHASE_LABELS = {
  categories: "Categories",
  items: "Products/Items",
  suppliers: "Suppliers",
  sales: "Sales",
  expenses: "Expenses",
  employees: "Employees",
  stock_movements: "Stock Movements",
  notifications: "Notifications"
};
const TestDataGenerator = () => {
  const [phase, setPhase] = reactExports.useState("idle");
  const [progress, setProgress] = reactExports.useState(null);
  const [perfReport, setPerfReport] = reactExports.useState(null);
  const [dbSize, setDbSize] = reactExports.useState(0);
  const [generationResult, setGenerationResult] = reactExports.useState(null);
  const [showConfirm, setShowConfirm] = reactExports.useState(null);
  reactExports.useEffect(() => {
    window.api.onTestDataProgress(setProgress);
    return () => {
      window.api.removeTestDataProgressListener();
    };
  }, []);
  const formatDuration = (ms) => {
    if (ms < 1e3) return `${ms}ms`;
    if (ms < 6e4) return `${(ms / 1e3).toFixed(2)}s`;
    return `${Math.floor(ms / 6e4)}m ${Math.floor(ms % 6e4 / 1e3)}s`;
  };
  const formatSize = (bytes) => {
    if (bytes === 0) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  const handleGenerate = reactExports.useCallback(async (count) => {
    if (count >= 1e3) {
      setShowConfirm(count);
      return;
    }
    await doGenerate(count);
  }, []);
  const doGenerate = async (count) => {
    setShowConfirm(null);
    setPhase("generating");
    setGenerationResult(null);
    setPerfReport(null);
    try {
      const result = await window.api.generateTestData(count);
      setGenerationResult(result);
      toast.success(`Generated ${result.totalCreated.toLocaleString()} records in ${formatDuration(result.duration)}`);
    } catch (e) {
      toast.error(e.message || "Generation failed");
    } finally {
      setPhase("idle");
      setProgress(null);
    }
  };
  const handleDelete = async () => {
    if (!window.confirm("Delete ALL test data? This will remove all records created by the test data generator.")) return;
    setPhase("deleting");
    try {
      const result = await window.api.clearTestData();
      toast.success(`Deleted ${result.deleted.toLocaleString()} test records in ${formatDuration(result.duration)}`);
      setGenerationResult(null);
      setPerfReport(null);
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setPhase("idle");
    }
  };
  const handleMeasure = async () => {
    setPhase("measuring");
    try {
      const [perf, size] = await Promise.all([
        window.api.measurePerformance(),
        window.api.getDatabaseSize()
      ]);
      setPerfReport(perf);
      setDbSize(size);
      toast.success("Performance measurement complete");
    } catch (e) {
      toast.error(e.message || "Measurement failed");
    } finally {
      setPhase("idle");
    }
  };
  const isBusy = phase === "generating" || phase === "deleting" || phase === "measuring";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-dashed border-amber-500/30", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: "Test Data Generator" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black uppercase tracking-widest border-amber-500/50 text-amber-600", children: "Dev Tool" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-[10px]", children: "Generate realistic test data for performance testing and debugging" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      phase === "generating" && progress && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[10px] font-bold uppercase tracking-widest", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            PHASE_LABELS[progress.phase] || progress.phase,
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1", children: [
              "(",
              progress.current,
              "/",
              progress.total,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-600", children: [
            progress.overallPercent,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-full bg-amber-500 rounded-full transition-all duration-300",
            style: { width: `${progress.overallPercent}%` }
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] text-muted-foreground", children: [
          progress.message,
          " · ",
          progress.totalCreated.toLocaleString(),
          " records created"
        ] })
      ] }),
      phase === "deleting" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-3 w-3 animate-spin" }),
        "Deleting test data..."
      ] }),
      phase === "measuring" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-3 w-3 animate-spin" }),
        "Measuring performance..."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        [10, 100, 1e3, 1e4].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: n >= 1e3 ? "destructive" : "outline",
            disabled: isBusy,
            onClick: () => handleGenerate(n),
            className: "text-[10px] font-black uppercase tracking-widest",
            children: [
              "Generate ",
              n.toLocaleString()
            ]
          },
          n
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "ghost",
            disabled: isBusy,
            onClick: handleDelete,
            className: "text-[10px] font-black uppercase tracking-widest text-destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3 mr-1" }),
              "Delete Test Data"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            disabled: isBusy,
            onClick: handleMeasure,
            className: "text-[10px] font-black uppercase tracking-widest",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-3 w-3 mr-1" }),
              "Measure Performance"
            ]
          }
        )
      ] }),
      generationResult && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card/40 p-3 space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "h-3 w-3" }),
          "Generation Complete"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-[10px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Total Records:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-right", children: generationResult.totalCreated.toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Duration:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-right", children: formatDuration(generationResult.duration) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Avg Rate:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-right", children: generationResult.duration > 0 ? `${Math.round(generationResult.totalCreated / (generationResult.duration / 1e3))} rec/s` : "-" })
        ] }),
        generationResult.phases.filter((p) => p.count > 0).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[9px] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            PHASE_LABELS[p.name] || p.name,
            ": ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: p.count.toLocaleString() }),
            " records"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatDuration(p.time) })
        ] }, p.name))
      ] }),
      perfReport && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card/40 p-3 space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-3 w-3" }),
          "Performance Report"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-1 text-[10px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "DB Size:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-right", children: formatSize(dbSize) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Items Count:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.itemsCount,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Sales Count:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.salesCount,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Customers Query:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.customersQuery,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Suppliers Count:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.suppliersCount,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Categories Count:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.categoriesCount,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Expenses Count:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.expensesCount,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Employees Count:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.employeesCount,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Items List Query:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.itemsListQuery,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Sales List Query:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.salesListQuery,
            "ms"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Dashboard Agg Query:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-right", children: [
            perfReport.dashboardAggQuery,
            "ms"
          ] })
        ] })
      ] }),
      showConfirm !== null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border bg-background p-6 max-w-sm shadow-2xl space-y-4 mx-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5 text-amber-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-sm uppercase tracking-widest", children: [
            "Generate ",
            showConfirm.toLocaleString(),
            " Records?"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "This will create approximately ",
          showConfirm >= 1e4 ? "25,000+" : showConfirm >= 1e3 ? "2,500+" : "",
          " records across all system tables. The process may take ",
          showConfirm >= 1e4 ? "a minute or more" : "several seconds",
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => setShowConfirm(null), className: "text-xs", children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "destructive", onClick: () => doGenerate(showConfirm), className: "text-xs", children: "Generate" })
        ] })
      ] }) })
    ] })
  ] });
};
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
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Alert({
  className,
  variant,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "alert",
      role: "alert",
      className: cn(alertVariants({ variant }), className),
      ...props
    }
  );
}
function AlertDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "alert-description",
      className: cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className
      ),
      ...props
    }
  );
}
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
          className: "font-medium hover:text-primary transition-colors text-left cursor-pointer",
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
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize cursor-pointer", onClick: () => {
        setSelectedActivity(row.original);
        setShowActivityDetail(true);
      }, children: t(`dashboard.${row.original.type.toLowerCase()}`) })
    },
    {
      accessorKey: "amount",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.amount") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right font-medium cursor-pointer", onClick: () => {
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
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[10px] font-bold uppercase tracking-widest cursor-pointer", onClick: () => {
        setSelectedActivity(row.original);
        setShowActivityDetail(true);
      }, children: row.original.extra || t("dashboard.system_entry") })
    },
    {
      accessorKey: "date",
      header: t("common.date"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-[10px] font-bold uppercase tracking-widest cursor-pointer", onClick: () => {
        setSelectedActivity(row.original);
        setShowActivityDetail(true);
      }, children: formatDate(new Date(row.original.date), { month: "short", day: "numeric" }) })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadData, className: "mt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 mr-1" }),
      " ",
      t("common.retry")
    ] })
  ] }) : !stats ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-12 w-12 mb-4 opacity-30" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-medium", children: t("common.no_data") })
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl md:text-3xl font-black tracking-tight", children: [
          t(`dashboard.${greeting}`),
          ", ",
          currentAdmin?.name?.split(" ")[0] || "Admin"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("dashboard.welcome") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden md:flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-widest", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.3em]", children: formatDate(/* @__PURE__ */ new Date(), { weekday: "long", month: "long", day: "numeric", year: "numeric" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardAlerts, {}) }),
    empStats && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("dashboard.total_employees") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black", children: empStats.total || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("common.active") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-green-600", children: empStats.active || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("dashboard.online_now") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-blue-600", children: empStats.online || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("dashboard.clocked_in") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-amber-600", children: empStats.clockedIn || 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-4 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("common.pending") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-destructive", children: empStats.pendingApprovals || 0 })
      ] })
    ] }) }),
    reversalStats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeftRight, { className: "h-4 w-4" }),
        " ",
        t("reports.reversals")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "h-3 w-3" }),
            " ",
            t("reports.voided_sales")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black", children: reversalStats.voidedSales || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3 w-3" }),
            " ",
            t("dashboard.reversed_payments")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black", children: reversalStats.reversedPayments || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-3 w-3" }),
            " ",
            t("dashboard.reversed_adjustments")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black", children: reversalStats.reversedAdjustments || 0 })
        ] })
      ] })
    ] }),
    supplierStats && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-4 w-4" }),
          t("suppliers.title")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => window.location.hash = "/suppliers", className: "text-xs", children: [
          t("common.view_all"),
          " →"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("suppliers.kpi_total") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black", children: supplierStats.totalSuppliers || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("suppliers.kpi_active") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black text-green-600", children: supplierStats.activeSuppliers || 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("suppliers.kpi_outstanding") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black text-red-600", children: [
            t("common.etb"),
            " ",
            (supplierStats.outstandingBalance || 0).toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("suppliers.kpi_month") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-black", children: [
            t("common.etb"),
            " ",
            (supplierStats.monthPurchases || 0).toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("suppliers.kpi_top") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black truncate", children: supplierStats.topSupplier?.supplierName || "-" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border bg-card/40 p-3 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: t("suppliers.kpi_recent") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black", children: (supplierStats.recent || []).length })
        ] })
      ] }),
      supplierUnpaidOrders.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-red-200 dark:border-red-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-red-500" }),
          t("dashboard.unpaid_supplier_orders", { count: supplierUnpaidOrders.length })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("suppliers.col_supplier") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("reports.header_order_num") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2 text-[10px] font-bold uppercase tracking-widest", children: t("common.balance") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("common.due") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: supplierUnpaidOrders.slice(0, 5).map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs font-medium", children: o.supplierName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-xs", children: o.purchaseNumber || `#${o.id}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right text-xs text-red-600 font-semibold", children: [
              t("common.etb"),
              " ",
              o.remainingBalance.toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: o.dueDate ? formatDate(o.dueDate) : "-" })
          ] }, o.id)) })
        ] }) }) })
      ] }),
      supplierPaymentAlerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-amber-200 dark:border-amber-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-500" }),
          t("dashboard.payment_due_alerts")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("suppliers.col_supplier") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("reports.header_order_num") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2 text-[10px] font-bold uppercase tracking-widest", children: t("common.amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2 text-[10px] font-bold uppercase tracking-widest", children: t("dashboard.due_in") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: supplierPaymentAlerts.slice(0, 5).map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs font-medium", children: a.supplierName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono text-xs", children: a.purchaseNumber || `#${a.id}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right text-xs text-amber-600 font-semibold", children: [
              t("common.etb"),
              " ",
              a.remainingBalance.toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: a.daysUntilDue !== null && a.daysUntilDue !== void 0 ? a.daysUntilDue <= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "destructive", className: "text-[9px]", children: t("common.overdue") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-amber-600 font-semibold", children: [
              a.daysUntilDue,
              " ",
              t("common.days")
            ] }) : "-" })
          ] }, a.id)) })
        ] }) }) })
      ] }),
      supplierLowStock.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-orange-200 dark:border-orange-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-orange-500" }),
          t("dashboard.low_stock_supplier")
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("inventory.product") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("suppliers.col_supplier") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2 text-[10px] font-bold uppercase tracking-widest", children: t("common.stock") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-2 text-[10px] font-bold uppercase tracking-widest", children: t("common.category") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: supplierLowStock.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-muted/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs font-medium", children: p.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs", children: p.supplierName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-right text-xs text-red-600 font-semibold", children: [
              p.totalBaseQuantity,
              " ",
              p.baseUnit
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs text-muted-foreground", children: p.categoryName || "-" })
          ] }, p.id)) })
        ] }) }) })
      ] })
    ] }),
    (window.location.protocol === "http:" || window.location.hostname === "localhost") && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TestDataGenerator, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "@container/card", children: [
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
            variant: "outline",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { vertical: false, strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          XAxis,
          {
            dataKey: "label",
            tickLine: false,
            axisLine: false,
            tickMargin: 8,
            className: "text-[10px]"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          YAxis,
          {
            tickLine: false,
            axisLine: false,
            tickFormatter: (v) => (v ?? 0) >= 1e3 ? `${((v ?? 0) / 1e3).toFixed(0)}k` : `${v ?? 0}`,
            width: 40,
            className: "text-[10px]"
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
            radius: [6, 6, 0, 0],
            maxBarSize: 48,
            children: revenueChartData.map((entry, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              Cell,
              {
                fill: entry.isToday ? "var(--primary)" : "var(--primary)",
                opacity: entry.isToday ? 1 : 0.35
              },
              idx
            ))
          }
        )
      ] }) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CategorySalesChart, { data: analytics?.categoryBreakdown || [] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
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
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showActivityDetail, onClose: () => setShowActivityDetail(false), title: t("common.details"), size: "md", children: selectedActivity && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0", children: selectedActivity.type === "sale" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-6 w-6 text-primary" }) : selectedActivity.type === "expense" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-6 w-6 text-destructive" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersVertical, { className: "h-6 w-6 text-amber-500" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg", children: selectedActivity.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "mt-1 capitalize", children: selectedActivity.type })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-border/40 bg-card/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: t("common.amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xl font-black text-primary", children: [
            t("common.etb"),
            " ",
            selectedActivity.amount.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-border/40 bg-card/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: t("common.date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black", children: formatDate(new Date(selectedActivity.date), { weekday: "long", month: "long", day: "numeric", year: "numeric" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-border/40 bg-card/50 col-span-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: t("common.details") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: selectedActivity.extra || t("dashboard.system_entry") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowActivityDetail(false), className: "w-full h-10 rounded-xl font-bold uppercase tracking-widest", children: t("inventory.close_specs") })
    ] }) })
  ] }) });
};
export {
  Dashboard as default
};
