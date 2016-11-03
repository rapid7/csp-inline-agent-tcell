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

var TCellUtils;

var TCELL_SIGNATURES = {
    STATIC_SIGNATURE : 'static',
    TEMPLATE_SIGNATURE : 'template'
};

function ScriptSignature(hashType, hash) {
  this.hash = hash;
  this.hashType = hashType;
}

function ScriptSignatureProcessor(reportCallback) {
  this.reportCallback = reportCallback;
  this.isReady = true;
  this.scriptElementQueue = [];
  this.attributesQueue = [];
  this.scriptStringQueue = [];
  this.javascriptPrefixLength = 'javascript:'.length;
  this.javascriptPrefixDecodeElement = document.createElement('textarea');
  this.attribNames = [
        // src tags
        'src',
        'href',

        //body tags
        'onafterprint',
        'onbeforeprint',
        'onbeforeunload',
        'onerror',
        'onhashchange',
        'onload',
        'onmessage',
        'onoffline',
        'ononline',
        'onpagehide',
        'onpageshow',
        'onpopstate',
        'onresize',
        'onstorage',

        //form events
        'onblur', 'onchange', 'oncontextmenu', 'onfocus', 'oninput', 'oninvalid', 'onreset', 'onsearch', 'onselect', 'onsubmit',

        //keyboard events
        'onkeydown', 'onkeypress', 'onkeyup',

        //mouse events
        'onclick',
        'ondblclick',
        'ondrag',
        'ondragend',
        'ondragenter',
        'ondragleave',
        'ondragover',
        'ondragstart',
        'ondrop',
        'onmousedown',
        'onmousemove',
        'onmouseout',
        'onmouseover',
        'onmouseup',
        'onmousewheel',
        'onscroll',
        'onwheel',

        //clipboard events
        'oncopy', 'oncut', 'onpaste',

        //media events
        'onabort',
        'oncanplay',
        'oncanplaythrough',
        'oncuechange',
        'ondurationchange',
        'onemptied',
        'onended',
        'onerror',
        'onloadeddata',
        'onloadedmetadata',
        'onloadstart',
        'onpause',
        'onplay',
        'onplaying',
        'onprogress',
        'onratechange',
        'onseeked',
        'onseeking',
        'onstalled',
        'onsuspend',
        'ontimeupdate',
        'onvolumechange',
        'onwaiting',

        //misc events
        'onshow', 'ontoggle'
      ];

}

ScriptSignatureProcessor.prototype = {
  // Called after async is ready
  start: function(scriptSignatureWhitelist, scriptDomainWhitelist) {
    if (!scriptSignatureWhitelist) {
      scriptSignatureWhitelist = {};
      scriptSignatureWhitelist[TCELL_SIGNATURES.STATIC_SIGNATURE] = [];
    }
    this.scriptDomainWhitelist = scriptDomainWhitelist;
    this.scriptSignatureWhitelist = scriptSignatureWhitelist;
    if (this.isReady === true) {
      return;
    }
    this.isReady = true;
    var elementData, i;
    for (i=0; i < this.scriptElementQueue.length; i++) {
      elementData = this.scriptElementQueue[i];
      this.processScriptElement(
        elementData.scriptElement,
        elementData.scriptString,
        elementData.scriptPos,
        elementData.scriptCxt
        );
    }
    this.scriptElementQueue = [];
    for (i=0; i < this.attributesQueue.length; i++) {
      elementData = this.attributesQueue[i];
      this.processAttribute(
        elementData.scriptElement,
        elementData.attr,
        elementData.attrValue,
        elementData.attrName,
        elementData.scriptPos,
        elementData.scriptCxt
        );
    }
    this.attributesQueue = [];
    for (i=0; i < this.scriptStringQueue.length; i++) {
      elementData = this.scriptStringQueue[i];
      this.processScriptString(
        elementData.scriptElement,
        elementData.scriptString,
        elementData.altPos,
        elementData.scriptPos,
        elementData.scriptCxt
        );
    }
    this.scriptStringQueue = [];
  },
  queueScriptElement: function(scriptElement, scriptString, scriptPos, scriptCxt) {
    this.scriptElementQueue.push({
      scriptElement: scriptElement,
      scriptString: scriptString,
      scriptPos: scriptPos,
      scriptCxt: scriptCxt});
  },
  queueScriptString: function(scriptElement, scriptString, altPos, scriptPos, scriptCxt) {
    this.scriptStringQueue.push({
      scriptElement: scriptElement,
      scriptString: scriptString,
      altPos: altPos,
      scriptPos: scriptPos,
      scriptCxt: scriptCxt});
  },
  queueAttribute: function(scriptElement, attr, attrValue, attrName, scriptPos, scriptCxt) {
    this.attributesQueue.push({
      scriptElement: scriptElement,
      attr: attr,
      attrValue: attrValue,
      attrName: attrName,
      scriptPos: scriptPos,
      scriptCxt: scriptCxt});
  },

  processCandidateElement: function(element) {
    try {
      for (var aIndex = 0; aIndex < element.attributes.length; aIndex++) {
        var attr = element.attributes[aIndex];
        //is this a script attrib
        if (attr.specified && (this.attribNames.indexOf(attr.name) !== -1)) {
          this.processAttribute(element, attr);
        }
      }
    } catch (err) {
      console.log(err);
    }
  },

  processAttribsWithScripts: function () {
    try {
      //http://www.w3schools.com/tags/ref_eventattributes.asp

      var qString = '';
      for (var i = 0; i < this.attribNames.length; i++) {
        qString += '[' + this.attribNames[i] + '],';
      }
      //trim last ','
      qString = qString.substr(0, qString.length - 1);

      //TODO: test performance
      var candidateElements = document.querySelectorAll(qString);

      //now iterate over resulting elements and get the attribute values
      for (var eIndex = 0; eIndex < candidateElements.length; eIndex++) {
        var element = candidateElements[eIndex];
        this.processCandidateElement(element);
      }
    } catch (err) {
      console.log(err);
    }
  },

  decodeHtml: function(html) {
    this.javascriptPrefixDecodeElement.innerHTML = html;
    return this.javascriptPrefixDecodeElement.value;
  },

  scriptIfJavaScriptProtocol: function(value) {
    if (value && value.length > this.javascriptPrefixLength &&
        ['j','J','&'].indexOf(value[0]) !== -1) {
      var decoded = this.decodeHtml(value);
      if (decoded) {
        var colonIdx = decoded.indexOf(':');
        if (colonIdx !== -1) {
          var prefix = decoded.substring(0, colonIdx+1).replace(/\s+/g, '');
          var payload = decoded.substring(colonIdx+1, decoded.length);
          if (prefix.toLowerCase() === 'javascript:') {
            return payload;
          }
        }
      }
    }
    return null;
  },

  processAttribute: function(scriptElement, attr, scriptTxt, attrName, scriptPos, scriptCxt) {
    try {
      if (!attr || !attr.value || attr.value === '') {
        return;
      }
      if (['src','href'].indexOf(attr.name) !== -1) {
        if ((attr.name === 'src' && scriptElement.nodeName === 'IFRAME') ||
            (attr.name === 'href' && scriptElement.nodeName === 'A')) {
          scriptTxt = this.scriptIfJavaScriptProtocol(attr.value);
          if (scriptTxt !== null) {
            this.processAttributeNotSrc(scriptElement, attr, scriptTxt, attrName, scriptPos, scriptCxt);
          }
        }
      } else {
        scriptTxt = this.scriptIfJavaScriptProtocol(attr.value) || scriptTxt;
        this.processAttributeNotSrc(scriptElement, attr, scriptTxt, attrName, scriptPos, scriptCxt);
      }
    } catch (err) {
      console.log(err);
    }
  },

  processAttributeNotSrc: function(scriptElement, attr, scriptTxt, attrName, scriptPos, scriptCxt) {
    try {
      if (!this.isReady) {
        this.queueAttribute(
          scriptElement,
          attr,
          attr.value,
          attr.name,
          this.getScriptPosition(scriptElement, attr.name),
          this.getScriptContext(scriptElement));
        return;
      }
      if (!scriptTxt) {
        scriptTxt = attr.value;
      }
      if (!attrName) {
        attrName = attr.name;
      }
      var staticCheck = this.checkStatic(scriptTxt);
      if (staticCheck.ok === false) {
          if (!scriptPos) {
            scriptPos = this.getScriptPosition(scriptElement, attrName);
          }
          if (!scriptCxt) {
            scriptCxt = this.getScriptContext(scriptElement);
          }
          this.reportScriptViolation(scriptElement, scriptTxt, staticCheck.details, scriptPos, scriptCxt);
      }
    } catch (err) {
      console.log(err);
    }
  },

  processScriptElement: function (scriptElement, scriptText, scriptPos, scriptCxt) {
    try {
      if (!this.isReady) {
        this.queueScriptElement(
          scriptElement,
          scriptElement.innerHTML,
          this.getScriptPosition(scriptElement),
          this.getScriptContext(scriptElement));
        return;
      }
      if (!scriptText) {
        scriptText = scriptElement.innerHTML;
      }
      var staticCheck = {};
      if (scriptText && scriptText !== '') {
        staticCheck = this.checkStatic(scriptText);
        if (staticCheck.ok === true) {
          return;
        }
      } else if (scriptElement.src) {
        if (this.checkSourceUrl(scriptElement.src)) {
          return;
        }
      }
      if (!scriptPos) {
        scriptPos = this.getScriptPosition(scriptElement);
      }
      if (!scriptCxt) {
        scriptCxt = this.getScriptContext(scriptElement);
      }
      var hasNonce = scriptElement.getAttribute('nonce') !== null;
      this.reportScriptViolation(scriptElement, scriptText, staticCheck.details, scriptPos, scriptCxt, hasNonce, scriptElement.src);
    } catch (err) {
      console.log(err);
    }
  },

  processScriptString: function (scriptElement, scriptString, altLocation, scriptPos, scriptCxt) {
    try {
      if (!this.isReady) {
        var preScriptPos = null;
        if (scriptElement === null) {
          preScriptPos = altLocation;
        } else {
          preScriptPos = this.getScriptPosition(scriptElement);
        }
        this.queueScriptString(
          scriptElement,
          scriptString,
          altLocation,
          preScriptPos,
          this.getScriptContext(scriptElement));
        return;
      }
      //try static
      var staticCheck = this.checkStatic(scriptString);
      if (staticCheck.ok === false) {
        if (!scriptPos) {
          if (scriptElement === null) {
            scriptPos = altLocation;
          } else {
            scriptPos = this.getScriptPosition(scriptElement);
          }
        }
        if (!scriptCxt) {
          scriptCxt = this.getScriptContext(scriptElement);
        }
        scriptPos = this.getScriptPosition(scriptElement);
        this.reportScriptViolation(scriptElement, scriptString, staticCheck.details, scriptPos);
      }
    } catch (err) {
      console.log(err);
    }
  },

  // Check if the url is local, same domain, or on a whitelist (todo)
  checkSourceUrl: function (url) {
    var parser = document.createElement('a');
    parser.href = url;
    var scriptDomain = parser.host;
    if (scriptDomain) {
      if (scriptDomain === '') {
        return true;
      }
      var windowLocation = window.location.hostname;
      var windowLocationWithPort = windowLocation;
      if (window.location.port) {
        windowLocationWithPort = windowLocationWithPort + ':' + window.location.port;
      }
      if (windowLocation === scriptDomain || windowLocationWithPort === scriptDomain) {
        return true;
      }
    }
    return false;
  },

  // check if block is on the static script hash list
  checkStatic: function (scriptText) {
    var retVal = {ok:false, details: {}};
    var hash = this.computeHash(scriptText);
    retVal.details = {type: TCELL_SIGNATURES.STATIC_SIGNATURE, hash: hash, script: scriptText};
    var signatures = this.scriptSignatureWhitelist[TCELL_SIGNATURES.STATIC_SIGNATURE];
    if (signatures && signatures.indexOf(hash) !== -1) {
      retVal.ok = true;
    }
    return retVal;
  },

  checkAlreadyReported: function (scriptHash) {
    return (scriptHash && this.scriptsReported.indexOf(scriptHash) !== -1);
  },

  computeHash: function(text) {
    return TCellUtils.urlSafeSHA(text)
  },

  getScriptContext: function(scriptElement) {
    if (scriptElement instanceof HTMLElement) {
      try {
        return TCellUtils.getScrubbedContext(scriptElement);
      } catch(err) { }
    }
    return null;
  },

  getScriptPosition: function (scriptElement, attrName) {

    var retVal = {};

    retVal.loc = TCellUtils.getAttributeXPath(attrName, scriptElement)

    //check head
    var headNodes = document.head.childNodes;
    var headIndex = Array.prototype.indexOf.call(headNodes, scriptElement);
    if (headIndex !== -1) {
      retVal.script_index = headIndex;
      retVal.last_index = headNodes.length - 1;
    } else {
      // check body
      var bodyNodes = document.body.childNodes;
      var bodyIndex = Array.prototype.indexOf.call(bodyNodes, scriptElement);

      if (bodyIndex !== -1) {
        retVal.script_index = bodyIndex;
        retVal.last_index = bodyNodes.length - 1;
      }
    }
    return retVal;
  },

  // add to queue for sending
  reportScriptViolation: function (scriptElement, scriptText, staticDetails, scriptPos, scriptCxt, hasNonce, scriptSrc) {
    this.reportCallback(scriptElement, scriptText, staticDetails, scriptPos, scriptCxt, hasNonce, scriptSrc);
  }
};
