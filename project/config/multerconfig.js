const multer = require("multer");
const crypto = require('crypto');
const path = require("path")


//diskStorage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
   crypto.randomBytes(12, function(err, name){
    const fn = name.toString("hex") + path.extname(file.originalname)
    cb(null, fn)// phle cheez error and second cheez file ka naam null error 
   })
   
  }
})
// export and setup upload variable
const upload = multer({ storage: storage })
module.exports = upload;