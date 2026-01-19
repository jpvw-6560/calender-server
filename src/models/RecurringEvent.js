// Modèle Événement Récurrent
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RecurringEvent', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY },
    frequency: { type: DataTypes.STRING, allowNull: false }, // ex: 'biweekly', 'weekly'
    daysOfWeek: { type: DataTypes.STRING, allowNull: false }, // ex: 'samedi,dimanche'
  });
};
