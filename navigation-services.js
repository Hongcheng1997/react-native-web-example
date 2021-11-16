import {Platform} from 'react-native';
import qs from 'qs';
import isPlainObject from 'lodash/isPlainObject';
import _invertBy from 'lodash/invertBy';
const {match} = require('path-to-regexp');

let _navigator;
let pathKeys = {};
let NavigationActions = {};
let Actions = {};
// 超过路由栈最大层数清空路由栈这种的页面
let EnableExceedMaxPagesClear = false;
const isMP =
  Platform.OS === 'wx' ||
  Platform.OS === 'alipay' ||
  Platform.OS === 'dingding' ||
  Platform.OS === 'jd' ||
  Platform.OS === 'bytedance';
const isWeb = Platform.OS === 'web';
const WX_STATUS = {
  success: () => {},
  fail: () => {},
  complete: () => {},
};
let navIntercept = (routeName, params, actionName) => {
  return false;
};

const setTopLevelNavigator = navigatorRef => {
  _navigator = navigatorRef;
};

const setEnableExceedMaxPagesClear = enable => {
  EnableExceedMaxPagesClear = enable;
};

const setActions = actions => {
  Actions = {...Actions, ...actions};
};

const setNavigationActions = action => {
  NavigationActions = action;
};

const getCurrentRoute = state => {
  if (!state) {
    return undefined;
  }
  const findCurrentRoute = navState => {
    if (navState.index !== undefined) {
      return findCurrentRoute(navState.routes[navState.index]);
    }
    if (navState.state) {
      return findCurrentRoute(navState.state);
    }
    return navState;
  };
  if (isMP) {
    return undefined;
  }
  return findCurrentRoute(state);
};

const createWXJumpUrl = (routeName, params = {}) => {
  let path;
  try {
    path = (pathKeys[routeName] || {path: routeName, isTabScreen: false}).path;
    const pstr = qs.stringify(params, {arrayFormat: 'comma'});
    path = pstr.length === 0 ? path : `${path}?${pstr}`;
  } catch (e) {
    e.pageSize;
  }

  return path;
};

const isTabScreen = routeName => {
  const {isTabScreen = false} = pathKeys[routeName] || {};
  return isTabScreen;
};

const getCurrentNav = () => {
  if (isMP) {
    const pageStack = getCurrentPages();
    const currentPage = pageStack[pageStack.length - 1];
    const pathToRoute = _invertBy(pathKeys, ({path}) => path);
    if (currentPage?.route && pathToRoute[`/${currentPage.route}`]) {
      const routeName = pathToRoute[`/${currentPage.route}`][0];
      return {
        name: routeName,
        params: getParams(),
        path: `/${pathKeys[routeName]?.alias || ''}`,
      };
    }
    return undefined;
  }

  return getCurrentRoute(_navigator && _navigator.getRootState());
};

const setParams = params => {
  if (isMP) {
    //not support
  } else {
    _navigator && _navigator.dispatch(NavigationActions.setParams(params));
  }
};

const getParams = () => {
  if (isMP) {
    const pages = getCurrentPages() || [];
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const options = (currentPage && currentPage.query) || {};
      let params = options;
      try {
        const _params = {};
        for (var key in params) {
          _params[key] = decodeURIComponent(params[key]);
        }
        params = _params;
      } catch (e) {
        console.log(e);
        params = options;
      }
      return params;
    }
    return undefined;
  } else {
    let {params} = getCurrentNav() || {};

    if (!isPlainObject(params) && Platform.OS === 'web') {
      params = qs.parse(window.location.search.replace(/\?/, ''));
    }

    return params;
  }
};

const clearRoutesNavigate = (routeName, params) => {
  if (!isTabScreen(routeName) && EnableExceedMaxPagesClear) {
    const currentPages = getCurrentPages();
    if (currentPages.length === 10) {
      Platform.API.reLaunch({
        url: createWXJumpUrl(routeName, params),
        ...WX_STATUS,
      });
      return;
    }
  }
};

const navigate = (routeName, params) => {
  if (navIntercept && navIntercept(routeName, params, 'navigate') === true) {
    return;
  }
  if (isMP) {
    const action = !isTabScreen(routeName)
      ? Platform.API.navigateTo
      : Platform.API.switchTab;
    clearRoutesNavigate(routeName, params);
    action({
      url: createWXJumpUrl(routeName, params),
      ...WX_STATUS,
    });
  } else {
    _navigator &&
      _navigator.dispatch(
        NavigationActions.navigate({
          routeName,
          params,
        }),
      );
  }
};

const push = (routeName, params) => {
  if (isMP) {
    clearRoutesNavigate(routeName, params);
    Platform.API.navigateTo({
      url: createWXJumpUrl(routeName, params),
      ...WX_STATUS,
    });
  } else {
    const action = Actions && Actions.StackActions;
    console.log(action)
    if (_navigator && action) {
      _navigator.dispatch(action.push({routeName, params}));
    }
  }
};

/**
 * 关闭并返回上一及页面
 * @param {关闭页面数量} pageSize
 */
const pop = (pageSize = 1) => {
  if (isMP) {
    Platform.API.navigateBack({delta: pageSize});
  } else {
    const action = Actions && Actions.StackActions;
    if (isWeb) {
      if (!_navigator.canGoBack()) {
        window.history.back();
      } else {
        _navigator && _navigator.dispatch(NavigationActions.back());
      }
      return;
    }
    if (_navigator && action) {
      _navigator.dispatch(action.pop(pageSize));
    }
  }
};

const goBack = () => {
  if (isMP) {
    //   wx.goBack();
    Platform.API.navigateBack({delta: 1});
  } else {
    if (!_navigator.canGoBack() && isWeb) {
      window.history.back();
      return;
    }
    _navigator && _navigator.dispatch(NavigationActions.back());
  }
};

const back = () => {
  if (isMP) {
    //   wx.goBack();
    Platform.API.navigateBack({delta: 1});
  } else {
    _navigator && _navigator.dispatch(NavigationActions.back());
  }
};

/*
返回当前路由栈的第一页，并且关闭其他页面
*/
const popToTop = () => {
  if (isMP) {
    const pages = getCurrentPages() || [];
    const pageSize = pages.length;
    const jumpCount = pageSize > 1 ? pageSize - 1 : 0;
    pop(jumpCount);
  } else {
    const action = Actions && Actions.StackActions;
    if (_navigator && action) {
      _navigator.dispatch(action.popToTop());
    }
  }
};

const replace = (routeName, params) => {
  if (navIntercept && navIntercept(routeName, params, 'replace') === true) {
    return;
  }
  if (isMP) {
    // 如果是tab页，跳转不能用redirectTo;
    const action = isTabScreen(routeName) ? 'switchTab' : 'redirectTo';
    Platform.API[action]({
      url: createWXJumpUrl(routeName, params),
      ...WX_STATUS,
    });
  } else {
    const action = Actions && Actions.StackActions;
    if (_navigator && action) {
      _navigator.dispatch(action.replace({routeName, params}));
    }
  }
};

const jumpTo = (routeName, params) => {
  if (isMP) {
    Platform.API.navigateTo({
      url: createWXJumpUrl(routeName, params),
      ...WX_STATUS,
    });
  } else {
    const action = Actions && Actions.SwitchActions;
    if (_navigator && action) {
      _navigator.dispatch(action.jumpTo({routeName, params}));
    }
  }
};

const pathSoloKey = (pathKey, pathInfo) => {
  if (typeof pathInfo === 'string') {
    pathKeys[pathKey] = {
      path: pathInfo,
      isTabScreen: false,
    };
  } else {
    const {path, isTabScreen = false, alias, ...others} = pathInfo;
    pathKeys[pathKey] = {
      path,
      isTabScreen,
      alias,
      ...others,
    };
  }
};

const pathKeyForTabBar = (pathKey, path) => {
  pathKeys[pathKey] = {
    path: path,
    isTabScreen: false,
  };
};

const setNavIntercept = fc => {
  if (fc && typeof fc === 'function') {
    navIntercept = fc;
  }
};

const getRouteNameByPathAndParams = (pathname, query) => {
  const pathKeysArr = Object.keys(pathKeys);
  for (const index = 0, len = pathKeysArr.length; index < len; index++) {
    const pathKey = pathKeysArr[index];
    const route = pathKeys[pathKey];
    if (!route.alias) {
      continue;
    }
    const matchReg = match(`/${route.alias}`, {decode: decodeURIComponent});
    const {path, params} = matchReg(pathname);
    if (path) {
      return {
        routeName: pathKey,
        params: {...params, ...query},
      };
    } else {
      if (`/${route.alias}` === pathname) {
        return {
          routeName: pathKey,
          params: query,
        };
      }
    }
  }
  return {
    routeName: '',
    params: query,
  };
};

export default {
  navigate,
  goBack,
  back,
  pop,
  popToTop,
  replace,
  push,
  jumpTo,
  setTopLevelNavigator,
  pathKey: pathKey => (pathKeys = pathKey),
  pathKeyForTabBar,
  pathSoloKey,
  setNavigationActions,
  setActions,
  getCurrentNav,
  setParams,
  getParams,
  setNavIntercept,
  setEnableExceedMaxPagesClear,
  getRouteNameByPathAndParams,
};
