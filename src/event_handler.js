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
var TCellApi;

var TCellEventHandler = (function () {
  var EVENT_VERSION = 1;

  var exports = {
    version: 1,
    author: 'garrett@tcell.io'
  };

  function wrapEvents(config, events) {
    return { 'v': EVENT_VERSION,
             'applicationId': config.applicationId,
             'requestId': config.requestId,
             'sessionId': config.sessionId,
             'documentUri': document.documentURI,
             'referrer': document.referrer,
             'events': events };
  }

  function sendEvents(config, events) {
    var wrappedEvents = wrapEvents(config, events);
    console.log(TCellSafeguards.stringify(wrappedEvents, null, 2));
    if (config.postUrl) {
      TCellApi.sendJSEvents(config, events, function(success) {
        return;
      });
    }
  }

  exports.sendEvents = sendEvents;
  exports.wrapEvents = wrapEvents;
  return exports;

}());
