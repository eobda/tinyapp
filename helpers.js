// Look up user by any parameter
const getUserByParam = function(lookup, param, users) {
  for (const user in users) {
    if (users[user][param] === lookup) {
      return users[user];
    }
  }

  // If user not found
  return null;
};