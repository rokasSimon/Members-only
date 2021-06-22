const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true },
    hash: { type: String, required: true },
    isMember: { type: Boolean, required: true, default: false },
    isAdmin: { type: Boolean, required: true, default: false }
  });
  
UserSchema
  .virtual('url')
  .get(function() {
    return `/user/${this._id}`;
  });

UserSchema
  .virtual('fullName')
  .get(function() {
    return this.firstName + ' ' + this.lastName;
  });

module.exports = mongoose.model('User', UserSchema);