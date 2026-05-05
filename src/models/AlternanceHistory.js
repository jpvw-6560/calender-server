// Modèle Historique d'Alternance
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('AlternanceHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    alternanceType: { type: DataTypes.STRING, allowNull: false }, // ex: 'A', 'B'
    comment: { type: DataTypes.STRING },
  });
};
