const bcrypt = require('bcryptjs');
const saltRounds = 10;
const plainPassword = "Gutsisgoingtodiesoon2025";
const hashedPassword = bcrypt.hashSync(plainPassword, saltRounds);
console.log(hashedPassword);