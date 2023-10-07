const { assert } = require('chai');

const { getUserByParam } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByParam', function() {
  it('should return a user with a valid email', function() {
    const user = getUserByParam('user@example.com', 'email', testUsers).id;
    const expectedUserID = 'userRandomID';
    assert.equal(user, expectedUserID);
  });

  it('should return undefined for an email not associated with a user', function() {
    const user = getUserByParam('bilL@lighthouselabs.ca', 'email', testUsers);
    assert.equal(user, undefined);
  });
});