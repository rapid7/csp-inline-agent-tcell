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

var TCellUtils = {
  getThisScriptTag: function() {
    try {
        if (document.currentScript !== null) {
            return document.currentScript;
        }
    } catch(err) {
      console.log('currentScript not supported, attempting dom');
      console.log(err);
    }

    var scripts = document.getElementsByTagName('script');
    var tcellScriptTag = scripts[scripts.length - 1];
    if (tcellScriptTag.getAttribute('tcellappid') !== null) {
        return tcellScriptTag;
    }
    // This is a final attempt and is usually not added to the script tag
    tcellScriptTag = document.getElementById('tcellAgent');
    if (tcellScriptTag !== null) {
        return tcellScriptTag;
    }
    return null;
  },

  hashFunction: function (stringToHash) {
    var hash = 0, i, chr, len;
    if (stringToHash.length === 0) {
      return 'tc1-' + hash;
    }

    for (i = 0, len = stringToHash.length; i < len; i++) {
      chr = stringToHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }

    return 'tc1-' + stringToHash.length.toString(32) + hash.toString(32);
  },

  sha256HashFunction: function (stringToHash) {
    if (stringToHash.length > 750) {
      // This is faster for larger scripts
      try {
        return 'sha256-' + asmCrypto.SHA256.base64(stringToHash);
      } catch(err) {
        if (!TCellUtils.hideFullExceptionMessage) { console.log(err); }
      }
    }
    try {
      return 'sha256-' + b64_sha256(stringToHash);
    } catch(err) {
      console.log('sha256 failed');
      console.log(err);
    }
    return 'sha256-sha256failed';
  },

  urlSafeSHA: function (stringToHash) {
    var b64hash = this.sha256HashFunction(stringToHash);
    return b64hash.replace(/\+/g,'-').replace(/\//g, '_');
  },

  guid: (function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return function () {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    };
  })(),

  // from http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
  inIframe: function () {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  },


  // from firebug https://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js?spec=svn12950&r=8828#1332

  /**
   * Gets an XPath for an element which describes its hierarchical location.
   */
  getElementXPath: function (element) {
    if (element && element.id) {
      return '//*[@id="' + element.id + '"]';
    } else {
      return TCellUtils.getElementTreeXPath(element);
    }
  },

  getAttributeXPath: function (attrName, element) {

    if (typeof attrName !== 'undefined') {
      return TCellUtils.getElementTreeXPath(element) + '[@' + attrName + ']';
    } else {
      return TCellUtils.getElementTreeXPath(element);
    }
  },

  getElementTreeXPath: function (element) {
    var paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType === 1; element = element.parentNode) {
      var index = 0;
      for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
        // Ignore document type declaration.
        if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) {
          continue;
        }
        if (sibling.nodeName === element.nodeName) {
          ++index;
        }
      }

      var tagName = element.nodeName.toLowerCase();
      var pathIndex = (index ? '[' + (index + 1) + ']' : '');
      paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? '/' + paths.join('/') : null;
  },

  getStackTrace: function() {
    var retVal;
    try {
      throw new Error();
    } catch (e) {
      retVal = e.stack;
    }
    return retVal;
  },

  getScrubbedContext: function(targetElement) {
    if (targetElement === null || !(targetElement instanceof HTMLElement)) {
      return [];
    }
    var whitelist = ['id','class','name'];
    var scrubNode = function (node) {
      var scrubbedNode = {'n': node.tagName};
      for (var i=0; i<node.attributes.length; i++) {
           var name = node.attributes[i].name;
           if (whitelist.indexOf(name) !== -1) {
              scrubbedNode[name]=node.attributes[i].value;
           } else {
              if (scrubbedNode.other === undefined) {
                scrubbedNode.other=[];
              }
              scrubbedNode.other.push(name);
           }
       }
       return scrubbedNode;
    };

    var scrubbedInjectedNode = scrubNode(targetElement.cloneNode(false));
    var scrubbedParentNode = null;
    if (targetElement.parentElement) {
      scrubbedParentNode = scrubNode(targetElement.parentElement.cloneNode(false));
    }

    var before = [];
    var nodeStep = targetElement;
    var i, nodeStepScrubbed;
    for (i=0; i<2; i++) {
      nodeStep = nodeStep.previousElementSibling;
      if (!nodeStep) {
        break;
      }
      nodeStepScrubbed = scrubNode(nodeStep.cloneNode(false));
      before.unshift(nodeStepScrubbed);
    }

    var after = [];
    nodeStep = targetElement;
    for (i=0; i<2; i++) {
      nodeStep = nodeStep.nextElementSibling;
      if (!nodeStep) {
        break;
      }
      nodeStepScrubbed = scrubNode(nodeStep.cloneNode(false));
      after.push(nodeStepScrubbed);
    }

    return [scrubbedInjectedNode,
     scrubbedParentNode,
     before,
     after];
  }
};
