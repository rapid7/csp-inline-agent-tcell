# csp-inline-agent

# Use

``` html
<script src="js-csp-agent.js" report-to="https://example.com/csp"></script>
```

# Building

`> grunt`

Which will build a debug, test, and production version.

`> grunt test`

Will run tests

# Reports 

```json
{
  "v": 1,
  "applicationId": "testapp",
  "requestId": "a2f:b449:d90b:972b",
  "sessionId": "5e7fe88e-e709-4e65-8041-f78bd95ad121",
  "documentUri": "https://mysite.example.com/",
  "referrer": "",
  "events": [
   {
      "event_type": "script_src",
      "data": {
        "src": "https://tcell.io/abc.js",
        "hasNonce": false,
        "scriptPos": {
          "loc": "/html/head/script[2]",
          "script_index": 3,
          "last_index": 4
        },
        "scriptContext": [
          {"n": "SCRIPT","other": ["src"]},
          {"n": "HEAD"},
          [{"n": "SCRIPT", "other": ["src"]}],
          []
        ]
      }
    },
    {
      "event_type": "inline_script",
      "data": {
        "hashes": {
           "sha256": "sha256-aKQ9Nam5Vond94ijRJX56cmZaO8jTUS9UjAuOyb50Mk="
        },
        "hasNonce": false,
        "scriptPos": {
          "loc": "/html/body/script",
          "script_index": 3,
          "last_index": 4
        },
        "scriptContext": [
          {"n": "SCRIPT"},
          {"n": "BODY"},
          [{"n": "H1"}],
          []
        ]
      }
    }
  ]
}
```

# Copyright and License

BSD-3-Clause
See LICENSE file for complete license
