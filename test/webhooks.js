'use strict';

const secret = 'superawesomesecret';

let request = require('supertest');
let express = require('express');
let app = express();
let uphook = require('../uphook');
let fs = require('fs');

app.post('/gh-hook', uphook.github({secret: secret}));

describe('github webhooks', function() {
  it('takes a valid GitHub webhook', function(done) {
    request(app, require('./test/assets/github-valid.json'))
      .post('/gh-hook')
      .set('content-type', 'application/json')
      .set('Expect', '')
      .set('User-Agent', 'GitHub-Hookshot/ac156fb')
      .set('X-GitHub-Delivery', 'd1af9a80-af80-11e6-9c78-b4baecc83d2a')
      .set('X-GitHub-Event', 'push')
      .set('X-Hub-Signature', 'sha1=6104fc634954b1ca0fc835300d71b790829489bc')
      .expect(200, done);
  });
});
