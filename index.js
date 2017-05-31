'use strict';
const BbPromise = require('bluebird');
const _ = require('lodash');

class ServerlessDeleteLoggroups {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options || {};
    this.provider = this.serverless.getProvider('aws');
    this.service = this.serverless.service.service;
    this.region = this.provider.getRegion();
    this.stage = this.provider.getStage();

    this.commands = {
      remove: {
        commands: {
          logs: {
            usage: 'Delete all Loggroups',
            lifecycleEvents: [
              'remove',
            ],
            options: {
              stage: {
                usage: 'Stage of the service',
                shortcut: 's',
              },
              region: {
                usage: 'Region of the service',
                shortcut: 'r',
              },
            },
          },
        },
      },
    };

    this.hooks = {
      'remove:logs:remove': () => BbPromise.bind(this)
        .then(this.removeLogGroups),
    };
  }

  removeLogGroups() {
    const logGroupNames = [];
    _.forEach(this.serverless.service.functions, (value, key) => {
      logGroupNames.push(`/aws/lambda/${value.name}`);
    });
    return BbPromise.map(logGroupNames, (value) => this.removeLogGroup(value))
    .then(() => {
      this.serverless.cli.log('Finished');
      return BbPromise.resolve();
    });
  }

  removeLogGroup(name) {
    return this.provider.request('CloudWatchLogs',
      'deleteLogGroup',
      {
        logGroupName: name,
      },
      this.options.stage,
      this.options.region)
    .then(() => {
        this.serverless.cli.log(`Successfully removed logGroup ${name}`);
        return BbPromise.resolve()
    })
    .catch((e) => {
        this.serverless.cli.log(`Failed to remove logGroup ${name}: ${e.message}`);
        return BbPromise.resolve()
    });
  }
}
module.exports = ServerlessDeleteLoggroups;
