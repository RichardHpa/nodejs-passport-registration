const express = require('express');
const router = express.Router();
const request = require('request');
const http = require("http");

module.exports.findById = function(id, callback){
    var options = {
        host: 'localhost',
        port: 5000,
        path: '/user/'+id,
        method: 'GET'
    };
    var httpreq = http.request(options, function (response) {
        var data = '';
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            data += chunk;
        });
        response.on('end', function() {
            return(null, JSON.stringify(data));
        })
    });
    httpreq.end();
}
