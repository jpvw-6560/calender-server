// Modèle Jour Spécial (1er mai, Nouvel An, etc.)
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SpecialDay', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    alternanceType: { type: DataTypes.STRING, allowNull: false }, // ex: 'A', 'B', 'tous'
    comment: { type: DataTypes.STRING },
  });
};
