// Modèle Vacances Scolaires
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SchoolHoliday', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY, allowNull: false },
    alternance: { type: DataTypes.STRING }, // ex: 'A', 'B', 'tous'
    comment: { type: DataTypes.STRING },
  });
};
