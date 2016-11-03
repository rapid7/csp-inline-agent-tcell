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

var TCellAgentConfigurations;
var TCellSafeguards;
var ScriptSignatureProcessor;
var TCellUtils;
var TCellEventHandler;

var TCellAgent = function() {
  var exports = {};
  var scriptSigProcessor = null;
  var cancelFlag = false;

  config = TCellAgentConfigurations.loadConfig();
  exports.config = config;

  var scriptSigProcessorCallback = function(scriptElement, scriptText, staticDetails, scriptPos, scriptContext, hasNonce, scriptSrc) {
    var event;
    if (staticDetails) {
      event = createEvent('inline_script');
      console.warn('Found script that violates the security policy. static-hash=' + staticDetails.hash +
        ', pos = ' + TCellSafeguards.stringify(scriptPos) +
        ', script = ' + scriptText +
        ', hasNonce = ' + hasNonce +
        ', src="' + scriptSrc + '"');
    } else {
      event = createEvent('script_src');
      console.warn('Found external script' +
        ', pos = ' + TCellSafeguards.stringify(scriptPos) +
        ', hasNonce = ' + hasNonce +
        ', src="' + scriptSrc + '"');
    }

    if (staticDetails) {
      event.data.hashes = {
        sha256: staticDetails.hash
      };
    }
    if (scriptSrc && scriptSrc !== '') {
      event.data.src = scriptSrc;
    }
    event.data.hasNonce = (hasNonce && hasNonce !== false);
    event.data.scriptPos = scriptPos;
    event.data.scriptContext = scriptContext;
    queueEvent(event);
  };

  scriptSigProcessor = new ScriptSignatureProcessor(scriptSigProcessorCallback);
  exports.scriptSigProcessor = scriptSigProcessor;

  var createEvent = function(eventType) {
    var retVal = {};
    retVal.eventType = eventType;
    retVal.data = {};
    return retVal;
  };

  // events get put on queue
  var eventQueue = [];
  var queueEvent = function(event) {
    eventQueue.push(event);
  };

  // flush will batch everything on queue, and send resulting payload to endpoint
  var flushEvents = function() {

    if (cancelFlag === true) {
      return;
    }

    if (eventQueue.length > 0) {
      try {
        TCellEventHandler.sendEvents(config, eventQueue);
      } catch(err) {
        console.log('JSAgent: Failed to send events.');
        console.log(err);
        eventQueue = [];
      }
      eventQueue = [];
    }
  };
  exports.flushEvents = flushEvents;

  var clearEvents = function() {
      eventQueue = [];
  };
  exports.clearEvents = clearEvents;

  var postPageSummary = function() {
    var psevent = createEvent('page_summary');
    psevent.data.numScripts = document.scripts.length;
    psevent.data.inIframe = TCellUtils.inIframe();
      // add anything else we want to know about the page
    queueEvent(psevent);
  };
  exports.postPageSummary = postPageSummary;

  var scanNode = function(node) {
    if (node.nodeName === 'SCRIPT') {
      scriptSigProcessor.processScriptElement(node);
    }
    var i;
    if (typeof(node.attributes) !== 'undefined') {
      for (i=0; i < node.attributes.length; i++) {
        var attr = node.attributes[i];
        var element  = attr.ownerElement;
        if (attr && element && attr.specified && typeof(element[attr.name]) === 'function') {
          scriptSigProcessor.processAttribute( element, attr );
        }
      }
    }
    if (typeof(node.childNodes) !== 'undefined') {
      for (i=0; i < node.childNodes.length; i++) {
        scanNode(node.childNodes[i]);
      }
    }
  };

  var watchDOM = function () {
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var observer = new MutationObserver(function (mutations, observer) {
      if (cancelFlag === true) {
        return;
      }
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].type === 'childList') {
          for (var j = 0; j < mutations[i].addedNodes.length; j++) {
            var addedNode = mutations[i].addedNodes[j];
            scanNode(addedNode);
          }
        } else if (mutations[i].type === 'attributes') {
          var element = mutations[i].target;
          var attr = element.getAttributeNode(mutations[i].attributeName);
          if (attr && attr.specified && element[attr.name] === 'function') {
            scriptSigProcessor.processAttribute( element, attr );
          }
        }
      }
    });

    observer.observe(document, {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true,
        attributeOldValue: true,
        characterDataOldValue: true
    });
  };

  // first pass to process, then watchdom watches for new stuff
  var scanDOM = function () {
      var flush = flushEvents; //I think there's a better way...
      document.addEventListener('DOMContentLoaded', function (event) {

        if (cancelFlag === true) {
          return;
        }

        postPageSummary();

        //process all script elements
        var scriptElements = document.getElementsByTagName('script');
        for (var i = 0; i<scriptElements.length; i++) {
          scriptSigProcessor.processScriptElement(scriptElements[i]);
        }

        //process all attributes with scripts
        scriptSigProcessor.processAttribsWithScripts();

        //add call back for other scanners. Can make this more extensible in the future
        flush();
        // start watching for changes after initial scan
        watchDOM();
      });
    };


    var wrapEvalTypeMethods = function() {
        var OldFunction = Function;
        Function = function () {
            var createdFunction = OldFunction.apply(this, arguments);
            if (cancelFlag === false) {
              scriptSigProcessor.processScriptString(document.currentScript, createdFunction.toString(), 'Function');
            }
            return createdFunction;
        };
        Function.prototype = OldFunction.prototype;
        /* This cannot be used until we can find a solution to scope on
         * direct/indirect calls to eval
        var oldEval = window.eval;
        window.eval = function () {
            if (arguments.length === 1) {
                if (cancelFlag === false) scriptSigProcessor.processScriptString(document.currentScript, arguments[0], "eval");
                return oldEval(arguments[0]);
            }
            return oldEval();
        };
        */
    };


  var doMethodOverrides = function () {
    if (config.overrideConfig) {
      var handleOverrideLog = function (propertyStr, stackTrace) {
        var jsPropertyViolationEvent = createEvent('js_property_violation');
        jsPropertyViolationEvent.data.stackTrace = stackTrace;
        jsPropertyViolationEvent.data.property = propertyStr;
        queueEvent(jsPropertyViolationEvent);
      };

      for (var i = 0; i < config.overrideConfig.length; i++) {
        var overrideData = config.overrideConfig[i];
        TCellOverride.replaceProperty(overrideData.label,
          overrideData.block,
          overrideData.log ? handleOverrideLog : null);
      }
    }
  };

  var safeguardCriticalFunctions = function () {
    TCellSafeguards.init();
  };

  var postConfigRun = function() {
    setInterval( flushEvents, 500);
  };

  var run = function() {
    safeguardCriticalFunctions();
    wrapEvalTypeMethods();
    scanDOM();
    doMethodOverrides();
    postConfigRun();
  };
  exports.run = run;

  //detatch and disable agent
  var cancel = function() {
      cancelFlag = true;
  };
  exports.cancel = cancel;

  var loadConfig = function (customConfig) {
    safeguardCriticalFunctions();
    var thisScriptTag = TCellUtils.getThisScriptTag();
    if (thisScriptTag !== null) {
      config.postUrl = thisScriptTag.getAttribute('report-to') || config.postUrl;
      config.applicationId = thisScriptTag.getAttribute('app-id') || config.appId;
    }
    if (customConfig) {
      for (var attrname in customConfig) { config[attrname] = customConfig[attrname]; }
    }
    if (scriptSigProcessor) {
      scriptSigProcessor.start(config.scriptSignatureWhitelist);
    }
    return exports;
  };
  exports.loadConfig = loadConfig;

  return exports;
};

// @ifndef TEST
if (window) {
    (new TCellAgent()).loadConfig().run();
}
// @endif
