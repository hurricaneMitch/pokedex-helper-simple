const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = (req, res, next) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');

		if (!token) {
			return res.status(401).json({ message: 'No token, authorization denied' });
		}

		const decoded = jwt.verify(token, config.JWT_SECRET);
		req.userId = decoded.userId;
		next();
	} catch (err) {
		res.status(401).json({ message: 'Token is not valid' });
	}
};

module.exports = auth;
