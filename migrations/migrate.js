// migrations/migrate.js
const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.sync({ force: false }); // force: true pour reset
    console.log('✅ Migration terminée');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur migration :', err);
    process.exit(1);
  }
})();
