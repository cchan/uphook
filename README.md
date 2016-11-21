# uphook

express middleware to automatically update and restart an application based on github/gitlab webhook.

## usage
if verified hook on right branch, git force-pulls to current branch and calls the callback.

    let hook = require('uphook').github({
      secret: process.env.GH_SECRET,
      verify: function(req, res){
        return true;
        //before it calls gitupdate(), can return false to cancel that.
      },
      callback: function(err, payload){
        if(!err)
          process.exit(0); //lets PM2 restart the process
      }
    });
    app.use('/gh-update', hook);

note that you should definitely use SSL because GitLab doesn't have HMAC, which is dumb.
