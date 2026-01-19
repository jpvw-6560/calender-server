// Modèle Anniversaire
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Birthday', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    birthdate: { type: DataTypes.DATEONLY, allowNull: false },
    comment: { type: DataTypes.STRING },
  });
};
