const { getWindResponse } = require("../lib/wind");

module.exports = async (req, res) => {
  const { status, body } = await getWindResponse();
  res.status(status).json(body);
};
