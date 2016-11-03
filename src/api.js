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

var TCellSafeguards;

var TCellApi = (function () {
  var TCELL_AGENT_VERSION = '/* @echo TCELL_AGENT_VERSION */'; // Set in package.json, added in Gruntfile.js
  var TCELL_API_VERSION = 1;

  function addTCellHeaders(xhr, apiKey) {
    // xhr.setRequestHeader('Authorization', 'Bearer ' + apiKey);
    xhr.setRequestHeader('TCellAgent', 'JSAgent ' + TCELL_AGENT_VERSION);
  }

  var sendJSEvents = function(config, wrappedEvents, responseCallback) {

    if (!config || config.postUrl === null) {
      console.log('No post url set.');
      responseCallback(false);
      return;
    }

    var xhr = new TCellSafeguards.xhrConstructor();

    var message = TCellSafeguards.stringify(wrappedEvents);

    TCellSafeguards.xhrOpen.call(xhr, 'POST', config.postUrl, true);

    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    addTCellHeaders(xhr, config.apiKey);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if(xhr.status === 200) {
            if (responseCallback) { responseCallback(true); }
          } else {
            if (responseCallback) { responseCallback(false); }
          }
        }
    };
    TCellSafeguards.xhrSend.call(xhr, message);

  };

  var exports = {
    version: 1,
    sendJSEvents: sendJSEvents,
  };

  return exports;
}());
