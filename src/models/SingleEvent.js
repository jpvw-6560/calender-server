// Modèle Événement Ponctuel
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SingleEvent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    date: { type: DataTypes.DATE, allowNull: false },
    type: { type: DataTypes.STRING, allowNull: false }, // docteur, dentiste, contrôle technique, etc.
  });
};
