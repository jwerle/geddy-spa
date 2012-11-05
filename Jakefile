namespace('doc', function () {
  var config = {
    async : true
  };

  task('generate', ['doc:clobber'], function () {
    var cmd = '../node-jsdoc-toolkit/app/run.js -n -r=100 ' +
        '-t=../node-jsdoc-toolkit/templates/codeview -d=./doc/ ./lib';
    console.log('Generating docs ...');
    jake.exec([cmd], function () {
      console.log('Done.');
      complete();
    });
  }, config);

  task('remove', function () {
    var cmd = 'rm -fr ./doc/**';

    jake.exec([cmd], function () {
      console.log('Removed old docs from last generation.');
      complete();
    });

  }, config);

});

task('install', function() {
  var templates = []
    , dirs = []

  task('template', function(){
    var i 

    console.log("Gathering templates..");

    for (i = 0; i < arguments.length; i++) {
      templates.push(arguments[i]);
    }

  });

  task('to', ['template'], function(){
    console.log("Gathering destinations..");

    for (i = 0; i < arguments.length; i++) {
      dirs.push(arguments[i]);
    }

    jake.Task['::copy'].invoke();
  });

  task('::copy', function(){
    console.log("Preparing to copy..");

    if (templates.length && dirs.length) {
      var x, i

      for (i = 0; i < templates.length; i++) {
        for (x = 0; x < dirs.length; x++) {
          console.log('Copying template ' + templates[i] + ' to '+ dirs[x]);
          jake.exec('cp -rf ./templates/'+ templates[i] + '/* ' + dirs[x]);
        }
      }
    }
  });

});