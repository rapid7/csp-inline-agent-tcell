/*
 * Copyright (c) 2016, tCell.io, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of tCell.io nor the names of its contributors may
 * be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
 * OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var TCellOverride = (function () {
  var exports = {
    version: 1,
    author: 'garrett@tcell.io'
  };

  /*
   * Structure:
   * {"label_desribing_group_of_propery_overrides":
   *    [{ parent:<parent object to get function or property of>,
   propertyStr:"<property of the parent to override>"}]
   * }
   *
   * for example to override document.cookie the parent
   *   would be document and the propertyStr would be "cookie"
   *
   * label will come from the config object
   */
  var overrides = {
    'cookie': [{parent: document, propertyStr: 'cookie'}],
    'document.write': [{parent: document, propertyStr: 'write'}],
    'createElement': [{parent: document, propertyStr: 'createElement'}],
    'getElementById': [{parent: document, propertyStr: 'getElementById'}],
    'querySelector': [{parent: document, propertyStr: 'querySelector'}],
    'querySelectorAll': [{parent: document, propertyStr: 'querySelectorAll'}],
    'documentElement': [{parent: document, propertyStr: 'documentElement'}],
    'fromCharCode': [{parent: window.String, propertyStr: 'fromCharCode'}],
    'alert': [{parent: window, propertyStr: 'alert'}],
    'prompt': [{parent: window, propertyStr: 'prompt'}],
    'confirm': [{parent: window, propertyStr: 'confirm'}],
    'unescape': [{parent: window, propertyStr: 'unescape'}],
    'eval': [{parent: window, propertyStr: 'eval'}],
    'Function': [{parent: window, propertyStr: 'Function'}],
    'XMLHttpRequest': [{parent: window, propertyStr: 'XMLHttpRequest'}],
  };

  // Window undefined in unit tests, but we need to add it to the 'alert'
  //  label of events so both window.alert and Window.prototype.alert are
  //  overridden
  if (typeof(Window) !== 'undefined') {
    overrides.alert.push({parent: Window.prototype, propertyStr: 'alert'});
  }

  // Lets you know if x is a function or an attribute
  function isFunction(x) {
    return Object.prototype.toString.call(x) === '[object Function]';
  }

  // returns file:line:column of the offending code
  function getStackTrace() {
    var err = new Error();
    var st = err.stack;
    if (!st) {
      return 'STNULL';
    }
    var lineSource = st.split('\n')[2].split('@')[1];
    if (lineSource === undefined) {
      // Chrome
      lineSource = st.split('\n')[3].trim().split(' ');
      lineSource = lineSource[lineSource.length - 1];
      if (lineSource.startsWith('(')) {
        lineSource = lineSource.substring(1, lineSource.length - 1);
      }
    }
    return lineSource;
  }

  // Putting it all together
  // label = string matching the overrides object above, like 'alert'
  // block = true|false if it should be blocked
  // log_cb = callback if logging is enabled, send alerts in that logging block
  function replaceProperty(label, block, logCallback) {
    var functions = overrides[label];
    for (var i = 0; i < functions.length; i++) {
      var parent = functions[i].parent;
      var propertyStr = functions[i].propertyStr;
      if (logCallback || block) {
        (function () {
          var proxied = parent[propertyStr];
          var backToNative = false;
          parent.__defineGetter__(propertyStr, function () {
            if (backToNative === true) {
              return null;
            }
            var stackTrace = getStackTrace();
            if (String(stackTrace) === 'native') {
              backToNative = true;
              return null;
            }
            if (logCallback) {
              logCallback(propertyStr, stackTrace);
              console.debug('Property ' + propertyStr + ' caught being accessed. ' + stackTrace + ' tag ' + document.currentScript);
            }
            if (block) {
              if (isFunction(proxied)) {
                return function () {
                };
              } else {
                return null;
              }
            }
            return proxied;
          });
        })();
      }
    }
  }

  exports.getStackTrace = getStackTrace;
  exports.replaceProperty = replaceProperty;
  return exports;

}());
