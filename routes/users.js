const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect(`mongodb://0.0.0.0/instaclone`);

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  profilepicture: {
    type: String,
    default: "default.jpg"
  },
  bio: String,
  stories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "story"
    }
  ],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post"
  }],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  ],
  saved: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post" 
    }
  ]
});

userSchema.plugin(plm);
module.exports = mongoose.model('user', userSchema);
