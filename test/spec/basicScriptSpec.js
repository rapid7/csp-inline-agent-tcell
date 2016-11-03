describe('test parse and formatting', function () {

  if (window.runContext === 'SpecRunner') {
      beforeEach(function () {
          loadFixtures('scripts.html')
      });
  }
  else {
      jasmine.getFixtures().fixturesPath = 'base';
      beforeEach(function () {
         loadFixtures('spec/javascripts/fixtures/scripts.html')
         jasmine.Ajax.install();
      });
      afterEach(function() {
        jasmine.Ajax.uninstall();
      });
  }

  it("Try to find Javascript in event handler", function() {

    var scriptElement = document.getElementById('testScript1');
    var validEvent = {};

    validEvent.eventType = "inline_script";
    validEvent.data = {
      hashes: {
        sha256: 'sha256-kzwfmnEvOebOmDs5fCiuN59DONw-avSxoLhZ3Pecfaw='
      },
      hasNonce: false,
      scriptPos: {
        loc: "/html/body/div/div/script[2]"
      },
      scriptContext: [
        {
          n: "SCRIPT",
          id: "testScript1",
        },
        {
          n: "DIV",
          id: "testDivScript1"
        },
        [{n: "SCRIPT"}],
        []
      ]
    }

    var validMsg = {};
    validMsg.applicationId = TCellUtils.guid();
    validMsg.requestId = TCellUtils.guid();
    validMsg.sessionId = TCellUtils.guid();
    validMsg.events = [validEvent];

    var validMsgJson = JSON.stringify(validMsg);

    var agent = new TCellAgent();
    agent.loadConfig({
      postUrl: 'post_url',
      sessionId: validMsg.session_id,
      applicationId: validMsg.application_id,
      requestId: validMsg.request_id,
      sessionId: validMsg.session_id
    }).run();

    // agent.loadConfig();
    agent.clearEvents();
    agent.postPageSummary();
    agent.flushEvents();

    agent.scriptSigProcessor.processScriptElement(scriptElement);
    agent.flushEvents();

    var request = jasmine.Ajax.requests.mostRecent();

    //console.log(JSON.stringify(request.data()[0]));
    expect(JSON.stringify(request.data()[0])).toEqual(JSON.stringify(validEvent));

    agent.cancel();

  });
});
