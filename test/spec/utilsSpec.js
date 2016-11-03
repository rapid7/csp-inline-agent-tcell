TCellUtils.hideFullExceptionMessage = true
describe( 'test js utilities', function() {

    it("test hash", function () {

        expect(TCellUtils.hashFunction("foo")).toEqual("tc1-33366");
        expect(TCellUtils.hashFunction("bar")).toEqual("tc1-32v0j");
        expect(TCellUtils.hashFunction("this is a longer string \nwith some punctuation!!!\nand some numbers like 7878.21")).toEqual("tc1-2fjrd1h9");
        expect(TCellUtils.hashFunction("The quick blue fox jumped over the sleeping wolf.")).toEqual("tc1-1h108no14");

        expect(TCellUtils.hashFunction("")).toEqual("tc1-0");
        expect(TCellUtils.sha256HashFunction("The quick blue fox jumped over the sleeping wolf.")).toEqual("sha256-1g/fHc1Pznq6rID35MnHcIXwgT6QeAuRXsEhWDPjzLY=");
        expect(TCellUtils.sha256HashFunction("")).toEqual("sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=");

        // This is what we're going to protect against
        expect(function() { asmCrypto.SHA256.base64("ABCD „ “ »"); }).toThrow(new Error("Wide characters are not allowed."));
        // Now see if we did (750 chars needed to use that algo)
        expect(TCellUtils.sha256HashFunction("ABCD „ “ »" + Array(750).join(" "))).toEqual("sha256-4vemqULzUn61F0670ir9PTQU4nUuo2pSajhriZezpGE=");
    });

    it("tests context", function() {

        var script = document.createElement("script");
        script.innerText = "alert(1);";
        expect(TCellUtils.getScrubbedContext(script)).toEqual([ { n : 'SCRIPT' }, null, [  ], [  ] ]);

        var div = document.createElement("div");
        div.setAttribute("id","test");
        div.setAttribute("xyz","confidential")
        div.appendChild(script);

        expect(TCellUtils.getScrubbedContext(script)).toEqual([ 
            { n : 'SCRIPT' }, 
            { n : 'DIV', id : 'test', other: ['xyz'] }, 
            [  ], 
            [  ]]);

        var buddy1 = document.createElement("input");
        buddy1.setAttribute("name","test2");
        buddy1.setAttribute("value","confidential");
        div.appendChild(buddy1);

        expect(TCellUtils.getScrubbedContext(script)).toEqual([ 
            { n : 'SCRIPT' }, 
            { n : 'DIV', id : 'test', other:['xyz'] }, 
            [  ], 
            [ { n : 'INPUT', name : 'test2', other : ['value'] } ]]);

        var buddy2 = document.createElement("select");
        buddy2.setAttribute("name","test3");
        buddy2.setAttribute("value","confidential");
        div.insertBefore(buddy2, script);

        expect(TCellUtils.getScrubbedContext(script)).toEqual([ 
            { n : 'SCRIPT' }, 
            { n : 'DIV', id : 'test', other : ['xyz']  }, 
            [ { n : 'SELECT', name : 'test3', other : ['value']  } ], 
            [ { n : 'INPUT', name : 'test2', other : ['value']  } ]]);
        

        var buddy3 = buddy2.cloneNode();
        buddy3.setAttribute("name","3");
        var buddy4 = buddy2.cloneNode();
        buddy4.setAttribute("name","4");
        var buddy5 = buddy2.cloneNode();
        buddy5.setAttribute("name","5");

        div.insertBefore(buddy5, buddy2);
        div.insertBefore(buddy4, buddy2);
        div.insertBefore(buddy3, buddy2);

        expect(TCellUtils.getScrubbedContext(script)).toEqual([ 
            { n : 'SCRIPT' }, 
            { n : 'DIV', id : 'test', other : ['xyz']  }, 
            [ { n : 'SELECT', name : '3', other : ['value']  }, { n : 'SELECT', name : 'test3', other : ['value'] } ], 
            [ { n : 'INPUT', name : 'test2', other : ['value']  } ]]);

    });
});
