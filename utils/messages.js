const moment = require('moment');

function formatMessage(username, text,img) {
  return {
    username,
    text,
    img,
    time: moment().format('h:mm a')
  };
}


module.exports = formatMessage;
