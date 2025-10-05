const { sequelize } = require('../models/sequelize');
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB OK');
    const [rows] = await sequelize.query("SELECT DATABASE() db");
    console.log(rows[0]);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
