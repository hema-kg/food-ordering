const { sequelize } = require('../models/sequelize');

async function dbEncryptID(id){
  const [rows] = await sequelize.query('SELECT encryptId(?) AS encryptedID', { replacements: [id] });
  return rows[0]?.encryptedID;
}
async function dbDecryptID(uid){
  const [rows] = await sequelize.query('SELECT decryptId(?) AS decryptedID', { replacements: [uid] });
  return rows[0]?.decryptedID;
}

module.exports = { dbEncryptID, dbDecryptID };
