const { v4: uuidv4 } = require("uuid");

module.exports = function(sequelize, Sequelize) {
  const Notice = sequelize.define("notice", {
    id: {
      primaryKey: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.UUID
    },
    title: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.TEXT
    },
    content: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.TEXT
    },
    deleted: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.BOOLEAN
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  Notice.getNotices = async function(inuse) {
    let where = null;
    if (inuse) {
      where = {
        deleted: false
      }
    }
    const notices = await this.findAll({
      attributes: ["id", "title", "content", "deleted", "createdAt", "updatedAt"
        //[sequelize.fn("date_format", sequelize.col("createdAt"), '%Y-%m-%d %T'), "createdAt"],
        //[sequelize.fn("date_format", sequelize.col("updatedAt"), '%Y-%m-%d %T'), "updatedAt"]
      ],
      where,
      order: [
        ['updatedAt', 'DESC'],
      ],
    });
    return notices;
  }

  Notice.registerNotice = async function(obj) {
    const { title, content, deleted } = obj;
    const id = await uuidv4();

    const notice = await this.create({
      id,
      title,
      content,
      deleted
    });

    return notice;
  }

  Notice.updateNotice = async function(obj) {
    const { id, title, content, deleted } = obj;

    const notice = await this.update({
      title,
      content,
      deleted
    }, {
      where: {
        id
      },
    });

    if (notice[0] === 1) return obj;
    else return null;
  }

  return Notice;
}
