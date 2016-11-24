module.exports = function(grunt) {

    ////
    // grunt config
    ////

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            target: [
                '*.js', // top-level
                'test/**/*.js' // tests
            ],
            options: {
                configFile: '.eslintrc-node.json',
                // fix: true,                           // > enable for auto-fixing some stylistic issues
                outputFile: ''                          // > output to cli
                // outputFile: './log/eslint-errors'    // > output to file (no cli)
            }
        },

        // configure watch task
        watch: {
            files: ['<%= eslint.target %>'],
            tasks: ['eslint']
        }

    }); // end grunt.initConfig

    ////
    // grunt tasks
    ////

    // requirements
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // custom tasks (mind the order of your tasks!), just comment out what you don't need
    grunt.registerTask(
        'default',
        'Runs eslint.', [
            'eslint'
        ]
    );

}; // end module.exports
