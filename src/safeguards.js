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

var TCellSafeguards = {

  initRun: false,
  stringify: null,
  parse: null,
  xhrSend: null,
  xhrOpen: null,
  xhrConstructor: null,

  reset: function() {
    TCellSafeguards.initRun = false;
  },

  init: function() {

    if (TCellSafeguards.initRun === true) {
        return;
    }

    TCellSafeguards.initRun = true;
    var originalStringify = JSON.stringify;
    TCellSafeguards.stringify = function() {
        var arrayToJson = Array.prototype.toJSON;
        var dateToJson = Date.prototype.toJSON;
        var stringToJson = String.prototype.toJSON;
        delete Object.prototype.toJSON;
        delete Array.prototype.toJSON;
        delete Date.prototype.toJSON;
        delete String.prototype.toJSON;
        var returnValue = originalStringify.apply(this, arguments);
        if (arrayToJson) {
            Array.prototype.toJSON = arrayToJson;
        }
        if (stringToJson) {
            String.prototype.toJSON = stringToJson;
        }
        if (dateToJson) {
            Date.prototype.toJSON = dateToJson;
        }
        return returnValue;
    };

    var originalParse = JSON.parse;
    TCellSafeguards.parse = function() {
        var returnValue = originalParse.apply(this, arguments);
        return returnValue;
    };

    TCellSafeguards.xhrConstructor = XMLHttpRequest.prototype.constructor;
    TCellSafeguards.xhrOpen = XMLHttpRequest.prototype.open;
    TCellSafeguards.xhrSend = XMLHttpRequest.prototype.send;
  }
};
