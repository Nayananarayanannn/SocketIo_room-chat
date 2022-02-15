const moment = require('moment');

function formatImage(username,img){
    return{
      username,
      img,
      time: moment().format('h:mm a')
    }
  }
  module.exports= formatImage;