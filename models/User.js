class User {
  constructor(username, firstName, lastName, email, gender, profilePicture, profileCaption) {
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.gender = gender;
    this.profilePicture = profilePicture;
    this.profileCaption = profileCaption
  }
}

module.exports = User;