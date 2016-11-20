/*
uphook
express middleware to automatically update and restart an application based on github webhook.

usage: if verified hook on right branch, git force-pulls to current branch and calls the callback.
  let hook = require('uphook').github(process.env.GH_SECRET, function(payload){
    process.exit(0); //lets PM2 restart the process
  });
  express.use('/gh-update', hook);
*/

let bluebird = require('bluebird');
let exec = bluebird.promisify(require('child_process').exec);
let gitbranch = require('git-branch');

module.exports.github = function(secret, callback){
  let ghHandler = require('github-webhook-middleware')({secret: secret});
  return [
    //returns two middlewares for Express to run sequentially.
    ghHandler,
    function (err, req, res, next){
      let branch = gitbranch.sync();
      if(req.headers['x-github-event'] != 'push' || req.body.ref != 'refs/heads/' + branch)
        res.sendStatus(200);
      else
        //Careful, as this erases all tracked changes.
        //todo: generalize to default to tracked branch but be able to pull from any remote
        exec('git fetch --all && git reset --hard origin/' + branch + ' && npm install && npm prune')
        .spread(function(stdout, stderr){
          console.log(stdout, stderr);
          res.sendStatus(200);
          callback(req.body);
        }).catch(function(err){
          console.error(err);
          res.sendStatus(500);
        });
    }
  ];
};
