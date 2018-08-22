var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', function(req, res){
	console.log(req.user);
	res.render('index');
});

module.exports = router;
