/**
 * executions-table view.
 *
 * @author wenbin@nextdoor.com
 */

require.config({
  paths: {
    'jquery': 'vendor/jquery',
    'underscore': 'vendor/underscore',
    'backbone': 'vendor/backbone',
    'bootstrap': 'vendor/bootstrap',
    'datatables': 'vendor/jquery.dataTables',

    'utils': 'utils',
    'text': 'vendor/text',
    'execution-result': 'templates/execution-result.html'
  },

  shim: {
    'bootstrap': {
      deps: ['jquery']
    },

    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },

    'datatables': {
      deps: ['jquery'],
      exports: '$.fn.dataTable'
    }
  }
});

define(['utils',
        'text!execution-result',
        'backbone',
        'bootstrap',
        'datatables'], function(utils, ExecutionResultHtml) {
  'use strict';

  return Backbone.View.extend({
    initialize: function() {
      $('body').append(ExecutionResultHtml);

      this.listenTo(this.collection, 'sync', this.render);
      this.listenTo(this.collection, 'request', this.requestRender);
      this.listenTo(this.collection, 'error', this.requestError);

      this.table = $('#executions-table').dataTable({
        // Sorted by last updated time
        'order': [[3, 'desc']],
        // Disable sorting on result column
        "columnDefs": [
          { "orderable": false, "className": "table-result-column", "width": "20px", "targets": 5 }
        ]
      });
    },

    /**
     * Request error handler.
     *
     * @param {object} model
     * @param {object} response
     * @param {object} options
     */
    requestError: function(model, response, options) {
      this.spinner.stop();
      utils.alertError('Request failed: ' + response.responseText);
    },

    /**
     * Event handler for starting to send network request.
     */
    requestRender: function() {
      this.table.fnClearTable();
      this.spinner = utils.startSpinner('executions-spinner');
    },

    /**
     * Event handler for finishing fetching execution data.
     */
    render: function() {
      var executions = this.collection.executions;

      var data = [];
      _.each(executions, function(execution) {
        data.push([
          execution.getNameHTMLString(),
          execution.getStatusHTMLString(),
          execution.getScheduledAtString(),
          execution.getFinishedAtString(),
          execution.getDescription(),
          execution.getResult()
        ]);
      });

      if (data.length) {
        this.table.fnClearTable();
        this.table.fnAddData(data);

        var buttons = $('[data-action=show-result]');
        _.each(buttons, function(btn) {
          $(btn).on('click', _.bind(function(e) {
            e.preventDefault();
            var result = decodeURI($(btn).data('content'))
                         .replace(/^["]|["]$/g, '').replace(/\\n/g, '')
                         .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
            $('#result-box').html($.parseHTML(result));
            $('#execution-result-modal').modal();
          }, this));

          // If there's a query parameter result, we'll display the result.
          if (!_.isUndefined(utils.getParameterByName('result'))) {
            $('#result-box').html(executions[0].get('result'));
            $('#execution-result-modal').modal();
          }
        });
      }

      utils.stopSpinner(this.spinner);
    }
  });
});
