import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || '';
		const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

		if (!token) {
			return res.status(401).json({ message: 'Not authorized, token missing' });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await prisma.user.findUnique({
			where: { id: decoded.id },
			select: { id: true, role: true, email: true, name: true },
		});

		if (!user) {
			return res.status(401).json({ message: 'Not authorized, user not found' });
		}

		req.user = user;
		return next();
	} catch (error) {
		return res.status(401).json({ message: 'Not authorized, token invalid', error: error.message });
	}
};

const authorizeRoles = (...roles) => (req, res, next) => {
	if (!req.user || !roles.includes(req.user.role)) {
		return res.status(403).json({ message: 'Forbidden: insufficient role permissions' });
	}
	return next();
};

export { protect, authorizeRoles };
