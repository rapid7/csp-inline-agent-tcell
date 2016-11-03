/**
 * Created by michaelfeiertag on 3/2/15.
 */

var zlib = require('zlib');
module.exports = function(grunt) {
    grunt.registerMultiTask('gzip', function() {
        var done = this.async();

        var files = this.files.slice();

        function process() {
            if(files.length <= 0) {
                done();
                return;
            }

            var file = files.pop();

            grunt.log.writeln("Compressing " + file.src[0] + "...");
            var content = grunt.file.read(file.src[0], { encoding: null });

            zlib.gzip(content, function(err, compressed) {
                grunt.file.write(file.dest, compressed);
                grunt.log.ok("Compressed file written to " + file.dest);
                process();
            });
        }

        process();
    });
};
